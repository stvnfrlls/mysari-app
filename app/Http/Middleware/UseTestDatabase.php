<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class UseTestDatabase
{
    public function handle(Request $request, Closure $next): Response
    {
        if (config('testdb.enabled') && ! app()->isProduction()) {
            $name = $request->cookies->get('test_db');

            if (is_string($name) && preg_match('/^sariapp_test_\d{1,2}$/', $name)) {
                $connection = config('database.default');

                config(["database.connections.{$connection}.database" => $name]);
                DB::purge($connection);
            }
        }

        return $next($request);
    }
}
