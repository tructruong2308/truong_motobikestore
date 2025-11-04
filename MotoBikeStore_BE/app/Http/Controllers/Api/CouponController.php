<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\CouponRedemption;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Carbon;

class CouponController extends Controller
{
    // GET /api/admin/coupons
    public function index(Request $r)
    {
        $q = Coupon::query()->orderByDesc('id');
        if ($kw = $r->query('q')) {
            $q->whereRaw('UPPER(code) LIKE ?', ['%'.strtoupper(trim($kw)).'%']);
        }
        return response()->json([
            'data' => $q->paginate($r->integer('per_page', 20))
        ]);
    }

    // POST /api/admin/coupons
    public function store(Request $r)
    {
        $data = $r->validate([
            'code'            => ['required','string','max:50','unique:coupons,code'],
            'type'            => ['required', Rule::in(['percent','fixed'])],
            'value'           => ['required','integer','min:1'],
            'min_order'       => ['nullable','integer','min:0'],
            'max_discount'    => ['nullable','integer','min:0'],
            'usage_limit'     => ['nullable','integer','min:1'],
            'per_user_limit'  => ['nullable','integer','min:1'],
            'starts_at'       => ['nullable','date'],
            'ends_at'         => ['nullable','date','after_or_equal:starts_at'],
            'is_active'       => ['boolean'],

            // NEW (hiển thị như Shopee):
            'is_visible'      => ['sometimes','boolean'],
            'channels'        => ['nullable','array'],
            'channels.*'      => ['in:web,app'],
            'audience'        => ['sometimes', Rule::in(['all','new_user_only','returning'])],
            'badge_text'      => ['nullable','string','max:30'],
        ]);

        $data['code'] = strtoupper(trim($data['code']));
        $data['is_active'] = $data['is_active'] ?? true;
        $data['is_visible'] = $data['is_visible'] ?? true;

        if (isset($data['channels']) && is_array($data['channels']) && empty($data['channels'])) {
            $data['channels'] = null; // rỗng = áp cho mọi kênh
        }

        // parse theo timezone app (khớp FE)
        $tz = config('app.timezone', 'Asia/Ho_Chi_Minh');
        $data['starts_at'] = !empty($data['starts_at']) ? Carbon::parse($data['starts_at'], $tz) : null;
        $data['ends_at']   = !empty($data['ends_at'])   ? Carbon::parse($data['ends_at'],   $tz) : null;

        $coupon = Coupon::create($data);
        return response()->json(['message'=>'created','data'=>$coupon], 201);
    }

    // PUT /api/admin/coupons/{id}
    public function update(Request $r, $id)
    {
        $coupon = Coupon::findOrFail($id);
        $data = $r->validate([
            'code'            => ['sometimes','string','max:50', Rule::unique('coupons','code')->ignore($coupon->id)],
            'type'            => ['sometimes', Rule::in(['percent','fixed'])],
            'value'           => ['sometimes','integer','min:1'],
            'min_order'       => ['nullable','integer','min:0'],
            'max_discount'    => ['nullable','integer','min:0'],
            'usage_limit'     => ['nullable','integer','min:1'],
            'per_user_limit'  => ['nullable','integer','min:1'],
            'starts_at'       => ['nullable','date'],
            'ends_at'         => ['nullable','date','after_or_equal:starts_at'],
            'is_active'       => ['boolean'],

            // NEW:
            'is_visible'      => ['sometimes','boolean'],
            'channels'        => ['nullable','array'],
            'channels.*'      => ['in:web,app'],
            'audience'        => ['sometimes', Rule::in(['all','new_user_only','returning'])],
            'badge_text'      => ['nullable','string','max:30'],
        ]);

        if (isset($data['code'])) $data['code'] = strtoupper(trim($data['code']));
        if (array_key_exists('is_visible', $data) && $data['is_visible'] === null) {
            $data['is_visible'] = true;
        }
        if (array_key_exists('channels', $data)) {
            if (is_array($data['channels']) && empty($data['channels'])) {
                $data['channels'] = null;
            }
        }

        $tz = config('app.timezone', 'Asia/Ho_Chi_Minh');
        if (array_key_exists('starts_at', $data)) {
            $data['starts_at'] = $data['starts_at'] ? Carbon::parse($data['starts_at'], $tz) : null;
        }
        if (array_key_exists('ends_at', $data)) {
            $data['ends_at']   = $data['ends_at']   ? Carbon::parse($data['ends_at'],   $tz) : null;
        }

        $coupon->update($data);
        return response()->json(['message'=>'updated','data'=>$coupon]);
    }

    // DELETE /api/admin/coupons/{id}
    public function destroy($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->delete();
        return response()->json(['message'=>'deleted']);
    }

    // PATCH /api/admin/coupons/{id}/toggle
    public function toggle($id)
    {
        $coupon = Coupon::findOrFail($id);
        $coupon->is_active = !$coupon->is_active;
        $coupon->save();
        return response()->json(['message'=>'toggled','data'=>$coupon]);
    }

