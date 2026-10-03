@extends('layouts.app')

@section('title', $customer->name)

@section('main-class', 'list-page')

@section('content')
    <div class="page">
        <div class="page-header">
            <div>
                <h1>{{ $customer->name }}</h1>
                <p class="page-subtitle">Balance: ₱{{ number_format($customer->balance(), 2) }}</p>
            </div>
            <a href="{{ route('customers.index') }}" class="cta-button">Back to Customers</a>
        </div>

        @if (session('status'))
            <div class="status-box">{{ session('status') }}</div>
        @endif

        @if ($errors->any())
            <div class="error-box">{{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('customers.update', $customer) }}" class="inline-form">
            @csrf
            @method('PATCH')
            <input type="text" name="name" value="{{ old('name', $customer->name) }}" placeholder="Customer name"
                required maxlength="255" aria-label="Customer name">
            <input type="text" name="phone" value="{{ old('phone', $customer->phone) }}" placeholder="Phone (optional)"
                maxlength="30" aria-label="Customer phone">
            <button type="submit" class="form-button">Save Details</button>
        </form>

        <form method="POST" action="{{ route('customers.pay', $customer) }}" class="inline-form">
            @csrf
            <input type="number" name="amount" step="0.01" min="0.01" placeholder="Amount (₱)" required>
            <input type="text" name="note" placeholder="Note (optional)" maxlength="255">
            <button type="submit" class="form-button">Record Payment</button>
        </form>

        <h2 class="section-title">Credit sales</h2>
        <div class="table-panel">
            @if ($credits->isEmpty())
                <div class="empty-state">
                    <p>No credit sales yet.</p>
                </div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($credits as $credit)
                            <tr @class(['voided' => $credit->isVoided()])>
                                <td class="muted">{{ $credit->created_at->format('M j, Y g:i A') }}</td>
                                <td>
                                    @foreach ($credit->items as $item)
                                        {{ $item->product->name ?? 'Deleted product' }} × {{ $item->quantity }}
                                        @if (!$loop->last)
                                            ,
                                        @endif
                                    @endforeach
                                </td>
                                <td>₱{{ number_format($credit->total, 2) }}</td>
                                <td class="actions">
                                    @if ($credit->isVoided())
                                        <span class="badge-voided">Voided</span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

        <h2 class="section-title">Payments</h2>
        <div class="table-panel">
            @if ($payments->isEmpty())
                <div class="empty-state">
                    <p>No payments yet.</p>
                </div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Note</th>
                            <th>Recorded by</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($payments as $payment)
                            <tr @class(['voided' => $payment->isVoided()])>
                                <td class="muted">{{ $payment->created_at->format('M j, Y g:i A') }}</td>
                                <td>₱{{ number_format($payment->amount, 2) }}</td>
                                <td class="muted">{{ $payment->note }}</td>
                                <td class="muted">{{ $payment->user->name ?? '—' }}</td>
                                <td class="actions">
                                    @if ($payment->isVoided())
                                        <span class="badge-voided">Voided</span>
                                    @else
                                        @role('owner')
                                            <form method="POST" action="{{ route('payments.void', $payment) }}"
                                                class="void-form" onsubmit="return confirm('Void this payment?')">
                                                @csrf
                                                @method('PATCH')
                                                <input type="text" name="reason" placeholder="Reason (optional)"
                                                    maxlength="255" aria-label="Void reason">
                                                <button type="submit" class="form-button">Void</button>
                                            </form>
                                        @endrole
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

        @role('owner')
            <form method="POST" action="{{ route('customers.destroy', $customer) }}" class="delete-form"
                onsubmit="return confirm('Delete this customer?')">
                @csrf
                @method('DELETE')
                <button type="submit" class="form-button">Delete Customer</button>
            </form>
        @endrole
    </div>
@endsection

@section('styles')
    <style>
        .inline-form {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
        }

        .inline-form input,
        .void-form input {
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #eee;
            padding: 8px 10px;
            font-size: 13px;
        }

        .void-form {
            display: flex;
            gap: 8px;
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

        .section-title {
            font-size: 15px;
            font-weight: 600;
            margin: 28px 0 12px;
        }

        .delete-form {
            margin-top: 28px;
        }
    </style>
@endsection
