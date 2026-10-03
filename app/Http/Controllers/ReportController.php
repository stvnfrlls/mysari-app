<?php

namespace App\Http\Controllers;

use App\Jobs\BuildSalesExport;
use App\Models\ReportExport;
use App\Services\SalesReport;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        [$from, $to] = $this->range($request);
        [$summary, $productBreakdown] = SalesReport::data($from, $to);

        $exports = ReportExport::where('user_id', $request->user()->id)
            ->latest('id')
            ->take(5)
            ->get();

        return view('reports.sales', compact('summary', 'productBreakdown', 'from', 'to', 'exports'));
    }

    public function exportSales(Request $request)
    {
        [$from, $to] = $this->range($request);
        [, $productBreakdown] = SalesReport::data($from, $to);

        $filename = sprintf('sales-report-%s-to-%s.csv', $from->format('Y-m-d'), $to->format('Y-m-d'));

        return response()->streamDownload(function () use ($productBreakdown) {
            $out = fopen('php://output', 'w');
            SalesReport::writeCsv($out, $productBreakdown);
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function requestExport(Request $request)
    {
        [$from, $to] = $this->range($request);

        $export = ReportExport::create([
            'user_id' => $request->user()->id,
            'from_date' => $from->toDateString(),
            'to_date' => $to->toDateString(),
        ]);

        BuildSalesExport::dispatch($export->id);

        return redirect()
            ->route('reports.sales', ['from' => $from->format('Y-m-d'), 'to' => $to->format('Y-m-d')])
            ->with('status', 'Export queued. It will appear below when it is ready.');
    }

    public function downloadExport(Request $request, ReportExport $export)
    {
        abort_unless($export->user_id === $request->user()->id, 403);
        abort_unless($export->isReady() && Storage::disk('local')->exists($export->path), 404);

        return Storage::disk('local')->download($export->path, $export->filename(), [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function range(Request $request): array
    {
        $from = ($this->parseDate($request->input('from')) ?? now()->startOfMonth())->startOfDay();
        $to = ($this->parseDate($request->input('to')) ?? now())->endOfDay();

        return [$from, $to];
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
