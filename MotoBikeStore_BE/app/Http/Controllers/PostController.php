<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostController extends Controller
{
    // Lấy danh sách bài viết (blog)
    public function index(Request $r)
    {
        $q = Post::query()->orderByDesc('published_at')->orderByDesc('id');

        if ($s = $r->get('q')) {
            $q->where('title', 'like', "%$s%");
        }

        return $q->paginate($r->integer('per_page', 20));
    }

    // Thêm / cập nhật bài viết (n8n sẽ gọi API này)
    public function store(Request $r)
    {
        $data = $r->validate([
            'title' => 'required',
            'slug' => 'nullable',
            'excerpt' => 'nullable',
            'content' => 'nullable',
            'thumbnail_url' => 'nullable',
            'published_at' => 'nullable',
            'source' => 'nullable',
            'author' => 'nullable'
        ]);

        $data['slug'] = $data['slug'] ?? Str::slug($data['title']) . '-' . substr(Str::uuid(), 0, 6);

        $post = Post::updateOrCreate(['slug' => $data['slug']], $data);
        return response()->json($post, 201);
    }

    // Lấy chi tiết bài viết theo slug hoặc id
    public function show(string $slugOrId)
    {
        $post = Post::query()
            ->where('slug', $slugOrId)
            ->orWhere('id', is_numeric($slugOrId) ? $slugOrId : -1)
            ->firstOrFail();

        return response()->json($post);
    }
}
