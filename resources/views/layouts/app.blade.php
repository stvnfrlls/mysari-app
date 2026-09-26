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
