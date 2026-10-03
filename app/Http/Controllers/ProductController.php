<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::orderBy('name')->get();

        return view('products.index', compact('products'));
    }

    public function create()
    {
        return view('products.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
        ]);

        Product::create($validated);

        return redirect()->route('products.index')->with('status', 'Product added.');
    }

    public function edit(Product $product)
    {
        return view('products.edit', compact('product'));
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku,' . $product->id],
            'price' => ['required', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'low_stock_threshold' => ['required', 'integer', 'min:0'],
        ]);

        DB::transaction(function () use ($product, $validated) {
            $locked = Product::whereKey($product->id)->lockForUpdate()->firstOrFail();
            $change = (int) $validated['stock_quantity'] - $locked->stock_quantity;

            $locked->update($validated);

            if ($change !== 0) {
                StockMovement::create([
                    'product_id'      => $locked->id,
                    'type'            => 'adjustment',
                    'quantity_change' => $change,
                    'note'            => 'Edited from product form',
                ]);
            }
        });

        return redirect()->route('products.index')->with('status', 'Product updated.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->route('products.index')->with('status', 'Product deleted.');
    }

    public function lowStock()
    {
        $products = Product::whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->orderBy('stock_quantity')
            ->get();

        return view('products.low-stock', compact('products'));
    }

    public function restock(Request $request, Product $product)
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1', 'max:100000'],
            'note'     => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($product, $data) {
            $locked = Product::whereKey($product->id)->lockForUpdate()->firstOrFail();
            $locked->increment('stock_quantity', $data['quantity']);

            StockMovement::create([
                'product_id'      => $locked->id,
                'type'            => 'restock',
                'quantity_change' => $data['quantity'],
                'note'            => $data['note'] ?? null,
            ]);
        });

        return back()->with('status', 'Stock updated.');
    }

    public function history(Product $product)
    {
        $movements = $product->movements()->paginate(25);

        return view('products.history', compact('product', 'movements'));
    }
}
