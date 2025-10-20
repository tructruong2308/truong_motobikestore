<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderDetail;
use App\Models\ProductReview;
use App\Models\ProductReviewImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ReviewController extends Controller
{
    // ---------- PUBLIC: danh sách review + ảnh ----------
    public function index($productId)
    {
        $reviews = ProductReview::with(['user:id,name', 'images'])
            ->where('product_id', $productId)
            ->orderByDesc('id')
            ->get();

        // Tính avg/count
        $avg = round((float)ProductReview::where('product_id', $productId)->avg('rating'), 1);
        $count = (int)ProductReview::where('product_id', $productId)->count();

        // Trả về đúng format FE đang đọc: { reviews, avg, count }
        return response()->json([
            'reviews' => $reviews->map(function ($r) {
                return [
                    'id'         => $r->id,
                    'user_id'    => $r->user_id,
                    'product_id' => $r->product_id,
                    'order_id'   => $r->order_id,
                    'rating'     => (int)$r->rating,
                    'title'      => $r->title,
                    'comment'    => $r->comment,
                    'created_at' => $r->created_at,
                    'user'       => $r->user ? ['id' => $r->user->id, 'name' => $r->user->name] : null,
                    // FE đang render <img src="http://127.0.0.1:8000/{img.image}">
                    // => 'image' phải là 'storage/...'
                    'images'     => $r->images->map(fn($img) => [
                        'id'    => $img->id,
                        'image' => $img->image, // ví dụ: storage/reviews/2025/10/abc.jpg
                    ]),
                ];
            }),
            'avg'   => $avg,
            'count' => $count,
        ]);
    }

    // ---------- AUTH: kiểm tra quyền được review ----------
    public function can(Request $request, $productId)
    {
        $user = $request->user();
        if (!$user) return response()->json(['can' => false]);

        // Được review khi đã mua sản phẩm (đơn không bị huỷ)
        $exists = OrderDetail::query()
            ->join('ntt_order as o', 'o.id', '=', 'ntt_orderdetail.order_id')
            ->where('o.user_id', $user->id)
            ->where('ntt_orderdetail.product_id', $productId)
            ->whereIn('o.status', [1,2,3,4]) // tuỳ quy ước: đã xác nhận/đang gói/đang giao/đã giao
            ->exists();

        return response()->json(['can' => $exists]);
    }

    // ---------- AUTH: tạo review ----------
    public function store(Request $request, $productId)
    {
        $request->validate([
            'rating'  => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:3000',
        ]);

        $user = $request->user();
        if (!$user) return response()->json(['message' => 'Unauthorized'], 401);

        // Tìm 1 order chứa sản phẩm này (ưu tiên đơn gần nhất)
        $orderId = OrderDetail::query()
            ->join('ntt_order as o', 'o.id', '=', 'ntt_orderdetail.order_id')
            ->where('o.user_id', $user->id)
            ->where('ntt_orderdetail.product_id', $productId)
            ->orderByDesc('o.id')
            ->value('o.id');

        $review = ProductReview::create([
            'user_id'    => $user->id,
            'product_id' => (int)$productId,
            'order_id'   => $orderId,
            'rating'     => (int)$request->rating,
            'title'      => $request->title,
            'comment'    => $request->comment,
        ]);

        return response()->json(['success' => true, 'review' => $review], 201);
    }

    // ---------- AUTH: upload ảnh cho review ----------
    public function uploadImages(Request $request, $reviewId)
    {
        $review = ProductReview::findOrFail($reviewId);

        // Chỉ chủ review (hoặc admin) được upload
        if ($request->user()->id !== $review->user_id && ($request->user()->roles ?? '') !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $request->validate([
            'images'   => 'required|array|min:1|max:5',
            'images.*' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $saved = [];
        DB::beginTransaction();
        try {
            foreach ($request->file('images', []) as $file) {
                // Lưu vào disk 'public' => storage/app/public/reviews/...
                // Trả cho FE đường dẫn 'storage/reviews/...'
                $path = $file->store('reviews/'.date('Y/m'), 'public'); // ví dụ: reviews/2025/10/abc.jpg
                $publicPath = 'storage/'.$path;

                $img = ProductReviewImage::create([
                    'review_id' => $review->id,
                    'image'     => $publicPath,
                ]);

                $saved[] = ['id' => $img->id, 'image' => $publicPath];
            }
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Upload thất bại', 'error' => $e->getMessage()], 422);
        }

        return response()->json(['success' => true, 'images' => $saved]);
    }
}
