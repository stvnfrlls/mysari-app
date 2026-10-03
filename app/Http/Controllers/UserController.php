<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('roles')->orderBy('name')->get();

        return view('users.index', compact('users'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['owner', 'cashier'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
        ]);
        $user->assignRole($validated['role']);

        return redirect()->route('users.index')->with('status', 'User added.');
    }

    public function updateRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['owner', 'cashier'])],
        ]);

        if ($user->is($request->user()) && $validated['role'] !== 'owner') {
            return back()->withErrors(['role' => 'You cannot remove your own owner role.']);
        }

        $user->syncRoles($validated['role']);

        return back()->with('status', 'Role updated.');
    }

    public function deactivate(Request $request, User $user)
    {
        if ($user->is($request->user())) {
            return back()->withErrors(['user' => 'You cannot deactivate your own account.']);
        }

        $user->forceFill(['deactivated_at' => now()])->save();

        return back()->with('status', 'User deactivated.');
    }

    public function activate(User $user)
    {
        $user->forceFill(['deactivated_at' => null])->save();

        return back()->with('status', 'User reactivated.');
    }

    public function resetPassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user->update(['password' => $validated['password']]);

        return back()->with('status', 'Password reset.');
    }
}
