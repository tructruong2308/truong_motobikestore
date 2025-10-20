<?php
// app/Http/Controllers/Api/PaymentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Payment;
use App\Services\MomoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /** Tạo đơn + (nếu chọn) khởi tạo thanh toán MoMo */
    public function checkout(Request $r, MomoService $momo)
    {
        $r->validate([
            'items'                => 'required|array|min:1',
            'items.*.id'           => 'required',
            'items.*.product_id'   => 'nullable',
            'items.*.qty'          => 'required|integer|min:1',
            'items.*.price'        => 'required|integer|min:0',
            'payment_method'       => 'required|in:cod,momo',

            // Thông tin KH
            'name'            => 'nullable|string',
            'customer_name'   => 'nullable|string',
            'phone'           => 'nullable|string',
            'customer_phone'  => 'nullable|string',
            'email'           => 'nullable|email',
            'customer_email'  => 'nullable|email',
            'address'         => 'nullable|string',
            'customer_address'=> 'nullable|string',
            'note'            => 'nullable|string',
            'customer_note'   => 'nullable|string',
        ]);

        return DB::transaction(function () use ($r, $momo) {
            /** 1) TÍNH LẠI TỔNG TIỀN Ở SERVER */
            $calcTotal = 0;
            foreach ($r->items as $it) {
                $qty   = (int) ($it['qty']   ?? 1);
                $price = (int) ($it['price'] ?? 0);
                $calcTotal += $qty * $price;
            }

            if ($calcTotal <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Giỏ hàng không hợp lệ.',
                ], 422);
            }

            /** 2) TẠO ĐƠN HÀNG (pending) */
            $order = Order::create([
                'user_id'        => optional($r->user())->id,
                'name'           => $r->name ?? $r->customer_name,
                'phone'          => $r->phone ?? $r->customer_phone,
                'email'          => $r->email ?? $r->customer_email,
                'address'        => $r->address ?? $r->customer_address,
                'note'           => $r->note ?? $r->customer_note,
                'total'          => $calcTotal,
                'status'         => Order::STATUS_PENDING, // số nguyên
                'payment_method' => $r->payment_method,     // 'cod' | 'momo'
            ]);

            /** 3) LƯU CHI TIẾT ĐƠN */
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

            /** 4) COD → trả kết quả ngay */
            if ($r->payment_method === 'cod') {
                return response()->json([
                    'success'  => true,
                    'message'  => 'Đặt hàng thành công (COD).',
                    'order_id' => $order->id,
                ]);
            }

            /** 5) MoMo: tạo payment + call gateway */
            // (Lưu ý sandbox MoMo giới hạn 1,000–50,000,000 VND)
            $amount = $order->total;

            $requestId = (string) Str::uuid();
            $payment = Payment::create([
                'order_id'   => $order->id,
                'provider'   => 'momo',
                'amount'     => $amount,
                'status'     => 'pending',
                'request_id' => $requestId,
            ]);

            $create = $momo->createPayment([
                'orderId'   => (string) $order->id,
                'amount'    => $amount,
                'orderInfo' => "Thanh toan don #{$order->id}",
                'requestId' => $requestId,
            ]);

            // Lưu để debug khi cần
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

    /** User được redirect về từ MoMo (tuỳ bạn hiển thị trang “Đang xác minh…”) */
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
        $params     = $r->all();
        $orderId    = $params['orderId']   ?? null;
        $resultCode = (int)($params['resultCode'] ?? 99);
        $amount     = (int)($params['amount']     ?? 0);
        $transId    = $params['transId']   ?? null;

        if (!$orderId) return response()->json(['message' => 'No orderId'], 400);

        $order = Order::find($orderId);
        if (!$order) return response()->json(['message' => 'Order not found'], 404);

        if ($amount !== (int)$order->total) {
            return response()->json(['message' => 'Invalid amount'], 400);
        }

        $payment = $order->payments()->latest()->first();

        if ($resultCode === 0) {
            $order->update([
                'status'  => Order::STATUS_COMPLETED,
                'paid_at' => now(),
            ]);
            if ($payment) {
                $payment->update([
                    'status'            => 'paid',
                    'provider_txn_id'   => $transId,
                    'response_payload'  => $params,
                ]);
            }
        } else {
            if ($payment) {
                $payment->update([
                    'status'           => 'failed',
                    'provider_txn_id'  => $transId,
                    'response_payload' => $params,
                ]);
            }
        }

        return response()->json(['message' => 'ipn handled']);
    }
}
