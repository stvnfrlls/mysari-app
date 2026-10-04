@extends('layouts.app')

@section('title', 'Daily Summaries')

@section('main-class', 'list-page')

@section('content')
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Daily Summaries</h1>
                <p class="page-subtitle">One row per day, built at 00:10</p>
            </div>
        </div>

        <div class="table-panel" id="summaryList">
            @if ($summaries->isEmpty())
                <div class="empty-state">
                    <p>No summaries yet.</p>
                </div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Total sales</th>
                            <th>Transactions</th>
                            <th>Cash</th>
                            <th>Credit</th>
                            <th>Utang at close</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($summaries as $summary)
                            <tr class="summary-row">
                                <td>{{ $summary->summary_date->format('M j, Y') }}</td>
                                <td>₱{{ number_format($summary->total_sales, 2) }}</td>
                                <td>{{ $summary->transactions_count }}</td>
                                <td>₱{{ number_format($summary->cash, 2) }}</td>
                                <td>₱{{ number_format($summary->credit, 2) }}</td>
                                <td>₱{{ number_format($summary->utang_outstanding, 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

        <div class="pagination">
            {{ $summaries->links() }}
        </div>
    </div>
@endsection
