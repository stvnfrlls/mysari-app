@php
    $selected = (string) ($row['product_id'] ?? '');
    $quantity = $row['quantity'] ?? 1;
@endphp

<div class="item-row">
    <div class="item-product-field">
        @if ($first)
            <label for="product_id">Product</label>
        @endif
        <select name="items[{{ $index }}][product_id]" class="item-product" required
            @if ($first) id="product_id" @else aria-label="Product" @endif>
            <option value="">Select a product</option>
            @foreach ($products as $product)
                <option value="{{ $product->id }}" data-price="{{ $product->price }}"
                    data-stock="{{ $product->stock_quantity }}"
                    {{ $selected === (string) $product->id ? 'selected' : '' }}>
                    {{ $product->name }} — ₱{{ number_format($product->price, 2) }} ({{ $product->stock_quantity }} in
                    stock)
                </option>
            @endforeach
        </select>
    </div>

    <div class="item-quantity-field">
        @if ($first)
            <label for="quantity">Quantity</label>
        @endif
        <input type="number" name="items[{{ $index }}][quantity]" class="item-quantity" min="1"
            value="{{ $quantity }}" required
            @if ($first) id="quantity" @else aria-label="Quantity" @endif>
    </div>

    @unless ($first)
        <button type="button" class="remove-item" aria-label="Remove item">×</button>
    @endunless
</div>
