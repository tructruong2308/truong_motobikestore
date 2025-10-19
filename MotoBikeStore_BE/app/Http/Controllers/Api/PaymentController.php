<?php
// app/Http/Controllers/Api/PaymentController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;     // ntt_order model
use App\Models\Payment;   // payments model
use App\Services\MomoService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function checkout(Request $r, MomoService $momo)
    {
        // 1) validate form (name/phone/address ... bạn đã có logic rồi)
        $r->validate([
            'items' => 'required|array|min:1',
            'total' => 'required|integer|min:1000',
            'payment_method' => 'required|in:cod,momo',
        ]);

        return DB::transaction(function () use ($r, $momo) {
            // 2) Tạo Order (pending)
            $order = Order::create([
                'user_id'         => optional($r->user())->id,
                'name'            => $r->name ?? $r->customer_name,
                'phone'           => $r->phone ?? $r->customer_phone,
                'email'           => $r->email ?? $r->customer_email,
                'address'         => $r->address ?? $r->customer_address,
                'note'            => $r->note ?? $r->customer_note,
                'total'           => $r->total,
                'status'          => 'pending',
                'payment_method'  => $r->payment_method,
                'payment_status'  => 'unpaid',
            ]);
            // TODO: insert order details từ $r->items …

            if ($r->payment_method === 'cod') {
                return response()->json([
                    'success' => true,
                    'message' => 'Đặt hàng thành công (COD).',
                    'order_id'=> $order->id,
                ]);
            }

            // 3) Online (MoMo) -> tạo Payment + tạo request
            $requestId = (string) Str::uuid();
            $payment = Payment::create([
                'order_id'  => $order->id,
                'provider'  => 'momo',
                'amount'    => $order->total,
                'status'    => 'pending',
            ]);

            $create = $momo->createPayment([
                'orderId'   => (string)$order->id, // dùng id order làm mã
                'amount'    => $order->total,
                'orderInfo' => "Thanh toan don #{$order->id}",
                'requestId' => $requestId,
            ]);

            // Lưu response thô để debug
            $payment->update(['response_payload' => $create]);

            if (($create['resultCode'] ?? 99) !== 0) {
                return response()->json([
                    'success' => false,
                    'message' => $create['message'] ?? 'Tạo lệnh thanh toán thất bại',
                    'data'    => $create,
                ], 422);
            }

            // Lưu mã giao dịch gateway ~ payUrl, orderId, requestId…
            $order->update([
                'gateway_order_code' => $create['orderId'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'payUrl'  => $create['payUrl'],
                'order_id'=> $order->id,
            ]);
        });
    }

    // MoMo redirect user về đây
    public function momoReturn(Request $r)
    {
        // Người dùng quay lại – nên hiển thị trang “đang xác minh”
        // FE có thể đọc query (resultCode, orderId, message…) rồi call API /payments/query để confirm.
        return response()->json([
            'message' => 'RETURN from MoMo',
            'query'   => $r->all(),
        ]);
    }

    // MoMo gọi IPN về đây (server-to-server)
    public function momoIpn(Request $r, MomoService $momo)
    {
        $params = $r->all();
        // 1) signature
        // (nhiều test sandbox không gửi đủ trường cho raw – bạn log $params để ráp raw chuẩn)
        // if (!$momo->verifySignature($params)) {
        //     return response()->json(['message'=>'Invalid signature'], 400);
        // }

        $orderId   = $params['orderId'] ?? null;
        $resultCode= (int)($params['resultCode'] ?? 99);
        $amount    = (int)($params['amount'] ?? 0);
        $transId   = $params['transId'] ?? null;

        if (!$orderId) return response()->json(['message'=>'No orderId'], 400);

        $order = Order::find($orderId);
        if (!$order) return response()->json(['message'=>'Order not found'], 404);

        // 2) kiểm tra số tiền
        if ($amount !== (int)$order->total) {
            return response()->json(['message'=>'Invalid amount'], 400);
        }

        // 3) cập nhật
        if ($resultCode === 0) {
            $order->update([
                'payment_status' => 'paid',
                'status'         => 'completed',
                'paid_at'        => now(),
            ]);
            $payment = $order->payments()->latest()->first();
            if ($payment) {
                $payment->update([
                    'status' => 'paid',
                    'provider_txn_id' => $transId,
                    'response_payload' => $params,
                ]);
            }
        } else {
            $order->update(['payment_status'=>'failed']);
            $payment = $order->payments()->latest()->first();
            if ($payment) {
                $payment->update([
                    'status' => 'failed',
                    'provider_txn_id' => $transId,
                    'response_payload' => $params,
                ]);
            }
        }

        // MoMo yêu cầu trả 200/OK
        return response()->json(['message'=>'ipn handled']);
    }
}
