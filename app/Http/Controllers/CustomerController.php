<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index()
    {
        $customers = Customer::query()
            ->withSum(['transactions as credit_total' => fn($q) => $q->active()->where('is_credit', true)], 'total')
            ->withSum('payments as paid_total', 'amount')
            ->orderBy('name')
            ->paginate(20);

        return view('customers.index', compact('customers'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        Customer::create($validated);

        return redirect()->route('customers.index')->with('status', 'Customer added.');
    }

    public function show(Customer $customer)
    {
        $credits = $customer->transactions()
            ->where('is_credit', true)
            ->with('items.product')
            ->latest()
            ->get();

        $payments = $customer->payments()->latest()->get();

        return view('customers.show', compact('customer', 'credits', 'payments'));
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $customer->update($validated);

        return back()->with('status', 'Customer updated.');
    }

    public function destroy(Customer $customer)
    {
        if ($customer->transactions()->exists() || $customer->payments()->exists()) {
            return back()->withErrors([
                'customer' => 'This customer has sales or payments on record and cannot be deleted.',
            ]);
        }

        $customer->delete();

        return redirect()->route('customers.index')->with('status', 'Customer deleted.');
    }

    public function pay(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $error = null;

        DB::transaction(function () use ($customer, $validated, &$error) {
            $locked = Customer::whereKey($customer->id)->lockForUpdate()->firstOrFail();
            $balance = round($locked->balance(), 2);

            if (round((float) $validated['amount'], 2) > $balance) {
                $error = 'Payment exceeds the balance of ₱' . number_format($balance, 2) . '.';
                return;
            }

            $locked->payments()->create($validated);
        });

        if ($error) {
            return back()->withInput()->withErrors(['amount' => $error]);
        }

        return back()->with('status', 'Payment recorded.');
    }
}
