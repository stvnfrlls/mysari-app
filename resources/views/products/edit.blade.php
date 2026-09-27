@extends('layouts.app')

@section('title', 'Edit Product')

@section('content')
    <div class="form-card">
        <h1>Edit Product</h1>

        @if ($errors->any())
            <div class="error-box">{{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('products.update', $product) }}">
            @csrf
            @method('PUT')
            @include('products.partials.form')
            <button type="submit">Update Product</button>
        </form>
    </div>
@endsection

@section('styles')
    @include('products.partials.form-styles')
@endsection
