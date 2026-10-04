<?php

namespace App\Http\Controllers;

use App\Models\LowStockAlert;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\DailySummary;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = $this->stats();
        $today = $this->today();
        $lowStockAlerts = $this->openAlerts();
        $topProducts = $this->topProducts();
        $recentTransactions = $this->recentTransactions();
        $yesterday = DailySummary::where('summary_date', today()->subDay()->toDateString())->first();

        return view('dashboard', compact('stats', 'today', 'topProducts', 'recentTransactions', 'lowStockAlerts', 'yesterday'));
    }

    public function data()
    {
        $stats = $this->stats();
        $today = $this->today();

        return response()->json([
            'todays_sales' => '₱' . number_format($stats['todays_sales'], 2),
            'items_in_stock' => (string) $stats['items_in_stock'],
            'low_stock_count' => (string) $stats['low_stock_count'],
            'transactions_today' => (string) $stats['transactions_today'],
            'cash' => '₱' . number_format($today['cash'], 2),
            'credit' => '₱' . number_format($today['credit'], 2),
            'utang_outstanding' => '₱' . number_format($today['utang_outstanding'], 2),
            'alerts' => $this->openAlerts()->map(fn($alert) => [
                'name' => $alert->product->name,
                'left' => $alert->product->stock_quantity,
                'since' => $alert->created_at->diffForHumans(),
            ])->values(),
            'top_products' => $this->topProducts()->map(fn($row) => [
                'name' => $row->product->name ?? 'Deleted product',
                'units' => (int) $row->units_sold,
            ])->values(),
            'recent' => $this->recentTransactions()->map(fn($transaction) => [
                'items' => $transaction->items
                    ->map(fn($item) => $item->quantity . '× ' . ($item->product->name ?? 'Deleted product'))
                    ->implode(', '),
                'total' => '₱' . number_format($transaction->total, 2),
                'since' => $transaction->created_at->diffForHumans(),
            ])->values(),
        ]);
    }

    private function stats(): array
    {
        return [
            'todays_sales' => Transaction::active()->whereDate('created_at', today())->sum('total'),
            'items_in_stock' => Product::sum('stock_quantity'),
            'low_stock_count' => Product::whereColumn('stock_quantity', '<=', 'low_stock_threshold')->count(),
            'transactions_today' => Transaction::active()->whereDate('created_at', today())->count(),
        ];
    }

    private function today(): array
    {
        return [
            'cash' => Transaction::active()
                ->whereDate('created_at', today())
                ->where('is_credit', false)
                ->sum('total'),
            'credit' => Transaction::active()
                ->whereDate('created_at', today())
                ->where('is_credit', true)
                ->sum('total'),
            'utang_outstanding' => Transaction::active()->where('is_credit', true)->sum('total')
                - Payment::active()->sum('amount'),
        ];
    }

    private function openAlerts()
    {
        return LowStockAlert::open()
            ->with('product')
            ->latest()
            ->take(5)
            ->get();
    }

    private function topProducts()
    {
        return TransactionItem::query()
            ->whereHas('transaction', function ($query) {
                $query->active()->whereDate('created_at', today());
            })
            ->selectRaw('product_id, SUM(quantity) as units_sold')
            ->groupBy('product_id')
            ->orderByDesc('units_sold')
            ->with('product')
            ->take(3)
            ->get();
    }

    private function recentTransactions()
    {
        return Transaction::active()
            ->with(['items.product'])
            ->latest()
            ->take(5)
            ->get();
    }
}
