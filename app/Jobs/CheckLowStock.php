<?php

namespace App\Jobs;

use App\Models\LowStockAlert;
use App\Models\Product;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CheckLowStock implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<int>  $productIds
     */
    public function __construct(public array $productIds) {}

    public function handle(): void
    {
        Product::whereIn('id', $this->productIds)->get()->each(function (Product $product) {
            $open = LowStockAlert::open()->where('product_id', $product->id);

            if ($product->isLowStock()) {
                if (! (clone $open)->exists()) {
                    LowStockAlert::create([
                        'product_id' => $product->id,
                        'stock_quantity' => $product->stock_quantity,
                    ]);
                }
            } else {
                $open->update(['resolved_at' => now()]);
            }
        });
    }
}
