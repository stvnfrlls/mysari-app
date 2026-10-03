@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
    <div class="dashboard">
        <div class="dashboard-header">
            <div>
                <h1>Dashboard</h1>
                <p class="dashboard-subtitle">Welcome back, {{ auth()->user()->name }}</p>
            </div>
        </div>

        <div class="stat-grid">
            <div class="stat-card">
                <p class="stat-label">Today's Sales</p>
                <p class="stat-value">₱{{ number_format($stats['todays_sales'], 2) }}</p>
            </div>
            <div class="stat-card">
                <p class="stat-label">Items in Stock</p>
                <p class="stat-value">{{ $stats['items_in_stock'] }}</p>
            </div>
            <div class="stat-card">
                <p class="stat-label">Low Stock Alerts</p>
                <p class="stat-value">{{ $stats['low_stock_count'] }}</p>
            </div>
            <div class="stat-card">
                <p class="stat-label">Transactions Today</p>
                <p class="stat-value">{{ $stats['transactions_today'] }}</p>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card" id="todayCash">
                <p class="summary-label">Cash Sales Today</p>
                <p class="summary-value">₱{{ number_format($today['cash'], 2) }}</p>
            </div>
            <div class="summary-card" id="todayCredit">
                <p class="summary-label">Credit Sales Today</p>
                <p class="summary-value">₱{{ number_format($today['credit'], 2) }}</p>
            </div>
            <div class="summary-card" id="utangOutstanding">
                <p class="summary-label">Utang Outstanding</p>
                <p class="summary-value">₱{{ number_format($today['utang_outstanding'], 2) }}</p>
            </div>
        </div>

        <div class="activity-panel top-panel" id="topProducts">
            <h2>Top Sellers Today</h2>
            @if ($topProducts->isEmpty())
                <div class="activity-empty">
                    <p>No sales yet today.</p>
                </div>
            @else
                @foreach ($topProducts as $row)
                    <p class="top-row">
                        <span>{{ $row->product->name ?? 'Deleted product' }}</span>
                        <span class="muted">{{ $row->units_sold }} sold</span>
                    </p>
                @endforeach
            @endif
        </div>

        <div class="activity-panel">
            <h2>Recent Activity</h2>
            @if ($recentTransactions->isEmpty())
                <div class="activity-empty">
                    <p>No activity yet.</p>
                    <p class="activity-hint">Sales and stock updates will appear here once you start recording them.</p>
                </div>
            @else
                @foreach ($recentTransactions as $transaction)
                    <p class="activity-row">
                        <span>
                            Sold
                            @foreach ($transaction->items as $item)
                                {{ $item->quantity }}× {{ $item->product->name ?? 'Deleted product' }}@if (!$loop->last)
                                    ,
                                @endif
                            @endforeach
                            — ₱{{ number_format($transaction->total, 2) }}
                        </span>
                        <span class="muted">{{ $transaction->created_at->diffForHumans() }}</span>
                    </p>
                @endforeach
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

        .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .dashboard {
            width: 100%;
            max-width: 960px;
            margin: 0 auto;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
        }

        .dashboard-header h1 {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 26px;
            letter-spacing: -0.3px;
            margin-bottom: 4px;
        }

        .dashboard-subtitle {
            color: #888;
            font-size: 14px;
        }

        .stat-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 16px;
        }

        .stat-card {
            background: #111111;
            border: 1px solid #1f1f1f;
            border-radius: 12px;
            padding: 20px;
        }

        .stat-label {
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 10px;
        }

        .stat-value {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 24px;
            letter-spacing: -0.3px;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 40px;
        }

        .summary-card {
            background: #111111;
            border: 1px solid #1f1f1f;
            border-radius: 12px;
            padding: 20px;
        }

        .summary-label {
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            color: #888;
            margin-bottom: 10px;
        }

        .summary-value {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 20px;
            letter-spacing: -0.3px;
        }

        .top-panel {
            margin-bottom: 24px;
        }

        .activity-row,
        .top-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #1a1a1a;
            font-size: 14px;
        }

        .activity-row:last-child,
        .top-row:last-child {
            border-bottom: none;
        }

        .muted {
            color: #777;
            font-size: 13px;
        }

        .activity-panel {
            background: #111111;
            border: 1px solid #1f1f1f;
            border-radius: 12px;
            padding: 28px;
        }

        .activity-panel h2 {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 16px;
            margin-bottom: 20px;
        }

        .activity-empty {
            text-align: center;
            padding: 40px 20px;
            color: #777;
        }

        .activity-empty p {
            font-size: 14px;
        }

        .activity-hint {
            margin-top: 6px;
            font-size: 13px;
            color: #555;
        }

        @media (max-width: 720px) {
            .stat-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .summary-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
@endsection
