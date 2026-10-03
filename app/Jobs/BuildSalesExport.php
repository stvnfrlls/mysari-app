<?php

namespace App\Jobs;

use App\Models\ReportExport;
use App\Services\SalesReport;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class BuildSalesExport implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $exportId) {}

    public function handle(): void
    {
        $export = ReportExport::find($this->exportId);

        if (! $export || $export->isReady()) {
            return;
        }

        [, $productBreakdown] = SalesReport::data($export->from_date, $export->to_date);

        $stream = fopen('php://temp', 'w+');
        SalesReport::writeCsv($stream, $productBreakdown);
        rewind($stream);

        $path = 'exports/' . $export->id . '-' . Str::uuid() . '.csv';
        $written = Storage::disk('local')->put($path, $stream);
        fclose($stream);

        if (! $written) {
            throw new \RuntimeException('Could not write the export file.');
        }

        $export->update([
            'status' => 'ready',
            'path' => $path,
            'error' => null,
            'finished_at' => now(),
        ]);
    }

    public function failed(?Throwable $exception): void
    {
        ReportExport::whereKey($this->exportId)->update([
            'status' => 'failed',
            'error' => Str::limit($exception?->getMessage() ?? 'Unknown error', 250),
            'finished_at' => now(),
        ]);
    }
}
