<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostImportController extends Controller
{
    /**
     * Body JSON:
     * {
     *   "items": [
     *     {
     *       "title": "...", "slug":"(optional)",
     *       "excerpt":"...", "content":"...", "thumbnail_url":"http...",
     *       "published_at":"2025-11-06T03:00:00Z",
     *       "source":"vnexpress", "author":"..."
     *     }, ...
     *   ]
     * }
     */
    public function bulk(Request $req)
    {
        $data = $req->validate([
            'items' => 'required|array|min:1',
            'items.*.title'        => 'required|string|max:255',
            'items.*.slug'         => 'nullable|string|max:255',
            'items.*.excerpt'      => 'nullable|string',
            'items.*.content'      => 'nullable|string',
            'items.*.thumbnail_url'=> 'nullable|string',
            'items.*.published_at' => 'nullable|date',
            'items.*.source'       => 'nullable|string|max:100',
            'items.*.author'       => 'nullable|string|max:100',
        ]);

        $created = 0; $updated = 0;

        foreach ($data['items'] as $it) {
            // Tạo slug nếu thiếu, kèm hash 6 ký tự để tránh va chạm
            $slug = trim($it['slug'] ?? '');
            if ($slug === '') {
                $base = Str::slug($it['title']);
                $slug = $base ?: Str::random(8);
                $salt = substr(md5(($it['source'] ?? '').($it['title']).($it['published_at'] ?? '')), 0, 6);
                $slug = "{$slug}-{$salt}";
            }

            // Tìm theo slug (unique trên DB)
            $post = Post::where('slug',$slug)->first();

            $payload = [
                'title'        => $it['title'],
                'slug'         => $slug,
                'source'       => $it['source'] ?? null,
                'author'       => $it['author'] ?? null,
                'excerpt'      => $it['excerpt'] ?? null,
                'content'      => $it['content'] ?? null,
                'thumbnail_url'=> $it['thumbnail_url'] ?? null,
                'published_at' => $it['published_at'] ?? now(),
            ];

            if ($post) { $post->update($payload); $updated++; }
            else       { Post::create($payload); $created++; }
        }

        return response()->json(['created'=>$created,'updated'=>$updated]);
    }
}
