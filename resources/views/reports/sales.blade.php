@extends('layouts.app')

@section('title', 'Sales Report')

@section('main-class', 'list-page')

@section('content')
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Sales Report</h1>
                <p class="page-subtitle">{{ $from->format('M j, Y') }} – {{ $to->format('M j, Y') }}</p>
            </div>
        </div>

        <form method="GET" action="{{ route('reports.sales') }}"
            style="display:flex; gap:12px; margin-bottom:24px; align-items:flex-end;">
            <div>
                <label>From</label>
                <input type="date" name="from" value="{{ $from->format('Y-m-d') }}">
            </div>
            <div>
                <label>To</label>
                <input type="date" name="to" value="{{ $to->format('Y-m-d') }}">
            </div>
            <button type="submit" class="cta-button">Apply</button>
        </form>

        <div style="display:flex; gap:16px; margin-bottom:24px;">
            <div class="table-panel" style="flex:1; padding:20px;">
                <p class="page-subtitle">Total Revenue</p>
                <p style="font-size:28px; font-weight:600;">₱{{ number_format($summary['total_revenue'], 2) }}</p>
            </div>
            <div class="table-panel" style="flex:1; padding:20px;">
                <p class="page-subtitle">Transactions</p>
                <p style="font-size:28px; font-weight:600;">{{ $summary['transaction_count'] }}</p>
            </div>
        </div>

        <div class="table-panel">
            @if ($productBreakdown->isEmpty())
                <div class="empty-state">
                    <p>No sales in this period.</p>
                </div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Units Sold</th>
                            <th>Revenue</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($productBreakdown as $row)
                            <tr>
                                <td>{{ $row->product->name ?? 'Deleted product' }}</td>
                                <td>{{ $row->total_quantity }}</td>
                                <td>₱{{ number_format($row->total_revenue, 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </div>
@endsection
