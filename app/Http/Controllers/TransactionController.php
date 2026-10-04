<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Jobs\CheckLowStock;

class TransactionController extends Controller
{
    public function index()
    {
        $transactions = Transaction::with(['items.product', 'user'])
            ->latest()
            ->paginate(15);

        return view('transactions.index', compact('transactions'));
    }

    public function create()
    {
        return view('transactions.create', [
            'products' => Product::orderBy('name')->get(),
            'customers' => Customer::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'is_credit' => ['nullable', 'boolean'],
            'customer_id' => ['required_if:is_credit,1', 'nullable', 'exists:customers,id'],
        ]);

        $isCredit = $request->boolean('is_credit');

        // Merge duplicate products so the stock check sees the combined quantity.
        $lines = collect($validated['items'])
            ->groupBy('product_id')
            ->map(fn($rows) => (int) $rows->sum('quantity'));

        $error = null;

        DB::transaction(function () use ($lines, $validated, $request, $isCredit, &$error) {
            $products = Product::whereIn('id', $lines->keys())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            abort_if($products->count() !== $lines->count(), 422, 'A selected product no longer exists.');

            foreach ($lines as $productId => $quantity) {
                $product = $products[$productId];

                if ($quantity > $product->stock_quantity) {
                    $error = $lines->count() > 1
                        ? "Not enough stock for {$product->name}. Only {$product->stock_quantity} available."
                        : "Not enough stock. Only {$product->stock_quantity} available.";

                    return;
                }
            }

            $total = 0;
            foreach ($lines as $productId => $quantity) {
                $total += $products[$productId]->price * $quantity;
            }

            if ($total > 99999999.99) {
                $error = 'Sale total is too large.';
                return;
            }

            $transaction = Transaction::create([
                'user_id' => $request->user()->id,
                'total' => round($total, 2),
                'is_credit' => $isCredit,
                'customer_id' => $isCredit ? $validated['customer_id'] : null,
            ]);

            foreach ($lines as $productId => $quantity) {
                $product = $products[$productId];

                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $product->price,
                    'unit_cost' => $product->cost_price,
                ]);

                $product->decrement('stock_quantity', $quantity);

                StockMovement::create([
                    'product_id' => $product->id,
                    'transaction_id' => $transaction->id,
                    'type' => 'sale',
                    'quantity_change' => -$quantity,
                ]);
            }
        });

        if ($error !== null) {
            return back()->withInput()->withErrors(['items' => $error]);
        }

        CheckLowStock::dispatch($lines->keys()->all());

        return redirect()->route('transactions.index')->with('status', 'Sale recorded.');
    }

    public function void(Request $request, Transaction $transaction)
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        DB::transaction(function () use ($transaction, $data) {
            if ($transaction->is_credit && $transaction->customer_id) {
                Customer::whereKey($transaction->customer_id)->lockForUpdate()->first();
            }

            $locked = Transaction::with('items')
                ->whereKey($transaction->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->isVoided()) {
                return;
            }

            foreach ($locked->items as $item) {
                Product::whereKey($item->product_id)->increment('stock_quantity', $item->quantity);

                StockMovement::create([
                    'product_id'      => $item->product_id,
                    'transaction_id'  => $locked->id,
                    'type'            => 'void',
                    'quantity_change' => $item->quantity,
                    'note'            => $data['reason'] ?? null,
                ]);
            }

            $locked->forceFill([
                'voided_at'   => now(),
                'void_reason' => $data['reason'] ?? null,
            ])->save();
        });

        CheckLowStock::dispatch($transaction->items()->pluck('product_id')->unique()->all());

        return redirect()->route('transactions.index')->with('status', 'Transaction voided.');
    }
}
