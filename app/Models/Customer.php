<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = ['name', 'phone'];

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function balance(): float
    {
        $credit = $this->transactions()->active()->where('is_credit', true)->sum('total');

        return (float) $credit - (float) $this->payments()->sum('amount');
    }
}
