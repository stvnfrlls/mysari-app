<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'sku',
        'price',
        'stock_quantity',
        'low_stock_threshold',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function isLowStock(): bool
    {
        return $this->stock_quantity <= $this->low_stock_threshold;
    }

    public function transactionItems()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function movements()
    {
        return $this->hasMany(StockMovement::class)->latest()->latest('id');
    }
}
