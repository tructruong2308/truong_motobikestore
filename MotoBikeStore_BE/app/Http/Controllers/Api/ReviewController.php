<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductReview;
use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    // ====== Cấu hình NGẮN cho trạng thái "đơn hoàn tất" ======
    // Nếu DB bạn dùng số cho cột status (vd: 3=delivered, 4=completed) => liệt kê ở đây:
    private array $DONE_NUMBERS = [3,4];

    // Nếu DB bạn lưu chuỗi (có/không dấu), controller sẽ nhận diện theo từ khóa dưới:
    private array $DONE_KEYWORDS = [
        // không dấu
        'hoan thanh','da giao','da nhan','thanh cong',
        'completed','delivered','fulfilled','success','done',
        // có dấu
        'hoàn thành','đã giao','đã nhận','thành công',
    ];

    // Chỉ dò đúng 2 cột này vì DB bạn không có step_code/status_text
    private array $STATUS_COLS = ['status','payment_status'];

    // ====== PUBLIC: xem danh sách review 1 sản phẩm ======
    public function index($productId)
    {
        return response()->json(
            ProductReview::where('product_id', (int)$productId)
                ->orderByDesc('id')
                ->paginate(10)
        );
    }

    // ====== AUTH: kiểm tra có thể review không ======
    public function can($productId, Request $req)
    {
        $user = $req->user();
        if (!$user) return response()->json(['can'=>false,'reason'=>'unauthorized'], 401);

        [$eligible, $reviewed] = $this->getEligibleAndReviewed($user->id, (int)$productId);

        $remaining  = max(0, count($eligible) - count($reviewed));
        $nextOrderId= $remaining > 0
            ? collect($eligible)->first(fn($oid) => !in_array($oid, $reviewed))
            : null;

        return response()->json([
            'can'       => $remaining > 0,
            'remaining' => $remaining,
            'order_id'  => $nextOrderId,
            'eligible'  => $eligible,
            'reviewed'  => $reviewed,
        ]);
    }

    // ====== AUTH: tạo review (1 review / 1 lần mua) ======
    public function store($productId, Request $req)
    {
        $user = $req->user();
        if (!$user) return response()->json(['message'=>'unauthorized'], 401);

        $data = $req->validate([
            'rating'   => 'required|integer|min:1|max:5',
            'title'    => 'nullable|string|max:150',
            'comment'  => 'nullable|string|max:5000',
            'order_id' => 'nullable|integer',
        ]);

        [$eligible, $reviewed] = $this->getEligibleAndReviewed($user->id, (int)$productId);

        $orderId = $data['order_id']
            ?? collect($eligible)->first(fn($oid) => !in_array($oid, $reviewed));

        if (!$orderId || !in_array($orderId, $eligible)) {
            return response()->json(['message'=>'Bạn chưa có đơn hoàn tất cho sản phẩm này'], 422);
        }
        if (in_array($orderId, $reviewed)) {
            return response()->json(['message'=>'Lần mua này đã được đánh giá rồi'], 422);
        }

        $review = ProductReview::create([
            'user_id'    => $user->id,
            'product_id' => (int)$productId,
            'order_id'   => (int)$orderId,
            'rating'     => $data['rating'],
            'title'      => $data['title'] ?? null,
            'comment'    => $data['comment'] ?? null,
        ]);

        return response()->json($review, 201);
    }

    // ====== AUTH: sửa review của chính mình ======
    public function update($id, Request $req)
    {
        $user = $req->user();
        if (!$user) return response()->json(['message'=>'unauthorized'], 401);

        $data = $req->validate([
            'rating'  => 'sometimes|integer|min:1|max:5',
            'title'   => 'nullable|string|max:150',
            'comment' => 'nullable|string|max:5000',
        ]);

        $review = ProductReview::where('id',$id)->where('user_id',$user->id)->first();
        if (!$review) return response()->json(['message'=>'Review không tồn tại hoặc không thuộc về bạn'], 404);

        $review->fill($data)->save();
        return response()->json($review);
    }

    // ================= Helpers (nằm chung file) =================

    private function getEligibleAndReviewed(int $userId, int $productId): array
    {
        $cols = $this->existingStatusColumns();

        // 1) Lấy các đơn của user, chỉ kèm cột trạng thái đang tồn tại
        $orders = Order::query()
            ->where('user_id', $userId)
            ->select(array_merge(['id'], $cols))
            ->get();

        if ($orders->isEmpty()) return [[],[]];

        // 2) Lọc các đơn "hoàn tất"
        $doneOrderIds = [];
        foreach ($orders as $o) {
            if ($this->isDoneOrder($o, $cols)) $doneOrderIds[] = $o->id;
        }
        if (empty($doneOrderIds)) return [[],[]];

        // 3) Lọc các đơn hoàn tất có MUA sản phẩm này
        $eligibleOrderIds = OrderDetail::query()
            ->whereIn('order_id', $doneOrderIds)
            ->where('product_id', $productId) // nhớ: product_id ở ntt_orderdetail phải trùng với id SP FE đang xem
            ->pluck('order_id')
            ->unique()
            ->values()
            ->all();

        if (empty($eligibleOrderIds)) return [[],[]];

        // 4) Những lần mua đã review rồi
        $reviewedOrderIds = ProductReview::query()
            ->where('user_id', $userId)
            ->where('product_id', $productId)
            ->whereIn('order_id', $eligibleOrderIds)
            ->pluck('order_id')
            ->all();

        return [$eligibleOrderIds, $reviewedOrderIds];
    }

    private function existingStatusColumns(): array
    {
        // Dò cột nào thực sự có trong ntt_order
        $schemaCols = DB::getSchemaBuilder()->getColumnListing('ntt_order');
        return array_values(array_intersect($this->STATUS_COLS, $schemaCols));
    }

    private function isDoneOrder(object $o, array $cols): bool
    {
        foreach ($cols as $col) {
            $val = $o->{$col} ?? null;
            if ($val === null || $val === '') continue;

            // số
            if (is_numeric($val) && in_array((int)$val, $this->DONE_NUMBERS, true)) {
                return true;
            }

            // chuỗi: bỏ dấu + lowercase + so khớp từ khóa
            if (is_string($val)) {
                $nv = $this->vnNorm(mb_strtolower($val, 'UTF-8'));
                foreach ($this->DONE_KEYWORDS as $kw) {
                    if (str_contains($nv, $this->vnNorm(mb_strtolower($kw,'UTF-8')))) {
                        return true;
                    }
                }
                // payment_status = paid/success
                if ($col === 'payment_status' && in_array($nv, ['paid','success','thanh cong'])) {
                    // nếu bạn muốn chỉ cần paid đã cho review thì mở dòng dưới
                    // return true;
                }
            }
        }
        return false;
    }

    /** Bỏ dấu tiếng Việt để so khớp */
    private function vnNorm(string $s): string
    {
        $from = ['à','á','ạ','ả','ã','â','ầ','ấ','ậ','ẩ','ẫ','ă','ằ','ắ','ặ','ẳ','ẵ',
                 'è','é','ẹ','ẻ','ẽ','ê','ề','ế','ệ','ể','ễ',
                 'ì','í','ị','ỉ','ĩ',
                 'ò','ó','ọ','ỏ','õ','ô','ồ','ố','ộ','ổ','ỗ','ơ','ờ','ớ','ợ','ở','ỡ',
                 'ù','ú','ụ','ủ','ũ','ư','ừ','ứ','ự','ử','ữ',
                 'ỳ','ý','ỵ','ỷ','ỹ','đ'];
        $to   = ['a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a','a',
                 'e','e','e','e','e','e','e','e','e','e','e',
                 'i','i','i','i','i',
                 'o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o','o',
                 'u','u','u','u','u','u','u','u','u','u','u',
                 'y','y','y','y','y','d'];
        return str_replace($from, $to, $s);
    }
}
