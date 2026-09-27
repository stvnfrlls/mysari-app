@extends('layouts.app')

@section('title', 'Products')

@section('content')
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Products</h1>
                <p class="page-subtitle">Manage your inventory</p>
            </div>
            <a href="{{ route('products.create') }}" class="cta-button">Add Product</a>
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
                                    <form method="POST" action="{{ route('products.destroy', $product) }}"
                                        onsubmit="return confirm('Delete this product?')">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </div>
@endsection

@section('styles')
    <style>
        main {
            align-items: flex-start;
            padding: 48px 40px;
        }

        .page {
            width: 100%;
            max-width: 960px;
            margin: 0 auto;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 28px;
        }

        .page-header h1 {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 26px;
            letter-spacing: -0.3px;
            margin-bottom: 4px;
        }

        .page-subtitle {
            color: #888;
            font-size: 14px;
        }

        .cta-button {
            padding: 11px 22px;
            background: #f5f5f5;
            color: #0a0a0a;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
        }

        .status-box {
            background: #14251a;
            border: 1px solid #1f3d2a;
            color: #7fd99a;
            font-size: 13px;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .table-panel {
            background: #111111;
            border: 1px solid #1f1f1f;
            border-radius: 12px;
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            text-align: left;
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            color: #888;
            padding: 16px 20px;
            border-bottom: 1px solid #1f1f1f;
        }

        td {
            padding: 16px 20px;
            font-size: 14px;
            border-bottom: 1px solid #181818;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .muted {
            color: #888;
        }

        .badge-low {
            display: inline-block;
            margin-left: 8px;
            padding: 2px 8px;
            background: #2a1414;
            color: #ff8080;
            font-size: 11px;
            font-weight: 600;
            border-radius: 4px;
        }

        .actions {
            display: flex;
            gap: 14px;
        }

        .actions a,
        .actions button {
            background: none;
            border: none;
            color: #aaa;
            font-size: 13px;
            font-family: var(--font-sans);
            cursor: pointer;
            text-decoration: none;
            padding: 0;
        }

        .actions a:hover,
        .actions button:hover {
            color: #f5f5f5;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #777;
        }

        .empty-hint {
            margin-top: 6px;
            font-size: 13px;
            color: #555;
        }
    </style>
@endsection
