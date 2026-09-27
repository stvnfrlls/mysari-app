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
                                    <a href="{{ route('products.edit', $product) }}">Restock</a>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </div>
@endsection
