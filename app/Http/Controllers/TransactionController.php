<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
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
        $products = Product::orderBy('name')->get();

        return view('transactions.create', compact('products'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if ($validated['quantity'] > $product->stock_quantity) {
            return back()
                ->withInput()
                ->withErrors(['quantity' => 'Not enough stock. Only ' . $product->stock_quantity . ' available.']);
        }

        DB::transaction(function () use ($product, $validated, $request) {
            $total = $product->price * $validated['quantity'];

            $transaction = Transaction::create([
                'user_id' => $request->user()->id,
                'total' => $total,
            ]);

            TransactionItem::create([
                'transaction_id' => $transaction->id,
                'product_id' => $product->id,
                'quantity' => $validated['quantity'],
                'unit_price' => $product->price,
            ]);

            $product->decrement('stock_quantity', $validated['quantity']);
        });

        return redirect()->route('transactions.index')->with('status', 'Sale recorded.');
    }
}
