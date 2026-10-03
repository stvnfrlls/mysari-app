<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReportExport extends Model
{
    protected $fillable = [
        'user_id',
        'from_date',
        'to_date',
        'status',
        'path',
        'error',
        'finished_at',
    ];

    protected $casts = [
        'from_date' => 'date',
        'to_date' => 'date',
        'finished_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isReady(): bool
    {
        return $this->status === 'ready' && $this->path !== null;
    }

    public function filename(): string
    {
        return sprintf(
            'sales-report-%s-to-%s.csv',
            $this->from_date->format('Y-m-d'),
            $this->to_date->format('Y-m-d')
        );
    }
}
