<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('summary_date')->unique();
            $table->decimal('total_sales', 12, 2)->default(0);
            $table->unsignedInteger('transactions_count')->default(0);
            $table->decimal('cash', 12, 2)->default(0);
            $table->decimal('credit', 12, 2)->default(0);
            $table->decimal('utang_outstanding', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_summaries');
    }
};
