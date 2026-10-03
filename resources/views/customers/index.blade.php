@extends('layouts.app')

@section('title', 'Customers')

@section('main-class', 'list-page')

@section('content')
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Customers</h1>
                <p class="page-subtitle">Utang (credit) balances</p>
            </div>
        </div>

        @if (session('status'))
            <div class="status-box">{{ session('status') }}</div>
        @endif

        @if ($errors->any())
            <div class="status-box">{{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('customers.store') }}" class="inline-form">
            @csrf
            <input type="text" name="name" placeholder="Customer name" required maxlength="255">
            <input type="text" name="phone" placeholder="Phone (optional)" maxlength="30">
            <button type="submit" class="form-button">Add Customer</button>
        </form>

        <div class="table-panel">
            @if ($customers->isEmpty())
                <div class="empty-state">
                    <p>No customers yet.</p>
                </div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Balance</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($customers as $customer)
                            @php($balance = ($customer->credit_total ?? 0) - ($customer->paid_total ?? 0))
                            <tr>
                                <td>{{ $customer->name }}</td>
                                <td class="muted">{{ $customer->phone }}</td>
                                <td>₱{{ number_format($balance, 2) }}</td>
                                <td class="actions">
                                    <a href="{{ route('customers.show', $customer) }}" class="row-link">View</a>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

        <div class="pagination">
            {{ $customers->links() }}
        </div>
    </div>
@endsection

@section('styles')
    <style>
        .inline-form {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
        }

        .inline-form input {
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #eee;
            padding: 8px 10px;
            font-size: 13px;
        }

        .form-button {
            background: transparent;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #eee;
            padding: 8px 14px;
            font-size: 13px;
            cursor: pointer;
        }

        .form-button:hover {
            background: #1a1a1a;
        }

        .row-link {
            color: #888;
            font-size: 12px;
        }

        .pagination {
            margin-top: 20px;
        }
    </style>
@endsection
