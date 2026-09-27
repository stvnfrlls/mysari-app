@php $p = $product ?? null; @endphp

<label for="name">Name</label>
<input type="text" id="name" name="name" value="{{ old('name', $p->name ?? '') }}" required autofocus>

<label for="sku">SKU</label>
<input type="text" id="sku" name="sku" value="{{ old('sku', $p->sku ?? '') }}" required>

<label for="price">Price (₱)</label>
<input type="number" step="0.01" min="0" id="price" name="price"
    value="{{ old('price', $p->price ?? '') }}" required>

<label for="stock_quantity">Stock Quantity</label>
<input type="number" min="0" id="stock_quantity" name="stock_quantity"
    value="{{ old('stock_quantity', $p->stock_quantity ?? 0) }}" required>

<label for="low_stock_threshold">Low Stock Threshold</label>
<input type="number" min="0" id="low_stock_threshold" name="low_stock_threshold"
    value="{{ old('low_stock_threshold', $p->low_stock_threshold ?? 5) }}" required>
