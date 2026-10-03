<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class TestUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        $owner = User::updateOrCreate(
            ['email' => 'testuser@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password123'),
            ]
        );
        $owner->syncRoles('owner');

        $cashier = User::updateOrCreate(
            ['email' => 'cashier@example.com'],
            [
                'name' => 'Test Cashier',
                'password' => bcrypt('password123'),
            ]
        );
        $cashier->syncRoles('cashier');
    }
}
