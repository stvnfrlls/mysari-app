@extends('layouts.app')

@section('title', 'Record Sale')

@section('content')
    @php
        $rows = array_values(old('items', [['product_id' => '', 'quantity' => 1]]));
    @endphp

    <div class="form-card">
        <h1>Record Sale</h1>

        @if ($errors->any())
            <div class="error-box">{{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('transactions.store') }}">
            @csrf

            <div id="itemRows">
                @foreach ($rows as $i => $row)
                    @include('transactions._item-row', [
                        'index' => $i,
                        'row' => $row,
                        'products' => $products,
                        'first' => $loop->first,
                    ])
                @endforeach
            </div>

            <button type="button" id="addItem" class="add-item">+ Add item</button>

            <div class="credit-row">
                <input type="checkbox" id="is_credit" name="is_credit" value="1"
                    {{ old('is_credit') ? 'checked' : '' }}>
                <label for="is_credit">Pay later (utang)</label>
            </div>

            <div id="customerField" {{ old('is_credit') ? '' : 'hidden' }}>
                <label for="customer_id">Customer</label>
                <select id="customer_id" name="customer_id" {{ old('is_credit') ? 'required' : 'disabled' }}>
                    <option value="">Select a customer</option>
                    @foreach ($customers as $customer)
                        <option value="{{ $customer->id }}" {{ old('customer_id') == $customer->id ? 'selected' : '' }}>
                            {{ $customer->name }}
                        </option>
                    @endforeach
                </select>
            </div>

            <p class="line-total" id="lineTotal"></p>

            <button type="submit" class="submit-button">Record Sale</button>
        </form>
    </div>

    <template id="itemRowTemplate">
        @include('transactions._item-row', [
            'index' => '__INDEX__',
            'row' => [],
            'products' => $products,
            'first' => false,
        ])
    </template>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const rowsEl = document.getElementById('itemRows');
            const template = document.getElementById('itemRowTemplate');
            const addBtn = document.getElementById('addItem');
            const lineTotal = document.getElementById('lineTotal');

            const isCredit = document.getElementById('is_credit');
            const customerField = document.getElementById('customerField');
            const customerSelect = document.getElementById('customer_id');

            let nextIndex = rowsEl.querySelectorAll('.item-row').length;

            function updateTotal() {
                let total = 0;
                let any = false;

                rowsEl.querySelectorAll('.item-row').forEach(row => {
                    const opt = row.querySelector('.item-product').selectedOptions[0];
                    const price = parseFloat(opt?.dataset.price || 0);
                    const q = parseInt(row.querySelector('.item-quantity').value || 0);
                    if (price && q) {
                        total += price * q;
                        any = true;
                    }
                });

                lineTotal.textContent = any ? `Total: ₱${total.toFixed(2)}` : '';
            }

            addBtn.addEventListener('click', () => {
                rowsEl.insertAdjacentHTML(
                    'beforeend',
                    template.innerHTML.replaceAll('__INDEX__', nextIndex++)
                );
                updateTotal();
            });

            rowsEl.addEventListener('click', event => {
                const remove = event.target.closest('.remove-item');
                if (remove) {
                    remove.closest('.item-row').remove();
                    updateTotal();
                }
            });

            rowsEl.addEventListener('change', updateTotal);
            rowsEl.addEventListener('input', updateTotal);

            isCredit.addEventListener('change', () => {
                customerField.hidden = !isCredit.checked;
                customerSelect.disabled = !isCredit.checked;
                customerSelect.required = isCredit.checked;
            });

            updateTotal();
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
            max-width: 560px;
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

        .item-row {
            display: flex;
            align-items: flex-end;
            gap: 10px;
            margin-top: 8px;
        }

        .item-product-field {
            flex: 1;
            min-width: 0;
        }

        .item-quantity-field {
            width: 90px;
        }

        .remove-item {
            width: 40px;
            height: 44px;
            background: transparent;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            color: #e5484d;
            font-size: 18px;
            cursor: pointer;
        }

        .add-item {
            width: 100%;
            margin-top: 16px;
            padding: 10px;
            background: transparent;
            border: 1px dashed #2a2a2a;
            border-radius: 8px;
            color: #999;
            font-family: var(--font-sans);
            font-size: 13px;
            cursor: pointer;
        }

        .add-item:hover {
            background: #1a1a1a;
        }

        .credit-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 20px;
        }

        .credit-row input[type="checkbox"] {
            width: auto;
        }

        .credit-row label {
            margin: 0;
        }

        .line-total {
            margin-top: 20px;
            font-size: 14px;
            color: #999;
        }

        .submit-button {
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
