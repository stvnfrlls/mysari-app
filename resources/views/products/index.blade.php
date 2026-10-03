@extends('layouts.app')

@section('title', 'Products')

@section('main-class', 'list-page')

@section('content')
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Products</h1>
                <p class="page-subtitle">Manage your inventory</p>
            </div>
            <div class="header-actions">
                <a href="{{ route('products.low-stock') }}" class="cta-button-secondary">Low Stock</a>
                <a href="{{ route('products.create') }}" class="cta-button">Add Product</a>
            </div>
        </div>

        @if (session('status'))
            <div class="status-box">{{ session('status') }}</div>
        @endif

        <div class="table-panel">
            @if ($products->isEmpty())
                <div class="empty-state">
                    <p>No products yet.</p>
                    <p class="empty-hint">Add your first product to start tracking inventory.</p>
                </div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>SKU</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($products as $product)
                            <tr>
                                <td>{{ $product->name }}</td>
                                <td class="muted">{{ $product->sku }}</td>
                                <td>₱{{ number_format($product->price, 2) }}</td>
                                <td>
                                    {{ $product->stock_quantity }}
                                    @if ($product->isLowStock())
                                        <span class="badge-low">Low</span>
                                    @endif
                                </td>
                                <td class="actions">
                                    <a href="{{ route('products.edit', $product) }}">Edit</a>
                                    @role('owner')
                                        <form method="POST" action="{{ route('products.destroy', $product) }}"
                                            onsubmit="return confirm('Delete this product?')">
                                            @csrf
                                            @method('DELETE')
                                            <button type="submit">Delete</button>
                                        </form>
                                    @endrole
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </div>
@endsection
