@extends('layouts.app')

@section('title', 'Add Product')

@section('content')
    <div class="form-card">
        <h1>Add Product</h1>

        @if ($errors->any())
            <div class="error-box">{{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('products.store') }}">
            @csrf
            @include('products.partials.form')
            <button type="submit">Save Product</button>
        </form>
    </div>
@endsection

@section('styles')
    @include('products.partials.form-styles')
@endsection
