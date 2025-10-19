<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // GET /api/admin/users
    public function index(Request $request)
    {
        // nếu muốn hỗ trợ search & per_page sau này, có thể thêm:
        // $q = trim((string) $request->query('q', ''));
        // $perPage = (int) $request->query('per_page', 50);

        $users = User::select(
                'id',
                'name',
                'email',
                'username',
                'phone',
                'roles',
                'status',
                'created_at',
                'avatar'          // ✅ PHẢI chọn avatar để accessor avatar_url hoạt động
            )
            ->orderBy('id','desc')
            ->get();

        // Nếu trong Model bạn đã có: protected $appends = ['avatar_url'];
        // thì KHÔNG cần setAppends() nữa. Dòng dưới là optional:
        // $users->each->setAppends(['avatar_url']);

        return response()->json($users);
    }

    // GET /api/admin/users/{id}
    public function show($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message'=>'User not found'],404);
        }

        // Model đã có $appends = ['avatar_url'] → tự kèm avatar_url
        return response()->json($user);
    }

    // POST /api/admin/users
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:ntt_user,email',
            'username' => 'required|string|unique:ntt_user,username',
            'password' => 'required|string|min:6',
            'phone'    => 'nullable|string|max:20',
            'roles'    => 'required|in:customer,admin',
            'status'   => 'nullable|integer',
            // nếu có tạo user kèm avatar đường dẫn, thêm:
            // 'avatar'   => 'nullable|string|max:255',
        ]);

        $data['password'] = Hash::make($data['password']);
        $data['status']   = $data['status'] ?? 1;

        $user = User::create($data)->fresh(); // ✅ fresh để đảm bảo appends sẵn sàng

        return response()->json($user,201);
    }

    // PUT /api/admin/users/{id}
    public function update(Request $request,$id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message'=>'User not found'],404);
        }

        $data = $request->validate([
            'name'     => 'nullable|string|max:255',
            'email'    => 'nullable|email|unique:ntt_user,email,'.$id,
            'username' => 'nullable|string|unique:ntt_user,username,'.$id,
            'password' => 'nullable|string|min:6',
            'phone'    => 'nullable|string|max:20',
            'roles'    => 'nullable|in:customer,admin',
            'status'   => 'nullable|integer',
            // 'avatar'   => 'nullable|string|max:255', // nếu cho phép đổi avatar qua text-path
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user->fresh()); // ✅ fresh để trả về avatar_url cập nhật
    }

    // DELETE /api/admin/users/{id}
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message'=>'User not found'],404);
        }

        $user->delete();
        return response()->json(['message'=>'Xoá thành công']);
    }

    // POST /api/admin/users/{id}/lock
    public function lock($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message'=>'User not found'],404);
        }

        $user->status = 0;
        $user->save();

        return response()->json(['message'=>'User đã bị khoá', 'user' => $user->fresh()]);
    }

    // POST /api/admin/users/{id}/unlock
    public function unlock($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message'=>'User not found'],404);
        }

        $user->status = 1;
        $user->save();

        return response()->json(['message'=>'User đã được mở khoá', 'user' => $user->fresh()]);
    }
}
