@extends('layouts.app')

@section('title', 'Welcome')

@section('content')
    <div class="hero">
        <h1>Run your store with clarity.</h1>
        <p class="hero-subtitle">Track inventory, sales, and cash flow — all in one place.</p>
        <a href="{{ route('login') }}" class="cta-button">Sign In</a>
    </div>
@endsection

@section('styles')
    <style>
        .hero {
            text-align: center;
            max-width: 560px;
        }

        .hero h1 {
            font-family: var(--font-display);
            font-weight: 700;
            font-size: 42px;
            letter-spacing: -0.6px;
            line-height: 1.2;
            margin-bottom: 16px;
        }

        .hero-subtitle {
            color: #999;
            font-size: 16px;
            margin-bottom: 36px;
        }

        .cta-button {
            display: inline-block;
            padding: 14px 32px;
            background: #f5f5f5;
            color: #0a0a0a;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.2px;
            text-decoration: none;
            transition: opacity 0.15s ease;
        }

        .cta-button:hover {
            opacity: 0.85;
        }
    </style>
@endsection
