<?php
// app/Http/Controllers/Api/PaymentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Payment;
use App\Models\Coupon;
use App\Models\CouponRedemption;
use App\Services\MomoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Checkout: tạo đơn hàng + (nếu chọn) khởi tạo thanh toán MoMo
     * - Tính lại tổng ở server (không tin FE)
     * - Áp dụng mã giảm giá nếu có (đúng theo schema Coupon của bạn)
     * - Lưu order_details
     */
    public function checkout(Request $r, MomoService $momo)
    {
        $r->validate([
            'items'               => 'required|array|min:1',
            'items.*.id'          => 'required',
            'items.*.product_id'  => 'nullable',
            'items.*.qty'         => 'required|integer|min:1',
            'items.*.price'       => 'required|integer|min:0',
            'payment_method'      => 'required|in:cod,momo',

            // Thông tin KH (tùy API của bạn)
            'name'                => 'nullable|string',
            'customer_name'       => 'nullable|string',
            'phone'               => 'nullable|string',
            'customer_phone'      => 'nullable|string',
            'email'               => 'nullable|email',
            'customer_email'      => 'nullable|email',
            'address'             => 'nullable|string',
            'customer_address'    => 'nullable|string',
            'note'                => 'nullable|string',
            'customer_note'       => 'nullable|string',

            // Coupon (tuỳ chọn)
            'coupon_code'         => 'nullable|string|max:50',
        ]);

        return DB::transaction(function () use ($r, $momo) {
            /** 1) Tính lại subtotal từ items */
            $subtotal = 0;
            foreach ($r->items as $it) {
                $qty   = max(0, (int)($it['qty']   ?? 1));
                $price = max(0, (int)($it['price'] ?? 0));
                $subtotal += $qty * $price;
            }
            if ($subtotal <= 0) {
                return response()->json(['success'=>false,'message'=>'Giỏ hàng không hợp lệ.'], 422);
            }

            /** 2) Áp dụng coupon nếu có (đúng schema Coupon) */
            $couponId = null;
            $discount = 0;
            $userId   = optional($r->user())->id;

            $code = strtoupper(trim((string)($r->coupon_code ?? '')));
            if ($code !== '') {
                $coupon = Coupon::where('code', $code)->first();

                if (!$coupon || !$coupon->is_active) {
                    return response()->json(['success'=>false,'message'=>'Mã giảm giá không hợp lệ hoặc đã tắt.'], 422);
                }
                if (!$coupon->isWithinTime()) {
                    return response()->json(['success'=>false,'message'=>'Mã không trong thời gian áp dụng.'], 422);
                }
                if ($coupon->min_order && $subtotal < (int)$coupon->min_order) {
                    return response()->json(['success'=>false,'message'=>'Chưa đạt đơn tối thiểu để dùng mã này.'], 422);
                }

                // Giới hạn tổng hệ thống
                if (!is_null($coupon->usage_limit)) {
                    $usedGlobal = CouponRedemption::where('coupon_id', $coupon->id)->count();
                    if ($usedGlobal >= (int)$coupon->usage_limit) {
                        return response()->json(['success'=>false,'message'=>'Mã đã hết lượt sử dụng.'], 422);
                    }
                }
                // Giới hạn theo user
                if ($userId && !is_null($coupon->per_user_limit)) {
                    $usedByUser = CouponRedemption::where('coupon_id',$coupon->id)->where('user_id',$userId)->count();
                    if ($usedByUser >= (int)$coupon->per_user_limit) {
                        return response()->json(['success'=>false,'message'=>'Bạn đã dùng hết lượt cho mã này.'], 422);
                    }
                }

                // Tính số tiền giảm
                $discount = (int) $coupon->computeDiscount($subtotal);
                $couponId = $coupon->id;
            }

            $finalTotal = max(0, $subtotal - $discount);

            /** 3) Tạo order (pending) */
            $order = Order::create([
                'user_id'        => $userId,
                'name'           => $r->name ?? $r->customer_name,
                'phone'          => $r->phone ?? $r->customer_phone,
                'email'          => $r->email ?? $r->customer_email,
                'address'        => $r->address ?? $r->customer_address,
                'note'           => $r->note ?? $r->customer_note,

                'total'          => $subtotal,
                'discount'       => $discount,
                'final_total'    => $finalTotal,
                'coupon_id'      => $couponId,

                'status'         => Order::STATUS_PENDING,
                'payment_method' => $r->payment_method,
            ]);

            /** 4) Lưu chi tiết đơn */
            foreach ($r->items as $it) {
                $pid   = $it['product_id'] ?? $it['id'];
                $qty   = (int) ($it['qty']   ?? 1);
                $price = (int) ($it['price'] ?? 0);
                OrderDetail::create([
                    'order_id'   => $order->id,
                    'product_id' => $pid,
                    'price_buy'  => $price,
                    'qty'        => $qty,
                    'amount'     => $qty * $price,
                ]);
            }

            /** 5) Nếu COD: trả về ngay + ghi redemption (coi như đã thanh toán) */
            if ($r->payment_method === 'cod') {
                if ($couponId) {
                    CouponRedemption::firstOrCreate(
                        ['coupon_id'=>$couponId, 'user_id'=>$userId, 'order_id'=>$order->id],
                        ['discount_value'=>$discount]
                    );
                }
                return response()->json([
                    'success'  => true,
                    'message'  => 'Đặt hàng thành công (COD).',
                    'order_id' => $order->id,
                ]);
            }

            /** 6) MoMo: tạo payment + gọi cổng (orderId MoMo phải duy nhất mỗi lần) */
            $amount        = (int) ($order->final_total > 0 ? $order->final_total : $order->total);
            $requestId     = (string) Str::uuid();                       // unique
            $momoOrderId   = 'OD-'.$order->id.'-'.Str::lower(Str::ulid()); // unique mỗi lệnh

            $payment = Payment::create([
                'order_id'       => $order->id,
                'provider'       => 'momo',
                'amount'         => $amount,
                'status'         => 'pending',
                'request_id'     => $requestId,
                'momo_order_id'  => $momoOrderId,
            ]);

            $create = $momo->createPayment([
                'orderId'   => $momoOrderId,                       // gửi orderId duy nhất
                'amount'    => $amount,
                'orderInfo' => "Thanh toan don #{$order->id}",
                'requestId' => $requestId,
            ]);

            $payment->update(['response_payload' => $create]);

            if (($create['resultCode'] ?? 99) !== 0) {
                return response()->json([
                    'success' => false,
                    'message' => $create['message'] ?? 'Tạo lệnh thanh toán thất bại',
                    'data'    => $create,
                ], 422);
            }

            return response()->json([
                'success'  => true,
                'payUrl'   => $create['payUrl'] ?? null,
                'order_id' => $order->id,
            ]);
        });
    }

    /** MoMo redirect (tuỳ bạn xử lý UI) */
    public function momoReturn(Request $r)
    {
        return response()->json([
            'message' => 'RETURN from MoMo',
            'query'   => $r->all(),
        ]);
    }

    /** IPN từ MoMo: xác nhận thanh toán */
    public function momoIpn(Request $r, MomoService $momo)
    {
        $params       = $r->all();
        $momoOrderId  = $params['orderId']   ?? null;     // chính là momo_order_id ta đã gửi
        $resultCode   = (int)($params['resultCode'] ?? 99);
        $amount       = (int)($params['amount']     ?? 0);
        $transId      = $params['transId']   ?? null;

        if (!$momoOrderId) return response()->json(['message' => 'No orderId'], 400);

        // Tìm payment theo momo_order_id
        $payment = Payment::where('provider', 'momo')
            ->where('momo_order_id', $momoOrderId)
            ->latest()
            ->first();

        if (!$payment) return response()->json(['message' => 'Payment not found'], 404);

        $order = Order::find($payment->order_id);
        if (!$order) return response()->json(['message' => 'Order not found'], 404);

        $expected = (int)($order->final_total > 0 ? $order->final_total : $order->total);
        if ($amount !== $expected) {
            return response()->json(['message' => 'Invalid amount'], 400);
        }

        if ($resultCode === 0) {
            // thanh toán thành công
            $order->update([
                'status'  => Order::STATUS_CONFIRMED,   // dùng hằng có sẵn trong model của bạn
                'paid_at' => now(),
            ]);
            $payment->update([
                'status'           => 'paid',
                'provider_txn_id'  => $transId,
                'response_payload' => $params,
            ]);

            if ($order->coupon_id) {
                CouponRedemption::firstOrCreate(
                    ['coupon_id'=>$order->coupon_id, 'user_id'=>$order->user_id, 'order_id'=>$order->id],
                    ['discount_value'=>$order->discount ?? 0]
                );
            }
        } else {
            // thất bại / hủy
            $payment->update([
                'status'           => 'failed',
                'provider_txn_id'  => $transId,
                'response_payload' => $params,
            ]);
        }

        // MoMo yêu cầu HTTP 200
        return response()->json(['message' => 'ipn handled']);
    }
}
