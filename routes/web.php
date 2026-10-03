<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check() ? redirect()->route('dashboard') : view('landing');
})->name('landing');

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::resource('products', ProductController::class)
        ->except(['show']);
    Route::get('/products/low-stock', [ProductController::class, 'lowStock'])->name('products.low-stock');

    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/create', [TransactionController::class, 'create'])->name('transactions.create');
    Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');

    Route::get('/reports/sales', [ReportController::class, 'sales'])->name('reports.sales');

    Route::post('/transactions/{transaction}/void', [TransactionController::class, 'void'])
        ->name('transactions.void');

    Route::post('/products/{product}/restock', [ProductController::class, 'restock'])->name('products.restock');
    Route::get('/products/{product}/history', [ProductController::class, 'history'])->name('products.history');

    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
    Route::post('/customers/{customer}/payments', [CustomerController::class, 'pay'])->name('customers.pay');
});
