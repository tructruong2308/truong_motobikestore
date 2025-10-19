<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'phone'    => 'nullable|string|max:20',
            'address'  => 'nullable|string|max:255',
            'username' => 'nullable|string|max:191|unique:ntt_user,username,' . $user->id . ',id',
            'email'    => 'nullable|email|max:191|unique:ntt_user,email,' . $user->id . ',id',
            'avatar'   => 'nullable|image|mimes:jpeg,jpg,png,webp,avif|max:2048',
        ], [
            'name.required' => 'Vui lòng nhập họ tên.',
        ]);

        // Xử lý avatar
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('uploads/avatars', 'public');

            // xóa ảnh cũ nếu có
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }
            $validated['avatar'] = $path;
        }

        // Không cho đổi email/username nếu bạn muốn khóa 2 field này
        // unset($validated['email'], $validated['username']);

        $user->fill($validated)->save();

        // Trả kèm URL đầy đủ cho avatar
        $user->refresh();
        $user->avatar_url = $user->avatar ? asset('storage/' . $user->avatar) : null;

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật hồ sơ thành công',
            'user'    => $user,
        ]);
    }
}
