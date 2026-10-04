<?php

namespace App\Jobs;

use App\Models\DailySummary;
use App\Models\Payment;
use App\Models\Transaction;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;

class BuildDailySummary implements ShouldQueue
{
    use Queueable;

    // $date is a Y-m-d string in app time. Null means yesterday.
    public function __construct(public ?string $date = null) {}

    public function handle(): void
    {
        $day = $this->date ? Carbon::parse($this->date) : now()->subDay();
        $start = $day->copy()->startOfDay();
        $end = $day->copy()->endOfDay();

        $sales = Transaction::active()->whereBetween('created_at', [$start, $end]);

        DailySummary::updateOrCreate(
            ['summary_date' => $start->toDateString()],
            [
                'total_sales' => (clone $sales)->sum('total'),
                'transactions_count' => (clone $sales)->count(),
                'cash' => (clone $sales)->where('is_credit', false)->sum('total'),
                'credit' => (clone $sales)->where('is_credit', true)->sum('total'),
                'utang_outstanding' => Transaction::active()
                    ->where('is_credit', true)
                    ->where('created_at', '<=', $end)
                    ->sum('total')
                    - Payment::active()
                    ->where('created_at', '<=', $end)
                    ->sum('amount'),
            ]
        );
    }
}
