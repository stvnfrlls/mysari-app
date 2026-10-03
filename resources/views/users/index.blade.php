@extends('layouts.app')

@section('title', 'Users')

@section('main-class', 'list-page')

@section('content')
    <div class="page">
        <div class="page-header">
            <div>
                <h1>Users</h1>
                <p class="page-subtitle">Owners and cashiers</p>
            </div>
        </div>

        @if (session('status'))
            <div class="status-box">{{ session('status') }}</div>
        @endif

        @if ($errors->any())
            <div class="error-box">{{ $errors->first() }}</div>
        @endif

        <form method="POST" action="{{ route('users.store') }}" class="inline-form">
            @csrf
            <input type="text" name="name" placeholder="Name" required maxlength="255" value="{{ old('name') }}">
            <input type="email" name="email" placeholder="Email" required maxlength="255" value="{{ old('email') }}">
            <input type="password" name="password" placeholder="Password (min 8)" required minlength="8">
            <select name="role" aria-label="New user role">
                <option value="cashier">Cashier</option>
                <option value="owner">Owner</option>
            </select>
            <button type="submit" class="form-button">Add User</button>
        </form>

        <div class="table-panel">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($users as $user)
                        @php($role = $user->getRoleNames()->first())
                        <tr @class(['deactivated' => $user->isDeactivated()])>
                            <td>{{ $user->name }}</td>
                            <td class="muted">{{ $user->email }}</td>
                            <td>{{ ucfirst($role ?? 'none') }}</td>
                            <td>{{ $user->isDeactivated() ? 'Deactivated' : 'Active' }}</td>
                            <td>
                                <div class="user-actions">
                                    <form method="POST" action="{{ route('users.role', $user) }}" class="role-form">
                                        @csrf
                                        @method('PATCH')
                                        <select name="role" aria-label="Role for {{ $user->name }}">
                                            <option value="cashier" @selected($role === 'cashier')>Cashier</option>
                                            <option value="owner" @selected($role === 'owner')>Owner</option>
                                        </select>
                                        <button type="submit" class="form-button">Save</button>
                                    </form>

                                    <form method="POST" action="{{ route('users.password', $user) }}" class="role-form">
                                        @csrf
                                        @method('PATCH')
                                        <input type="password" name="password" placeholder="New password" minlength="8"
                                            required aria-label="New password for {{ $user->name }}">
                                        <button type="submit" class="form-button">Reset</button>
                                    </form>

                                    @unless ($user->is(auth()->user()))
                                        <form method="POST"
                                            action="{{ route($user->isDeactivated() ? 'users.activate' : 'users.deactivate', $user) }}">
                                            @csrf
                                            @method('PATCH')
                                            <button type="submit" class="form-button">
                                                {{ $user->isDeactivated() ? 'Reactivate' : 'Deactivate' }}
                                            </button>
                                        </form>
                                    @endunless
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
@endsection

@section('styles')
    <style>
        .inline-form {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
        }

        .inline-form input,
        select {
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #eee;
            padding: 8px 10px;
            font-size: 13px;
            font-family: var(--font-sans);
        }

        .inline-form input {
            width: auto;
            flex: 1 1 160px;
        }

        .role-form {
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

        .user-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
        }

        .role-form input {
            width: auto;
            background: #0a0a0a;
            border: 1px solid #2a2a2a;
            border-radius: 6px;
            color: #eee;
            padding: 8px 10px;
            font-size: 13px;
        }

        .deactivated td:not(:last-child) {
            opacity: 0.5;
        }
    </style>
@endsection
