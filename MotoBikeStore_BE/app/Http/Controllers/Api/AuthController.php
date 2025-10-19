<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    // Đăng ký customer
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|max:191|unique:ntt_user,email',
            'username'              => 'required|string|max:191|unique:ntt_user,username',
            'password'              => 'required|string|min:6|confirmed', // cần field password_confirmation
            'phone'                 => 'nullable|string|max:20',
            'avatar'                => 'nullable|image|mimes:jpeg,jpg,png,webp,avif|max:2048',
        ], [
            'email.unique'          => 'Email này đã được sử dụng.',
            'username.unique'       => 'Tên đăng nhập đã tồn tại.',
            'password.confirmed'    => 'Mật khẩu nhập lại không khớp.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first()
            ], 422);
        }

        // Lưu avatar (nếu có)
        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('uploads/avatars', 'public');
        }

        // Tạo user
        $user = User::create([
            'name'      => $request->name,
            'email'     => strtolower(trim($request->email)),
            'username'  => trim($request->username),
            'password'  => Hash::make($request->password),
            'phone'     => $request->phone,
            'avatar'    => $avatarPath,
            'roles'     => 'customer',
            'status'    => 1,
        ]);

        // (tuỳ chọn) tạo token luôn cho trải nghiệm “đăng ký xong đăng nhập luôn”
        $token = $user->createToken('customer', ['customer'])->plainTextToken;

        // Trả về user (model đã có accessor avatar_url — xem mục 2)
        return response()->json([
            'success' => true,
            'message' => 'Đăng ký thành công',
            'user'    => $user->refresh(),
            'token'   => $token, // 👈 giờ đã có biến $token
        ], 201);
    }


    // Đăng nhập customer (Sanctum token)
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::guard('web')->attempt($credentials)) { // chỉ dùng để check mật khẩu
            return response()->json(['success' => false,'message' => 'Sai email hoặc mật khẩu'], 401);
        }

        /** @var \App\Models\User $user */
        $user = User::where('email', $credentials['email'])->first();
        if ($user->roles !== 'customer') {
            return response()->json(['success' => false,'message' => 'Tài khoản không phải là khách hàng'], 403);
        }

        $token = $user->createToken('customer')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    // Đăng nhập admin (Sanctum token)
    public function loginAdmin(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!Auth::guard('web')->attempt($credentials)) {
            return response()->json(['success' => false,'message' => 'Sai email hoặc mật khẩu'], 401);
        }

        /** @var \App\Models\User $user */
        $user = User::where('email', $credentials['email'])->first();
        if ($user->roles !== 'admin') {
            return response()->json(['success' => false,'message' => 'Bạn không có quyền truy cập admin'], 403);
        }

        $token = $user->createToken('admin')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Đăng nhập admin thành công',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    // Đăng xuất (xóa token hiện tại)
    public function logout(Request $request)
    {
        $token = $request->user()?->currentAccessToken();
        if ($token) $token->delete();

        return response()->json(['message' => 'Đã đăng xuất']);
    }

    public function updateProfile(Request $request)
{
    /** @var \App\Models\User $user */
    $user = $request->user();

    $validator = \Validator::make($request->all(), [
        'name'    => 'required|string|max:255',
        'phone'   => 'nullable|string|max:20',
        'address' => 'nullable|string|max:255',
        'avatar'  => 'nullable|image|mimes:jpeg,jpg,png,webp,avif|max:2048',
    ], [
        'name.required'  => 'Vui lòng nhập họ tên.',
        'avatar.image'   => 'Ảnh đại diện không hợp lệ.',
        'avatar.mimes'   => 'Ảnh phải là JPEG/PNG/WEBP/AVIF.',
        'avatar.max'     => 'Ảnh tối đa 2MB.',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'message' => $validator->errors()->first(),
        ], 422);
    }

    // Xử lý avatar (nếu có)
    $avatarPath = $user->avatar;
    if ($request->hasFile('avatar')) {
        // option: xoá file cũ nếu bạn muốn
        // if ($user->avatar && \Storage::disk('public')->exists($user->avatar)) {
        //     \Storage::disk('public')->delete($user->avatar);
        // }
        $avatarPath = $request->file('avatar')->store('uploads/avatars', 'public');
    }

    $user->update([
        'name'    => $request->name,
        'phone'   => $request->phone,
        'address' => $request->address,
        'avatar'  => $avatarPath,
    ]);

    // Trả về kèm avatar_url đầy đủ
    $user->avatar_url = $user->avatar ? asset('storage/'.$user->avatar) : null;

    return response()->json([
        'success' => true,
        'message' => 'Cập nhật hồ sơ thành công',
        'user'    => $user,
    ]);
}

}
