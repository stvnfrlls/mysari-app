<?php

use App\Jobs\PruneOldExports;
use App\Jobs\BuildDailySummary;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new PruneOldExports)->daily();
Schedule::job(new BuildDailySummary)->dailyAt('00:10');
