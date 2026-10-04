<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ResetTestData extends Command
{
    protected $signature = 'test:reset-data';

    protected $description = 'Truncates transactional tables so E2E tests start from a clean state.';

    public function handle(): void
    {
        // MySQL doesn't support multi-table TRUNCATE or RESTART IDENTITY,
        // and truncating a table another table has an FK to requires
        // disabling checks first.
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('payments')->truncate();
        DB::table('stock_movements')->truncate();
        DB::table('transaction_items')->truncate();
        DB::table('transactions')->truncate();
        DB::table('low_stock_alerts')->truncate();
        foreach (DB::table('report_exports')->whereNotNull('path')->pluck('path') as $path) {
            Storage::disk('local')->delete($path);
        }
        DB::table('report_exports')->truncate();
        DB::table('jobs')->truncate();
        DB::table('customers')->truncate();
        DB::table('products')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        $this->info('Test data reset.');
    }
}
