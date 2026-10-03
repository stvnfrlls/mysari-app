<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = ['product_id', 'transaction_id', 'type', 'quantity_change', 'note'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
