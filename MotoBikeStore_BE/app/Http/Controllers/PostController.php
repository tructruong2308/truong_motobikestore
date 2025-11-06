<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    /* ==================== PUBLIC ==================== */

    // Danh sách bài viết: chỉ hiển thị bài đã xuất bản (published_at != null)
    public function index(Request $r)
    {
        $q = Post::query()
            ->whereNotNull('published_at')
            ->orderByDesc('published_at')
            ->orderByDesc('id');

        if ($s = trim((string)$r->get('q', ''))) {
            $q->where(function ($w) use ($s) {
                $w->where('title', 'like', "%$s%")
                  ->orWhere('slug', 'like', "%$s%")
                  ->orWhere('source', 'like', "%$s%")
                  ->orWhere('author', 'like', "%$s%");
            });
        }

        $per = (int) $r->integer('per_page', 20);
        if ($per <= 0 || $per > 100) $per = 20;

        return $q->paginate($per);
    }

    // Lấy chi tiết bài viết theo slug hoặc id (cho FE đọc)
    public function show(string $slugOrId)
    {
        $post = Post::query()
            ->where('slug', $slugOrId)
            ->orWhere('id', is_numeric($slugOrId) ? (int)$slugOrId : -1)
            ->firstOrFail();

        return response()->json($post);
    }

    // Thêm mới (n8n có thể dùng) – không ràng buộc auth ở đây nếu bạn đã mở public
    public function store(Request $r)
    {
        $data = $r->validate([
            'title'         => 'required|string|max:255',
            'slug'          => 'nullable|string|max:255|unique:posts,slug',
            'excerpt'       => 'nullable|string',
            'content'       => 'nullable|string',
            'thumbnail_url' => 'nullable|string',
            'published_at'  => 'nullable|date',
            'source'        => 'nullable|string|max:255',
            'author'        => 'nullable|string|max:255',
        ]);

        $data['slug'] = $data['slug']
            ? Str::slug($data['slug'])
            : Str::slug($data['title']).'-'.substr((string) Str::uuid(), 0, 6);

        $post = Post::create($data);
        return response()->json($post, 201);
    }

    /* ==================== ADMIN ==================== */
    // GET /api/admin/posts
    public function adminIndex(Request $r)
    {
        $q = trim((string)$r->query('q', ''));
        $per = (int) $r->query('per_page', 10);
        if ($per <= 0 || $per > 200) $per = 10;

        $list = Post::query()
            ->when($q !== '', function ($qb) use ($q) {
                $qb->where(function ($w) use ($q) {
                    $w->where('title', 'like', "%$q%")
                      ->orWhere('slug', 'like', "%$q%")
                      ->orWhere('source', 'like', "%$q%")
                      ->orWhere('author', 'like', "%$q%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate($per);

        return response()->json($list);
    }

    // PUT /api/admin/posts/{post}
    public function update(Request $r, Post $post)
    {
        $data = $r->validate([
            'title'         => 'required|string|max:255',
            'slug'          => ['nullable','string','max:255', Rule::unique('posts','slug')->ignore($post->id)],
            'excerpt'       => 'nullable|string',
            'content'       => 'nullable|string',
            'thumbnail_url' => 'nullable|string',
            'published_at'  => 'nullable|date',
            'source'        => 'nullable|string|max:255',
            'author'        => 'nullable|string|max:255',
        ]);

        if (!empty($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        } elseif (empty($post->slug) && !empty($data['title'])) {
            $data['slug'] = Str::slug($data['title']).'-'.substr((string) Str::uuid(), 0, 6);
        }

        $post->update($data);
        return response()->json(['data' => $post]);
    }

    // DELETE /api/admin/posts/{post}
    public function destroy(Post $post)
    {
        $post->delete();
        return response()->json(['ok' => true]);
    }

    // PATCH /api/admin/posts/{post}/publish
    public function publish(Post $post)
    {
        $post->update(['published_at' => now()]);
        return response()->json(['data' => $post]);
    }

    // PATCH /api/admin/posts/{post}/unpublish
    public function unpublish(Post $post)
    {
        $post->update(['published_at' => null]);
        return response()->json(['data' => $post]);
    }

    public function uploadImage(Request $r)
{
    $r->validate([
        'file' => 'required|file|mimes:jpg,jpeg,png,webp,avif,gif|max:4096', // ≤ 4MB
    ]);

    // Lưu vào storage/app/public/posts/...
    $path = $r->file('file')->store('posts', 'public');

    // Trả về URL public
    $url  = asset('storage/'.$path);

    return response()->json([
        'url'  => $url,
        'path' => $path, // nếu sau này muốn xoá bằng path
    ]);
}
}
