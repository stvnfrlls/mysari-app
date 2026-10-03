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
        [$from, $to, $summary, $productBreakdown] = $this->salesData($request);

        return view('reports.sales', compact('summary', 'productBreakdown', 'from', 'to'));
    }

    public function exportSales(Request $request)
    {
        [$from, $to,, $productBreakdown] = $this->salesData($request);

        $filename = sprintf('sales-report-%s-to-%s.csv', $from->format('Y-m-d'), $to->format('Y-m-d'));

        return response()->streamDownload(function () use ($productBreakdown) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Product', 'Units Sold', 'Revenue', 'Cost', 'Profit'], ',', '"', '');

            foreach ($productBreakdown as $row) {
                $hasCost = $row->total_cost !== null;

                fputcsv($out, [
                    $this->csvSafe($row->product->name ?? 'Deleted product'),
                    $row->total_quantity,
                    number_format((float) $row->total_revenue, 2, '.', ''),
                    $hasCost ? number_format((float) $row->total_cost, 2, '.', '') : '',
                    $hasCost
                        ? number_format((float) $row->costed_revenue - (float) $row->total_cost, 2, '.', '')
                        : '',
                ], ',', '"', '');
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function salesData(Request $request): array
    {
        $from = ($this->parseDate($request->input('from')) ?? now()->startOfMonth())->startOfDay();
        $to = ($this->parseDate($request->input('to')) ?? now())->endOfDay();

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

        return [$from, $to, $summary, $productBreakdown];
    }

    private function csvSafe(string $value): string
    {
        return preg_match('/^[=+\-@\t\r]/', $value) ? "'" . $value : $value;
    }

    private function parseDate(mixed $value): ?Carbon
    {
        if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return null;
        }

        try {
            return Carbon::createFromFormat('Y-m-d', $value) ?: null;
        } catch (\Throwable) {
            return null;
        }
    }
}
