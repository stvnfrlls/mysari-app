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
            padding: 24px 40px;
            border-bottom: 1px solid #1a1a1a;
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
    </style>
    @yield('styles')
</head>

<body>

    <header class="site-header">
        <a href="/" class="brand">{{ config('app.name') }}</a>
    </header>

    <main>
        @yield('content')
    </main>

    <footer class="site-footer">
        &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
    </footer>

</body>

</html>
