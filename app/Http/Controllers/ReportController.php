<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : now()->startOfMonth();

        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'))->endOfDay()
            : now()->endOfDay();

        $summary = [
            'total_revenue' => Transaction::active()->whereBetween('created_at', [$from, $to])->sum('total'),
            'transaction_count' => Transaction::active()->whereBetween('created_at', [$from, $to])->count(),
        ];

        $productBreakdown = TransactionItem::whereHas('transaction', function ($query) use ($from, $to) {
            $query->active()->whereBetween('created_at', [$from, $to]);
        })
            ->selectRaw('product_id, SUM(quantity) as total_quantity, SUM(quantity * unit_price) as total_revenue')
            ->groupBy('product_id')
            ->with('product')
            ->orderByDesc('total_revenue')
            ->get();

        return view('reports.sales', compact('summary', 'productBreakdown', 'from', 'to'));
    }
}
