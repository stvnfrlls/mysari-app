<?php

namespace App\Jobs;

use App\Models\ReportExport;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class PruneOldExports implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $days = 7) {}

    public function handle(): void
    {
        ReportExport::where('created_at', '<', now()->subDays($this->days))
            ->chunkById(100, function ($exports) {
                foreach ($exports as $export) {
                    if ($export->path) {
                        Storage::disk('local')->delete($export->path);
                    }

                    $export->delete();
                }
            });
    }
}
