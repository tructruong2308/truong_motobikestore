<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || ($user->roles ?? null) !== 'admin') {
            return response()->json(['message' => 'Forbidden (admin only)'], 403);
        }

        return $next($request);
    }
}
