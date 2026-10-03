<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'is_credit' => ['nullable', 'boolean'],
            'customer_id' => ['required_if:is_credit,1', 'nullable', 'exists:customers,id'],
        ]);

        $isCredit = $request->boolean('is_credit');
        $available = null;

        DB::transaction(function () use ($validated, $request, $isCredit, &$available) {
            $product = Product::whereKey($validated['product_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($validated['quantity'] > $product->stock_quantity) {
                $available = $product->stock_quantity;
                return;
            }

            $transaction = Transaction::create([
                'user_id' => $request->user()->id,
                'total' => $product->price * $validated['quantity'],
                'is_credit' => $isCredit,
                'customer_id' => $isCredit ? $validated['customer_id'] : null,
            ]);

            TransactionItem::create([
                'transaction_id' => $transaction->id,
                'product_id' => $product->id,
                'quantity' => $validated['quantity'],
                'unit_price' => $product->price,
            ]);

            $product->decrement('stock_quantity', $validated['quantity']);

            StockMovement::create([
                'product_id' => $product->id,
                'transaction_id' => $transaction->id,
                'type' => 'sale',
                'quantity_change' => -$validated['quantity'],
            ]);
        });

        if ($available !== null) {
            return back()
                ->withInput()
                ->withErrors(['quantity' => 'Not enough stock. Only ' . $available . ' available.']);
        }

        return redirect()->route('transactions.index')->with('status', 'Sale recorded.');
    }

    public function void(Request $request, Transaction $transaction)
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        DB::transaction(function () use ($transaction, $data) {
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

        return redirect()->route('transactions.index')->with('status', 'Transaction voided.');
    }
}
