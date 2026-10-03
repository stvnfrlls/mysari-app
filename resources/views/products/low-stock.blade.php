@extends('layouts.app')

@section('title', 'Low Stock')

@section('main-class', 'list-page')

@section('content')
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Low Stock</h1>
                <p class="page-subtitle">Items at or below their restock threshold</p>
            </div>
            <a href="{{ route('products.index') }}" class="cta-button">Back to Inventory</a>
        </div>

        @if (session('status'))
            <div class="status-box">{{ session('status') }}</div>
        @endif

        @if ($errors->any())
            <div class="status-box">{{ $errors->first() }}</div>
        @endif

        <div class="table-panel">
            @if ($products->isEmpty())
                <div class="empty-state">
                    <p>Nothing's low right now.</p>
                    <p class="empty-hint">All products are above their restock threshold.</p>
                </div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>SKU</th>
                            <th>Stock</th>
                            <th>Threshold</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($products as $product)
                            <tr>
                                <td>{{ $product->name }}</td>
                                <td class="muted">{{ $product->sku }}</td>
                                <td>{{ $product->stock_quantity }} <span class="badge-low">Low</span></td>
                                <td class="muted">{{ $product->low_stock_threshold }}</td>
                                <td class="actions">
                                    <form method="POST" action="{{ route('products.restock', $product) }}"
                                        class="restock-form">
                                        @csrf
                                        <input type="number" name="quantity" min="1" placeholder="Qty" required>
                                        <input type="text" name="note" placeholder="Note (optional)" maxlength="255">
                                        <button type="submit" class="restock-button">Restock</button>
                                    </form>
                                    <a href="{{ route('products.history', $product) }}" class="row-link">History</a>
                                    @role('owner')
                                        <a href="{{ route('products.edit', $product) }}" class="row-link">Edit</a>
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

@section('styles')
    <style>
        .restock-form {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-right: 10px;
        }

        .restock-form input {
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #eee;
            padding: 5px 8px;
            font-size: 12px;
        }

        .restock-form input[name="quantity"] {
            width: 64px;
        }

        .restock-form input[name="note"] {
            width: 140px;
        }

        .restock-button {
            background: transparent;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #eee;
            padding: 5px 10px;
            font-size: 12px;
            cursor: pointer;
        }

        .restock-button:hover {
            background: #1a1a1a;
        }

        .row-link {
            color: #888;
            font-size: 12px;
            margin-left: 8px;
        }
    </style>
@endsection
