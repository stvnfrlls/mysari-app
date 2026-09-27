@extends('layouts.app')

@section('title', 'Transactions')

@section('content')
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Transactions</h1>
                <p class="page-subtitle">Sales history</p>
            </div>
            <a href="{{ route('transactions.create') }}" class="cta-button">Record Sale</a>
        </div>

        @if (session('status'))
            <div class="status-box">{{ session('status') }}</div>
        @endif

        <div class="table-panel">
            @if ($transactions->isEmpty())
                <div class="empty-state">
                    <p>No sales recorded yet.</p>
                </div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Total</th>
                            <th>Recorded By</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($transactions as $transaction)
                            @foreach ($transaction->items as $item)
                                <tr>
                                    <td class="muted">{{ $transaction->created_at->format('M j, Y g:i A') }}</td>
                                    <td>{{ $item->product->name ?? 'Deleted product' }}</td>
                                    <td>{{ $item->quantity }}</td>
                                    <td>₱{{ number_format($transaction->total, 2) }}</td>
                                    <td class="muted">{{ $transaction->user->name }}</td>
                                </tr>
                            @endforeach
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

        <div class="pagination">
            {{ $transactions->links() }}
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

        .table-panel {
            background: #111111;
            border: 1px solid #1f1f1f;
            border-radius: 12px;
            overflow: hidden;
        }

        .muted {
            color: #888;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #777;
        }

        .pagination {
            margin-top: 20px;
        }
    </style>
@endsection
