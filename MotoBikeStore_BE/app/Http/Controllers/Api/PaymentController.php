<?php
// app/Http/Controllers/Api/PaymentController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\MomoService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function checkout(Request $r, MomoService $momo)
    {
        // 1) Validate
        $r->validate([
            'items'           => 'required|array|min:1',
            'total'           => 'required|integer|min:1000',
            'payment_method'  => 'required|in:cod,momo',
            'name'            => 'nullable|string|max:255',
            'phone'           => 'nullable|string|max:50',
            'email'           => 'nullable|email',
            'address'         => 'nullable|string|max:1000',
            'note'            => 'nullable|string',
        ]);

        return DB::transaction(function () use ($r, $momo) {
            $amount = (int) $r->total;

            // 2) Tạo đơn (status tinyint)
            $order = Order::create([
                'user_id'        => optional($r->user())->id,
                'name'           => $r->name ?? $r->customer_name,
                'phone'          => $r->phone ?? $r->customer_phone,
                'email'          => $r->email ?? $r->customer_email,
                'address'        => $r->address ?? $r->customer_address,
                'note'           => $r->note ?? $r->customer_note,
                'total'          => $amount,
                'status'         => Order::STATUS_PENDING,   // ✅ tinyint
                'payment_method' => $r->payment_method,      // varchar(20)
                // Có thể có cột payment_status, nếu chưa có thì bỏ đi
                // 'payment_status' => 'unpaid',
            ]);

            // (tuỳ chọn) Lưu order_details từ $r->items
            // ...

            // 3) COD → trả luôn
            if ($r->payment_method === 'cod') {
                return response()->json([
                    'success'  => true,
                    'message'  => 'Đặt hàng thành công (COD).',
                    'order_id' => $order->id,
                ]);
            }

            // 4) MoMo – Kiểm tra hạn mức sandbox (1.000 – 50.000.000)
            if ($amount < 1000) {
                return response()->json([
                    'success' => false,
                    'message' => 'Số tiền MoMo phải >= 1.000 VND.',
                ], 422);
            }
            if ($amount > 50_000_000) {
                // Cho test sandbox: có thể ép số tiền gửi đi nhỏ lại
                $force = (int) env('MOMO_FORCE_AMOUNT', 0);
                if ($force <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'MoMo sandbox chỉ cho phép tối đa 50.000.000đ/giao dịch. Vui lòng giảm số lượng hoặc chọn COD.',
                    ], 422);
                }
            }

            // 5) Số tiền gửi cho MoMo (ép khi test)
            $gatewayAmount = $amount;
            $forced = (int) env('MOMO_FORCE_AMOUNT', 0);
            if ($forced > 0) {
                $gatewayAmount = max(1000, min(50_000_000, $forced));
            }

            // 6) Tạo bản ghi Payment
            $payment = Payment::create([
                'order_id'   => $order->id,
                'provider'   => 'momo',
                'amount'     => $gatewayAmount, // số tiền gửi sang MoMo
                'status'     => 'pending',
                'request_id' => (string) Str::uuid(),
            ]);

            // 7) Gọi MoMo
            $create = $momo->createPayment([
                'orderId'   => (string) $order->id,
                'amount'    => $gatewayAmount,
                'orderInfo' => "Thanh toan don #{$order->id}",
                'requestId' => $payment->request_id,
            ]);

            $payment->update(['response_payload' => $create]);

            if (($create['resultCode'] ?? 99) !== 0) {
                return response()->json([
                    'success' => false,
                    'message' => $create['message'] ?? 'Tạo lệnh thanh toán thất bại',
                    'data'    => $create,
                ], 422);
            }

            // (tuỳ chọn) lưu thêm mã đơn gateway nếu cần
            if (!empty($create['orderId'])) {
                $order->update(['gateway_order_code' => $create['orderId']]);
            }

            return response()->json([
                'success'  => true,
                'payUrl'   => $create['payUrl'] ?? null,
                'order_id' => $order->id,
            ]);
        });
    }

    // MoMo redirect user về đây (hiển thị/redirect FE)
    public function momoReturn(Request $r)
    {
        return response()->json([
            'message' => 'RETURN from MoMo',
            'query'   => $r->all(),
        ]);
    }

    // MoMo gọi IPN về đây (server-to-server)
    public function momoIpn(Request $r, MomoService $momo)
    {
        $params     = $r->all();
        $orderId    = $params['orderId'] ?? null;
        $resultCode = (int)($params['resultCode'] ?? 99);
        $amount     = (int)($params['amount'] ?? 0);
        $transId    = $params['transId'] ?? null;

        if (!$orderId) return response()->json(['message' => 'No orderId'], 400);
        $order = Order::find($orderId);
        if (!$order) return response()->json(['message' => 'Order not found'], 404);

        // Nếu lúc checkout đã ép amount gửi cho MoMo, thì đối chiếu theo payments
        $payment = $order->payments()->where('provider', 'momo')->latest()->first();
        if ($payment && $amount !== (int) $payment->amount) {
            return response()->json(['message' => 'Invalid amount'], 400);
        }

        if ($resultCode === 0) {
            $order->update([
                'status'  => Order::STATUS_COMPLETED,
                'paid_at' => now(),
                // 'payment_status' => 'paid', // nếu có cột
            ]);
            if ($payment) {
                $payment->update([
                    'status'           => 'paid',
                    'provider_txn_id'  => $transId,
                    'response_payload' => $params,
                ]);
            }
        } else {
            // 'payment_status' => 'failed' nếu có cột
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
