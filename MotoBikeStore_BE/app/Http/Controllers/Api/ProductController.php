<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * GET /api/products
     * Hỗ trợ: per_page, limit, q, only_sale
     */
    public function index(Request $request)
    {
        $query = Product::with('brand:id,name')
            ->select(['id','name','brand_id','price_root','price_sale','thumbnail'])
            ->when($request->filled('q'), function ($q) use ($request) {
                $kw = trim($request->get('q'));
                $q->where(function ($w) use ($kw) {
                    $w->where('name', 'like', "%{$kw}%")
                      ->orWhere('slug', 'like', "%{$kw}%");
                });
            })
            ->when($request->boolean('only_sale'), function ($q) {
                $q->whereNotNull('price_sale')
                  ->where('price_sale', '>', 0)
                  ->whereColumn('price_sale', '<', 'price_root');
            })
            ->latest('id');

        if ($request->filled('limit')) {
            $limit = max(1, (int) $request->get('limit', 8));
            $items = $query->take($limit)->get();
            return $items->makeHidden(['brand', 'brand_id']);
        }

        $perPage = max(1, (int) $request->get('per_page', 12));
        $products = $query->paginate($perPage);
        return $products->makeHidden(['brand','brand_id']);
    }

    /** GET /api/products/{id} */
    public function show($id)
    {
        $p = Product::with('brand:id,name')
            ->select([
                'id','name','brand_id','price_root','price_sale',
                'thumbnail','detail','description','category_id'
            ])
            ->find($id);

        if (!$p) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return $p->makeHidden(['brand','brand_id']);
    }

    /**
     * GET /api/categories/{id}/products
     * Hỗ trợ: only_sale, limit
     */
    public function byCategory($id, Request $request)
    {
        $q = Product::where('category_id', $id)
            ->select(['id','name','price_root','price_sale','thumbnail'])
            ->when($request->boolean('only_sale'), function ($w) {
                $w->whereNotNull('price_sale')
                  ->where('price_sale', '>', 0)
                  ->whereColumn('price_sale', '<', 'price_root');
            })
            ->latest('id');

        if ($request->filled('limit')) {
            $limit = max(1, (int) $request->get('limit', 8));
            return $q->take($limit)->get();
        }

        return $q->get();
    }

    /** GET /api/products/sale */
    public function sale(Request $request)
    {
        $limit = max(1, (int) $request->get('limit', 8));

        return Product::select(['id','name','price_root','price_sale','thumbnail'])
            ->whereNotNull('price_sale')
            ->where('price_sale', '>', 0)
            ->whereColumn('price_sale', '<', 'price_root')
            ->latest('updated_at')
            ->take($limit)
            ->get();
    }

    /** GET /api/products/new */
    public function newest(Request $request)
    {
        $limit = max(1, (int) $request->get('limit', 8));

        return Product::select(['id','name','price_root','price_sale','thumbnail'])
            ->latest('created_at')
            ->take($limit)
            ->get();
    }

    /* =========================
     * ADMIN: CRUD (Sanctum)
     * ========================= */

    /** POST /api/admin/products */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => ['required','string','max:255'],
            'slug'        => ['nullable','string','max:255', Rule::unique('ntt_product','slug')],
            'category_id' => ['required','integer'],  // có thể dùng exists nếu muốn
            'brand_id'    => ['nullable','integer'],
            'price_root'  => ['required','numeric','min:0'],
            'price_sale'  => ['nullable','numeric','min:0'],
            'qty'         => ['required','integer','min:0'],
            'description' => ['nullable','string'],
            'detail'      => ['nullable','string'],
            'status'      => ['required','boolean'],
            'thumbnail'   => ['nullable','image','mimes:jpg,jpeg,png,webp','max:4096'],
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        // Lưu ảnh vào storage/public/products => /storage/products/xxx
        if ($request->hasFile('thumbnail')) {
            $file = $request->file('thumbnail');
            $filename = time().'_'.Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.'.$file->getClientOriginalExtension();
            Storage::disk('public')->putFileAs('products', $file, $filename);
            $validated['thumbnail'] = 'storage/products/'.$filename;
        }

        // QUAN TRỌNG: gán created_by khi TẠO MỚI
        $validated['created_by'] = auth()->id() ?? 1;

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Thêm sản phẩm thành công',
            'data'    => $product
        ], 201);
    }

    /** PUT /api/admin/products/{id} */
    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['success'=>false,'message'=>'Không tìm thấy sản phẩm'], 404);
        }

        $validated = $request->validate([
            'name'        => ['sometimes','string','max:255'],
            'slug'        => ['sometimes','nullable','string','max:255', Rule::unique('ntt_product','slug')->ignore($id)],
            'category_id' => ['sometimes','integer'],
            'brand_id'    => ['sometimes','nullable','integer'],
            'price_root'  => ['sometimes','numeric','min:0'],
            'price_sale'  => ['sometimes','nullable','numeric','min:0'],
            'qty'         => ['sometimes','integer','min:0'],
            'description' => ['sometimes','nullable','string'],
            'detail'      => ['sometimes','nullable','string'],
            'status'      => ['sometimes','boolean'],
            'thumbnail'   => ['sometimes','image','mimes:jpg,jpeg,png,webp','max:4096'],
        ]);

        if ($request->hasFile('thumbnail')) {
            // Xoá ảnh cũ nếu lưu trong storage
            if ($product->thumbnail && str_starts_with($product->thumbnail, 'storage/')) {
                $old = str_replace('storage/', '', $product->thumbnail); // products/xxx.jpg
                Storage::disk('public')->delete($old);
            }

            $file = $request->file('thumbnail');
            $filename = time().'_'.Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)).'.'.$file->getClientOriginalExtension();
            Storage::disk('public')->putFileAs('products', $file, $filename);
            $validated['thumbnail'] = 'storage/products/'.$filename;
        }

        // QUAN TRỌNG: gán updated_by khi CẬP NHẬT
        $validated['updated_by'] = auth()->id() ?? 1;

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật sản phẩm thành công',
            'data'    => $product
        ]);
    }

    /** DELETE /api/admin/products/{id} */
    public function destroy($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['success'=>false,'message'=>'Không tìm thấy sản phẩm'], 404);
        }

        // Xoá ảnh trong storage nếu có
        if ($product->thumbnail && str_starts_with($product->thumbnail, 'storage/')) {
            $old = str_replace('storage/', '', $product->thumbnail);
            Storage::disk('public')->delete($old);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xoá sản phẩm thành công',
        ]);
    }

    /** PATCH /api/admin/products/{id}/status */
    public function toggleStatus($id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['success'=>false,'message'=>'Không tìm thấy sản phẩm'], 404);
        }

        $product->status = $product->status ? 0 : 1;
        $product->save();

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật trạng thái thành công',
            'status'  => $product->status,
        ]);
    }
}
