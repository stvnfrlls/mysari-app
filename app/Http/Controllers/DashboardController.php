<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'todays_sales' => Transaction::active()->whereDate('created_at', today())->sum('total'),
            'items_in_stock' => Product::sum('stock_quantity'),
            'low_stock_count' => Product::whereColumn('stock_quantity', '<=', 'low_stock_threshold')->count(),
            'transactions_today' => Transaction::active()->whereDate('created_at', today())->count(),
        ];

        $today = [
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

        $topProducts = TransactionItem::query()
            ->whereHas('transaction', function ($query) {
                $query->active()->whereDate('created_at', today());
            })
            ->selectRaw('product_id, SUM(quantity) as units_sold')
            ->groupBy('product_id')
            ->orderByDesc('units_sold')
            ->with('product')
            ->take(3)
            ->get();

        $recentTransactions = Transaction::active()
            ->with(['items.product'])
            ->latest()
            ->take(5)
            ->get();

        return view('dashboard', compact('stats', 'today', 'topProducts', 'recentTransactions'));
    }
}
