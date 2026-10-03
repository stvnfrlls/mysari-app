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

        @if ($errors->has('product'))
            <div class="error-box">{{ $errors->first('product') }}</div>
        @endif

        <form method="GET" action="{{ route('products.index') }}" class="search-form">
            <input type="search" name="q" value="{{ $search }}" placeholder="Search by name or SKU"
                maxlength="100" aria-label="Search products">
            <button type="submit" class="form-button">Search</button>
            @if ($search !== '')
                <a href="{{ route('products.index') }}" class="clear-link">Clear</a>
            @endif
        </form>

        <div class="table-panel">
            @if ($products->isEmpty())
                <div class="empty-state">
                    @if ($search !== '')
                        <p>No products match "{{ $search }}".</p>
                        <p class="empty-hint">Try a different name or SKU.</p>
                    @else
                        <p>No products yet.</p>
                        <p class="empty-hint">Add your first product to start tracking inventory.</p>
                    @endif
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
                                    @role('owner')
                                        <a href="{{ route('products.edit', $product) }}">Edit</a>
                                    @endrole
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

        <div class="pagination">
            {{ $products->links() }}
        </div>
    </div>
@endsection

@section('styles')
    <style>
        .error-box {
            background: #2a1212;
            border: 1px solid #5a2323;
            border-radius: 6px;
            color: #f5b5b5;
            padding: 10px 14px;
            font-size: 13px;
            margin-bottom: 16px;
        }

        .search-form {
            display: flex;
            gap: 8px;
            align-items: center;
            margin-bottom: 20px;
        }

        .search-form input {
            flex: 1;
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #eee;
            padding: 8px 10px;
            font-size: 13px;
        }

        .form-button {
            background: transparent;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #eee;
            padding: 8px 14px;
            font-size: 13px;
            cursor: pointer;
        }

        .form-button:hover {
            background: #1a1a1a;
        }

        .clear-link {
            color: #888;
            font-size: 13px;
            text-decoration: none;
        }

        .clear-link:hover {
            color: #f5f5f5;
        }

        .pagination {
            margin-top: 20px;
        }

        .pagination svg {
            width: 16px;
            height: 16px;
        }
    </style>
@endsection
