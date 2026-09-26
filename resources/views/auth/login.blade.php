@extends('layouts.app')

@section('title', 'Sign In')

@section('content')
    <div class="auth-card">
        <h1>Welcome back</h1>
        <p class="subtitle">Sign in to continue</p>

        @if ($errors->any())
            <div class="error-box">
                {{ $errors->first() }}
            </div>
        @endif

        <form method="POST" action="{{ route('login') }}">
            @csrf

            <label for="email">Email</label>
            <input type="email" id="email" name="email" value="{{ old('email') }}" placeholder="you@example.com"
                required autofocus>

            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="••••••••" required>

            <button type="submit">Sign In</button>
        </form>

        <p class="footer-link">Don't have an account? <a href="#">Sign up</a></p>
    </div>
@endsection

@section('styles')
    <style>
        .auth-card {
            width: 100%;
            max-width: 380px;
            background: #111111;
            border: 1px solid #1f1f1f;
            border-radius: 12px;
            padding: 44px 40px;
        }

        .auth-card h1 {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 28px;
            letter-spacing: -0.4px;
            margin-bottom: 8px;
        }

        .subtitle {
            color: #888;
            font-size: 14px;
            letter-spacing: 0.1px;
            margin-bottom: 34px;
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

        button {
            width: 100%;
            margin-top: 30px;
            padding: 13px;
            background: #f5f5f5;
            color: #0a0a0a;
            border: none;
            border-radius: 8px;
            font-family: var(--font-sans);
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.2px;
            cursor: pointer;
            transition: opacity 0.15s ease;
        }

        button:hover {
            opacity: 0.85;
        }

        .footer-link {
            margin-top: 26px;
            text-align: center;
            font-size: 13px;
            color: #888;
        }

        .footer-link a {
            color: #f5f5f5;
            text-decoration: none;
            font-weight: 500;
        }
    </style>
@endsection
