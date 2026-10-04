<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailySummary extends Model
{
    protected $fillable = [
        'summary_date',
        'total_sales',
        'transactions_count',
        'cash',
        'credit',
        'utang_outstanding',
    ];

    protected function casts(): array
    {
        return [
            'summary_date' => 'date',
            'total_sales' => 'decimal:2',
            'cash' => 'decimal:2',
            'credit' => 'decimal:2',
            'utang_outstanding' => 'decimal:2',
        ];
    }
}
