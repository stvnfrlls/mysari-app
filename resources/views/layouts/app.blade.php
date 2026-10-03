<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', config('app.name'))</title>

    @include('layouts.partials.fonts')

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--font-sans);
            font-feature-settings: 'cv11', 'ss01';
            background-color: #0a0a0a;
            color: #f5f5f5;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .site-header {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 16px 32px;
            padding: 24px 40px;
            border-bottom: 1px solid #1a1a1a;
        }

        .main-nav {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px 4px;
        }

        .main-nav a {
            padding: 8px 12px;
            border-radius: 8px;
            color: #888;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            transition: color 0.15s ease, background 0.15s ease;
        }

        .main-nav a:hover {
            color: #f5f5f5;
        }

        .main-nav a.active {
            color: #f5f5f5;
            background: #1a1a1a;
        }

        .main-nav form {
            margin-left: 8px;
        }

        .main-nav .logout-button {
            width: auto;
            margin: 0;
            padding: 8px 14px;
        }

        .brand {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 19px;
            letter-spacing: -0.3px;
            color: #f5f5f5;
            text-decoration: none;
        }

        main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
        }

        .site-footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            letter-spacing: 0.2px;
            color: #555;
        }

        /* ---- Shared components ---- */

        .cta-button {
            display: inline-block;
            padding: 10px 20px;
            background: #f5f5f5;
            color: #0a0a0a;
            border: none;
            border-radius: 8px;
            font-family: var(--font-sans);
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.2px;
            text-decoration: none;
            cursor: pointer;
            transition: opacity 0.15s ease;
        }

        .cta-button:hover {
            opacity: 0.85;
        }

        .list-page {
            align-items: flex-start;
            padding: 48px 40px;
        }

        .page {
            width: 100%;
            max-width: 960px;
            margin: 0 auto;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 28px;
        }

        .page-header h1 {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 26px;
            letter-spacing: -0.3px;
            margin-bottom: 4px;
        }

        .page-subtitle {
            color: #888;
            font-size: 14px;
        }

        .header-actions {
            display: flex;
            gap: 12px;
        }

        .cta-button-secondary {
            padding: 11px 22px;
            background: transparent;
            color: #f5f5f5;
            border: 1px solid #333;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
        }

        .table-panel {
            background: #111111;
            border: 1px solid #1f1f1f;
            border-radius: 12px;
            overflow: hidden;
        }

        .muted {
            color: #888;
        }

        .badge-low {
            display: inline-block;
            margin-left: 8px;
            padding: 2px 8px;
            background: #2a1414;
            color: #ff8080;
            font-size: 11px;
            font-weight: 600;
            border-radius: 4px;
        }

        .actions {
            display: flex;
            gap: 14px;
        }

        .actions a,
        .actions button {
            background: none;
            border: none;
            color: #aaa;
            font-size: 13px;
            font-family: var(--font-sans);
            cursor: pointer;
            text-decoration: none;
            padding: 0;
        }

        .actions a:hover,
        .actions button:hover {
            color: #f5f5f5;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #777;
        }

        .empty-hint {
            margin-top: 6px;
            font-size: 13px;
            color: #555;
        }

        .logout-button {
            padding: 10px 20px;
            background: transparent;
            color: #ccc;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            font-family: var(--font-sans);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: border-color 0.15s ease, color 0.15s ease;
        }

        .logout-button:hover {
            border-color: #4a4a4a;
            color: #f5f5f5;
        }

        .status-box {
            background: #14251a;
            border: 1px solid #1f3d2a;
            color: #7fd99a;
            font-size: 13px;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .error-box {
            background: #2a1414;
            border: 1px solid #4a1f1f;
            color: #ff8080;
            font-size: 13px;
            padding: 12px 14px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        label {
            display: block;
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            color: #999;
            margin-bottom: 8px;
            margin-top: 20px;
        }

        input {
            width: 100%;
            padding: 12px 14px;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            color: #f5f5f5;
            font-family: var(--font-sans);
            font-size: 14px;
            outline: none;
            transition: border-color 0.15s ease;
        }

        input::placeholder {
            color: #555;
        }

        input:focus {
            border-color: #4a4a4a;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            text-align: left;
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            color: #888;
            padding: 16px 20px;
            border-bottom: 1px solid #1f1f1f;
        }

        td {
            padding: 16px 20px;
            font-size: 14px;
            border-bottom: 1px solid #181818;
        }

        tr:last-child td {
            border-bottom: none;
        }

        .pager {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
        }

        .pager-info {
            font-size: 13px;
            color: #888;
        }

        .pager-links {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .pager-item {
            padding: 6px 12px;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            font-size: 13px;
            color: #ccc;
            text-decoration: none;
        }

        a.pager-item:hover {
            background: #1a1a1a;
            color: #f5f5f5;
        }

        .pager-item.current {
            background: #f5f5f5;
            color: #0a0a0a;
            border-color: #f5f5f5;
            font-weight: 600;
        }

        .pager-item.disabled {
            color: #555;
        }
    </style>
    @yield('styles')
</head>

<body>

    <header class="site-header">
        <a href="{{ auth()->check() ? route('dashboard') : route('landing') }}"
            class="brand">{{ config('app.name') }}</a>

        @auth
            <nav class="main-nav" aria-label="Main">
                <a href="{{ route('dashboard') }}" @class(['active' => request()->routeIs('dashboard')])>Dashboard</a>
                <a href="{{ route('products.index') }}" @class([
                    'active' =>
                        request()->routeIs('products.*') &&
                        !request()->routeIs('products.low-stock'),
                ])>Products</a>
                <a href="{{ route('products.low-stock') }}" @class(['active' => request()->routeIs('products.low-stock')])>Low Stock</a>
                <a href="{{ route('transactions.create') }}" @class(['active' => request()->routeIs('transactions.create')])>Record Sale</a>
                <a href="{{ route('transactions.index') }}" @class(['active' => request()->routeIs('transactions.index')])>Transactions</a>
                <a href="{{ route('customers.index') }}" @class(['active' => request()->routeIs('customers.*')])>Customers</a>
                @role('owner')
                    <a href="{{ route('reports.sales') }}" @class(['active' => request()->routeIs('reports.*')])>Sales Report</a>
                    <a href="{{ route('users.index') }}" @class(['active' => request()->routeIs('users.*')])>Users</a>
                @endrole
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="logout-button">Log Out</button>
                </form>
            </nav>
        @endauth
    </header>

    <main class="@yield('main-class')">
        @yield('content')
    </main>

    <footer class="site-footer">
        &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
    </footer>

</body>

</html>
