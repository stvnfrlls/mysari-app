<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LowStockAlert extends Model
{
    protected $fillable = [
        'product_id',
        'stock_quantity',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeOpen($query)
    {
        return $query->whereNull('resolved_at');
    }
}
