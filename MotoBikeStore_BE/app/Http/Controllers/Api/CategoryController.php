<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /* =============== PUBLIC =============== */

    // GET /api/categories
    public function index()
    {
        $cats = Category::orderBy('sort_order', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        // image_url đã append ở Model
        return response()->json(['data' => $cats]);
    }

    // GET /api/categories/{id}
    public function show($id)
    {
        $cat = Category::find($id);
        if (!$cat) return response()->json(['message' => 'Category not found'], 404);

        return response()->json(['data' => $cat]);
    }

    // GET /api/categories/{id}/products
    public function products($id)
    {
        $cat = Category::find($id);
        if (!$cat) return response()->json(['message' => 'Category not found'], 404);

        $products = $cat->products()->with('brand:id,name')->get();
        return response()->json(['data' => $products]);
    }

    /* =============== ADMIN =============== */
    // POST /api/admin/categories
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => ['required','string','max:255'],
            'slug'        => ['nullable','string','max:255','unique:ntt_category,slug'],
            'image'       => ['nullable','string','max:512'], // URL hoặc tên file
            'image_file'  => ['nullable','image','mimes:jpg,jpeg,png,webp','max:10240'],
            'parent_id'   => ['nullable','integer','exists:ntt_category,id'],
            'sort_order'  => ['nullable','integer'],
            'description' => ['nullable','string'],
            'status'      => ['nullable','integer','in:0,1'],
        ]);

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Nếu upload file → lưu vào public/assets/images (giữ tên file trong DB)
        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $ext  = $file->getClientOriginalExtension();
            $name = time().'_'.Str::random(6).'.'.$ext;
            $file->move(public_path('assets/images'), $name);
            $data['image'] = $name;
        }

        $uid = auth()->id() ?? 0;

        $cat = Category::create([
            'name'        => $data['name'],
            'slug'        => $data['slug'],
            'image'       => $data['image'] ?? null,
            'parent_id'   => $data['parent_id'] ?? null,
            'sort_order'  => $data['sort_order'] ?? 0,
            'description' => $data['description'] ?? '',
            'created_by'  => $uid,
            'updated_by'  => $uid,
            'status'      => array_key_exists('status',$data) ? (int)$data['status'] : 1, // ✅ luôn set
        ]);

        return response()->json(['data' => $cat], 201);
    }

    // PUT /api/admin/categories/{category}
    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name'        => ['sometimes','required','string','max:255'],
            'slug'        => ['sometimes','required','string','max:255', Rule::unique('ntt_category','slug')->ignore($category->id)],
            'image'       => ['nullable','string','max:512'],
            'image_file'  => ['nullable','image','mimes:jpg,jpeg,png,webp','max:10240'],
            'parent_id'   => ['nullable','integer','exists:ntt_category,id'],
            'sort_order'  => ['nullable','integer'],
            'description' => ['nullable','string'],
            'status'      => ['nullable','integer','in:0,1'],
        ]);

        // Tự sinh slug nếu thiếu khi update JSON
        if (array_key_exists('name', $data) && (!array_key_exists('slug', $data) || empty($data['slug']))) {
            $data['slug'] = Str::slug($data['name']);
        }

        // Upload file mới
        if ($request->hasFile('image_file')) {
            // Xóa file cũ nếu là local (không phải URL)
            if ($category->image && !preg_match('#^https?://#i', $category->image)) {
                $oldPublic = public_path('assets/images/'.ltrim($category->image, '/'));
                if (is_file($oldPublic)) @unlink($oldPublic);

                $oldStorage = public_path('storage/'.ltrim($category->image, '/'));
                if (is_file($oldStorage)) @unlink($oldStorage);
            }

            $file = $request->file('image_file');
            $ext  = $file->getClientOriginalExtension();
            $name = time().'_'.Str::random(6).'.'.$ext;
            $file->move(public_path('assets/images'), $name);
            $data['image'] = $name;
        }

        $uid = auth()->id() ?? 0;

        $category->fill([
            'name'        => $data['name']        ?? $category->name,
            'slug'        => $data['slug']        ?? $category->slug,
            'image'       => array_key_exists('image',$data) ? $data['image'] : $category->image,
            'parent_id'   => array_key_exists('parent_id',$data) ? $data['parent_id'] : $category->parent_id,
            'sort_order'  => array_key_exists('sort_order',$data) ? $data['sort_order'] : $category->sort_order,
            'description' => array_key_exists('description',$data) ? $data['description'] : ($category->description ?? ''),
            'updated_by'  => $uid,
            'status'      => array_key_exists('status',$data) ? (int)$data['status'] : $category->status, // ✅ cho phép đổi
        ])->save();

        return response()->json(['data' => $category]);
    }

    // DELETE /api/admin/categories/{category}
    public function destroy(Category $category)
    {
        // Nếu muốn chặn khi còn sản phẩm:
        // if ($category->products()->exists()) return response()->json(['message'=>'Category đang được sử dụng'], 409);

        if ($category->image && !preg_match('#^https?://#i', $category->image)) {
            $oldPublic = public_path('assets/images/'.ltrim($category->image, '/'));
            if (is_file($oldPublic)) @unlink($oldPublic);

            $oldStorage = public_path('storage/'.ltrim($category->image, '/'));
            if (is_file($oldStorage)) @unlink($oldStorage);
        }

        $category->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
