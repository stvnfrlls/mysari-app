<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\TransactionItem;
use Carbon\Carbon;

class SalesReport
{
    /**
     * @return array{0: array, 1: \Illuminate\Support\Collection}
     */
    public static function data(Carbon $from, Carbon $to): array
    {
        $from = $from->copy()->startOfDay();
        $to = $to->copy()->endOfDay();

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

        return [$summary, $productBreakdown];
    }

    /**
     * @param  resource  $out
     */
    public static function writeCsv($out, iterable $productBreakdown): void
    {
        fwrite($out, "\xEF\xBB\xBF");
        fputcsv($out, ['Product', 'Units Sold', 'Revenue', 'Cost', 'Profit'], ',', '"', '');

        foreach ($productBreakdown as $row) {
            $hasCost = $row->total_cost !== null;

            fputcsv($out, [
                self::csvSafe($row->product->name ?? 'Deleted product'),
                $row->total_quantity,
                number_format((float) $row->total_revenue, 2, '.', ''),
                $hasCost ? number_format((float) $row->total_cost, 2, '.', '') : '',
                $hasCost
                    ? number_format((float) $row->costed_revenue - (float) $row->total_cost, 2, '.', '')
                    : '',
            ], ',', '"', '');
        }
    }

    private static function csvSafe(string $value): string
    {
        return preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
    }
}
