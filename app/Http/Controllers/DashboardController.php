<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Transaction;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'todays_sales' => Transaction::whereDate('created_at', today())->sum('total'),
            'items_in_stock' => Product::sum('stock_quantity'),
            'low_stock_count' => Product::whereColumn('stock_quantity', '<=', 'low_stock_threshold')->count(),
            'transactions_today' => Transaction::whereDate('created_at', today())->count(),
        ];

        $recentTransactions = Transaction::with(['items.product'])->latest()->take(5)->get();

        return view('dashboard', compact('stats', 'recentTransactions'));
    }
}
