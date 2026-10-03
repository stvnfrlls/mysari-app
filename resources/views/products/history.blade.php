@extends('layouts.app')

@section('title', 'Stock History')

@section('main-class', 'list-page')

@section('content')
    <div class="page">
        <div class="page-header">
            <div>
                <h1>{{ $product->name }}</h1>
                <p class="page-subtitle">Stock history · Current stock: {{ $product->stock_quantity }}</p>
            </div>
            <a href="{{ route('products.index') }}" class="cta-button">Back to Inventory</a>
        </div>

        <div class="table-panel">
            @if ($movements->isEmpty())
                <div class="empty-state">
                    <p>No stock movements recorded yet.</p>
                </div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Change</th>
                            <th>Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($movements as $m)
                            <tr>
                                <td class="muted">{{ $m->created_at->format('M j, Y g:i A') }}</td>
                                <td>{{ ucfirst($m->type) }}</td>
                                <td class="{{ $m->quantity_change > 0 ? 'positive' : 'negative' }}">
                                    {{ $m->quantity_change > 0 ? '+' : '' }}{{ $m->quantity_change }}
                                </td>
                                <td class="muted">{{ $m->note }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

        <div class="pagination">
            {{ $movements->links() }}
        </div>
    </div>
@endsection

@section('styles')
    <style>
        .positive {
            color: #3fb950;
        }

        .negative {
            color: #e5484d;
        }
    </style>
@endsection
