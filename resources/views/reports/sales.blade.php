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
            <div class="table-panel" style="flex:1; padding:20px;" id="costCard">
                <p class="page-subtitle">Cost of Goods</p>
                <p style="font-size:28px; font-weight:600;">
                    {{ $summary['total_cost'] === null ? '—' : '₱' . number_format($summary['total_cost'], 2) }}
                </p>
            </div>
            <div class="table-panel" style="flex:1; padding:20px;" id="profitCard">
                <p class="page-subtitle">Profit</p>
                <p style="font-size:28px; font-weight:600;">
                    {{ $summary['profit'] === null ? '—' : '₱' . number_format($summary['profit'], 2) }}
                </p>
            </div>
            <div class="table-panel" style="flex:1; padding:20px;">
                <p class="page-subtitle">Transactions</p>
                <p style="font-size:28px; font-weight:600;">{{ $summary['transaction_count'] }}</p>
            </div>
        </div>

        @if ($summary['uncosted_lines'] > 0)
            <p class="page-subtitle" id="costNote" style="margin-bottom:24px;">
                {{ $summary['uncosted_lines'] }} sale {{ Str::plural('line', $summary['uncosted_lines']) }}
                without a cost {{ $summary['uncosted_lines'] === 1 ? 'is' : 'are' }} left out of cost and profit.
            </p>
        @endif

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
                            <th>Cost</th>
                            <th>Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($productBreakdown as $row)
                            @php
                                $hasCost = $row->total_cost !== null;
                                $rowProfit = $hasCost ? (float) $row->costed_revenue - (float) $row->total_cost : null;
                                $partial = $hasCost && (int) $row->costed_quantity < (int) $row->total_quantity;
                            @endphp
                            <tr>
                                <td>{{ $row->product->name ?? 'Deleted product' }}</td>
                                <td>{{ $row->total_quantity }}</td>
                                <td>₱{{ number_format($row->total_revenue, 2) }}</td>
                                <td>{{ $hasCost ? '₱' . number_format($row->total_cost, 2) : '—' }}</td>
                                <td>
                                    {{ $hasCost ? '₱' . number_format($rowProfit, 2) : '—' }}
                                    @if ($partial)
                                        <span class="muted" title="Only units with a cost are included">*</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </div>
@endsection
