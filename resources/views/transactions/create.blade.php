@extends('layouts.app')

@section('title', 'Record Sale')

@section('content')
    <div class="form-card">
        <h1>Record Sale</h1>

        @if ($errors->any())
            <div class="error-box">{{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('transactions.store') }}">
            @csrf

            <label for="product_id">Product</label>
            <select id="product_id" name="product_id" required>
                <option value="">Select a product</option>
                @foreach ($products as $product)
                    <option value="{{ $product->id }}" data-price="{{ $product->price }}"
                        data-stock="{{ $product->stock_quantity }}">
                        {{ $product->name }} — ₱{{ number_format($product->price, 2) }} ({{ $product->stock_quantity }} in
                        stock)
                    </option>
                @endforeach
            </select>

            <label for="quantity">Quantity</label>
            <input type="number" id="quantity" name="quantity" min="1" value="1" required>

            <p class="line-total" id="lineTotal"></p>

            <button type="submit">Record Sale</button>
        </form>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const select = document.getElementById('product_id');
            const qty = document.getElementById('quantity');
            const lineTotal = document.getElementById('lineTotal');

            function updateTotal() {
                const opt = select.options[select.selectedIndex];
                const price = parseFloat(opt?.dataset.price || 0);
                const q = parseInt(qty.value || 0);
                lineTotal.textContent = price && q ? `Total: ₱${(price * q).toFixed(2)}` : '';
            }

            select.addEventListener('change', updateTotal);
            qty.addEventListener('input', updateTotal);
        });
    </script>
@endsection

@section('styles')
    <style>
        main {
            align-items: flex-start;
            padding: 48px 40px;
        }

        .form-card {
            width: 100%;
            max-width: 480px;
            margin: 0 auto;
            background: #111111;
            border: 1px solid #1f1f1f;
            border-radius: 12px;
            padding: 40px;
        }

        .form-card h1 {
            font-family: var(--font-display);
            font-weight: 600;
            font-size: 24px;
            margin-bottom: 28px;
        }

        select {
            width: 100%;
            padding: 12px 14px;
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            color: #f5f5f5;
            font-family: var(--font-sans);
            font-size: 14px;
            outline: none;
        }

        .line-total {
            margin-top: 20px;
            font-size: 14px;
            color: #999;
        }

        button {
            width: 100%;
            margin-top: 28px;
            padding: 13px;
            background: #f5f5f5;
            color: #0a0a0a;
            border: none;
            border-radius: 8px;
            font-family: var(--font-sans);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
        }

        .error-box {
            background: #2a1414;
            border: 1px solid #4a1f1f;
            color: #ff8080;
            font-size: 13px;
            padding: 12px 14px;
            border-radius: 8px;
            margin-bottom: 10px;
        }
    </style>
@endsection
