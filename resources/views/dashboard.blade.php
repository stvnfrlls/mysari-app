@extends('layouts.app')

@section('title', 'Dashboard')

@section('content')
    <div class="dashboard-box">
        <h1>You're signed in</h1>
        <p class="hero-subtitle">{{ auth()->user()->email }}</p>
        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit" class="cta-button">Log Out</button>
        </form>
    </div>
@endsection

@section('styles')
    <style>
        .dashboard-box {
            text-align: center;
        }

        .dashboard-box h1 {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 28px;
            margin-bottom: 8px;
        }

        .cta-button {
            margin-top: 24px;
            padding: 12px 28px;
            background: #f5f5f5;
            color: #0a0a0a;
            border: none;
            border-radius: 8px;
            font-family: var(--font-sans);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }
    </style>
@endsection