    /**
     * POST /api/coupons/validate
     * Body JSON: { code, subtotal }
     * Trả về: { valid, reason?, discount, data }
     */
    public function validateCode(Request $r)
    {
        // Validator: code bắt buộc; subtotal tự parse bên dưới (chấp nhận cả chuỗi có dấu)
        $r->validate([
            'code'     => ['required','string','max:50'],
            'subtotal' => ['required'],
        ]);

        // Lấy input đúng (POST JSON hoặc query fallback)
        $codeRaw = $r->input('code', $r->query('code'));
        $code    = strtoupper(trim((string)$codeRaw));

        $subRaw  = (string) ($r->input('subtotal', $r->query('subtotal', '0')));
        $subtotal = (int) (preg_replace('/\D+/', '', $subRaw) ?: '0'); // "36.612.000đ" → 36612000

        // Tìm coupon KHÔNG phân biệt hoa/thường
        $coupon = Coupon::whereRaw('UPPER(code) = ?', [$code])->first();
        if (!$coupon) {
            return response()->json(['valid'=>false,'reason'=>'Mã không tồn tại'], 404);
        }

        if (!$coupon->is_active) {
            return response()->json(['valid'=>false,'reason'=>'Mã đang tạm khoá'], 422);
        }

        // Xét thời gian theo timezone app
        if (!$coupon->isWithinTime()) {
            return response()->json(['valid'=>false,'reason'=>'Mã không trong thời gian áp dụng'], 422);
        }

        if ($coupon->min_order && $subtotal < (int)$coupon->min_order) {
            return response()->json(['valid'=>false,'reason'=>'Chưa đạt đơn tối thiểu'], 422);
        }

        // Giới hạn tổng số lượt
        if (!is_null($coupon->usage_limit)) {
            $used = CouponRedemption::where('coupon_id',$coupon->id)->count();
            if ($used >= (int)$coupon->usage_limit) {
                return response()->json(['valid'=>false,'reason'=>'Mã đã hết lượt dùng'], 422);
            }
        }

        // Giới hạn theo user (nếu có đăng nhập)
        $userId = optional($r->user())->id;
        if ($userId && !is_null($coupon->per_user_limit)) {
            $usedByUser = CouponRedemption::where('coupon_id',$coupon->id)->where('user_id',$userId)->count();
            if ($usedByUser >= (int)$coupon->per_user_limit) {
                return response()->json(['valid'=>false,'reason'=>'Bạn đã dùng hết lượt cho mã này'], 422);
            }
        }

        $discount = $coupon->computeDiscount($subtotal);

        return response()->json([
            'valid'    => true,
            'discount' => (int) $discount,
            'data'     => $coupon,
        ]);
    }

    /**
     * GET /api/coupons/claimable?subtotal=1980000
     * Trả về danh sách voucher hiển thị + mã tốt nhất (để nút “Áp dụng tốt nhất”)
     */
    public function claimable(Request $r)
    {
        $subtotal = (int) preg_replace('/\D+/', '', (string) $r->query('subtotal', '0')); // nhận "1.980.000đ"
        $user = $r->user();

        $q = Coupon::visible('web')->orderByDesc('starts_at');

        // audience theo lịch sử đơn (nếu có quan hệ orders())
        if ($user) {
            $isNew = method_exists($user, 'orders') ? !$user->orders()->exists() : false;
            $q->whereIn('audience', $isNew ? ['all','new_user_only'] : ['all','returning']);
        } else {
            $q->where('audience','all');
        }

        $coupons = $q->get(['id','code','type','value','min_order','max_discount','ends_at','badge_text']);

        $list = $coupons->map(function($c) use($subtotal){
            $eligible = $subtotal >= (int)$c->min_order;
            $est = 0;
            if ($eligible) {
                $est = $c->type === 'percent'
                    ? (int) floor($subtotal * ($c->value/100))
                    : (int) $c->value;
                if ($c->type === 'percent' && $c->max_discount) $est = min($est, (int)$c->max_discount);
                $est = min($est, $subtotal);
            }
            return [
                'id'        => $c->id,
                'code'      => $c->code,
                'badge'     => $c->badge_text,
                'label'     => $c->type==='percent'
                                ? "-{$c->value}%".($c->max_discount? " (tối đa ".number_format($c->max_discount)."đ)" : "")
                                : "-".number_format($c->value)."đ",
                'min_order' => (int)$c->min_order,
                'eligible'  => $eligible,
                'lack'      => $eligible ? 0 : max(0, (int)$c->min_order - $subtotal),
                'estimate_discount' => $est,
                'ends_at'   => optional($c->ends_at)->toIso8601String(),
            ];
        })->values();

        $best = $list->sortByDesc('estimate_discount')->first();

        return response()->json([
            'coupons' => $list,
            'best'    => $best,
        ]);
    }
}
