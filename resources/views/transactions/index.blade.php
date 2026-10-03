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
                            <th>Items</th>
                            <th>Total</th>
                            <th>Recorded By</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($transactions as $transaction)
                            <tr @class(['voided' => $transaction->isVoided()])>
                                <td class="muted">{{ $transaction->created_at->format('M j, Y g:i A') }}</td>
                                <td>
                                    @foreach ($transaction->items as $item)
                                        <div>{{ $item->product->name ?? 'Deleted product' }} × {{ $item->quantity }}</div>
                                    @endforeach
                                </td>
                                <td>₱{{ number_format($transaction->total, 2) }}</td>
                                <td class="muted">{{ $transaction->user->name }}</td>
                                <td class="actions">
                                    @if ($transaction->isVoided())
                                        <span class="badge-voided" title="{{ $transaction->void_reason }}">Voided</span>
                                    @else
                                        @role('owner')
                                            <form method="POST" action="{{ route('transactions.void', $transaction) }}"
                                                onsubmit="return confirm('Void this sale and restore stock?')">
                                                @csrf
                                                <button type="submit" class="void-button">Void</button>
                                            </form>
                                        @endrole
                                    @endif
                                </td>
                            </tr>
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

        tr.voided td {
            opacity: 0.5;
            text-decoration: line-through;
        }

        tr.voided td.actions {
            opacity: 1;
            text-decoration: none;
        }

        .actions {
            text-align: right;
            white-space: nowrap;
        }

        .void-button {
            background: transparent;
            border: 1px solid #3a1f1f;
            color: #e5484d;
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 12px;
            cursor: pointer;
        }

        .void-button:hover {
            background: #2a1214;
        }

        .badge-voided {
            color: #888;
            font-size: 12px;
            border: 1px solid #2a2a2a;
            border-radius: 999px;
            padding: 2px 10px;
        }
    </style>
@endsection
