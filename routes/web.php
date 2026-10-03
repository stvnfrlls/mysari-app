<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;

Route::get('/', function () {
    return auth()->check() ? redirect()->route('dashboard') : view('landing');
})->name('landing');

Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/data', [DashboardController::class, 'data'])->name('dashboard.data');

    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::resource('products', ProductController::class)
        ->only(['index', 'create', 'store']);
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])
        ->name('products.destroy')
        ->middleware('role:owner');
    Route::get('/products/low-stock', [ProductController::class, 'lowStock'])->name('products.low-stock');

    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/create', [TransactionController::class, 'create'])->name('transactions.create');
    Route::post('/transactions', [TransactionController::class, 'store'])->name('transactions.store');

    Route::middleware('role:owner')->group(function () {
        Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
        Route::match(['put', 'patch'], '/products/{product}', [ProductController::class, 'update'])->name('products.update');

        Route::get('/reports/sales', [ReportController::class, 'sales'])->name('reports.sales');
        Route::get('/reports/sales/export', [ReportController::class, 'exportSales'])->name('reports.sales.export');

        Route::patch('/payments/{payment}/void', [CustomerController::class, 'voidPayment'])->name('payments.void');
    });

    Route::post('/transactions/{transaction}/void', [TransactionController::class, 'void'])
        ->name('transactions.void')
        ->middleware('role:owner');

    Route::post('/products/{product}/restock', [ProductController::class, 'restock'])->name('products.restock');
    Route::get('/products/{product}/history', [ProductController::class, 'history'])->name('products.history');

    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::post('/customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
    Route::post('/customers/{customer}/payments', [CustomerController::class, 'pay'])->name('customers.pay');

    Route::patch('/customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])
        ->name('customers.destroy')
        ->middleware('role:owner');

    Route::middleware('role:owner')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::patch('/users/{user}/role', [UserController::class, 'updateRole'])->name('users.role');

        Route::patch('/users/{user}/deactivate', [UserController::class, 'deactivate'])->name('users.deactivate');
        Route::patch('/users/{user}/activate', [UserController::class, 'activate'])->name('users.activate');
        Route::patch('/users/{user}/password', [UserController::class, 'resetPassword'])->name('users.password');

        Route::get('/reports/sales/export', [ReportController::class, 'exportSales'])->name('reports.sales.export');
        Route::post('/reports/sales/exports', [ReportController::class, 'requestExport'])->name('reports.sales.exports.store');
        Route::get('/reports/sales/exports/{export}/download', [ReportController::class, 'downloadExport'])->name('reports.sales.exports.download');
    });
});
