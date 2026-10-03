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

        $itemsInRange = fn() => TransactionItem::whereHas('transaction', function ($query) use ($from, $to) {
            $query->active()->whereBetween('created_at', [$from, $to]);
        });

        $totals = $itemsInRange()
            ->selectRaw('SUM(CASE WHEN unit_cost IS NOT NULL THEN quantity * unit_price END) as costed_revenue')
            ->selectRaw('SUM(CASE WHEN unit_cost IS NOT NULL THEN quantity * unit_cost END) as total_cost')
            ->selectRaw('SUM(CASE WHEN unit_cost IS NULL THEN 1 ELSE 0 END) as uncosted_lines')
            ->first();

        $totalCost = $totals->total_cost !== null ? (float) $totals->total_cost : null;

        $summary = [
            'total_revenue' => Transaction::active()->whereBetween('created_at', [$from, $to])->sum('total'),
            'transaction_count' => Transaction::active()->whereBetween('created_at', [$from, $to])->count(),
            'total_cost' => $totalCost,
            'profit' => $totalCost !== null ? (float) $totals->costed_revenue - $totalCost : null,
            'uncosted_lines' => (int) $totals->uncosted_lines,
        ];

        $productBreakdown = $itemsInRange()
            ->selectRaw('product_id')
            ->selectRaw('SUM(quantity) as total_quantity')
            ->selectRaw('SUM(quantity * unit_price) as total_revenue')
            ->selectRaw('SUM(CASE WHEN unit_cost IS NOT NULL THEN quantity END) as costed_quantity')
            ->selectRaw('SUM(CASE WHEN unit_cost IS NOT NULL THEN quantity * unit_price END) as costed_revenue')
            ->selectRaw('SUM(CASE WHEN unit_cost IS NOT NULL THEN quantity * unit_cost END) as total_cost')
            ->groupBy('product_id')
            ->with('product')
            ->orderByDesc('total_revenue')
            ->get();

        return view('reports.sales', compact('summary', 'productBreakdown', 'from', 'to'));
    }
}
