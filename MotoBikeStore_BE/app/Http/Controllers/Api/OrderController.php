<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class OrderController extends Controller
{
    // ================== DANH SÁCH ĐƠN HÀNG ==================
    public function index()
    {
        $orders = Order::with('details')
            ->orderByDesc('id')
            ->get()
            ->map(function ($o) {
                $o->total = $o->details->sum(fn($d) => $d->price_buy * $d->qty);
                return $o;
            });

        return response()->json(['data' => $orders]);
    }

    // ================== XEM CHI TIẾT 1 ĐƠN ==================
    public function show($id)
    {
        $order = Order::with(['details.product'])->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $order->total = $order->details->sum(fn($d) => $d->price_buy * $d->qty);

        return response()->json($order);
    }

    // ================== TẠO ĐƠN HÀNG (CHECKOUT) ==================
    public function checkout(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Validate "mềm" cho payload linh hoạt từ FE của bạn
        $data = $request->validate([
            'customer_name'    => 'nullable|string|max:100',
            'name'             => 'nullable|string|max:100',
            'phone'            => 'required|string|max:20',
            'address'          => 'required|string|max:255',
            'email'            => 'nullable|email|max:255',

            'items'            => 'nullable|array|min:1',
            'order_details'    => 'nullable|array|min:1',

            'payment_method'   => 'nullable|in:cod,momo', // thêm online method
        ]);

        // Gộp các field
        $customerName = $data['customer_name'] ?? $data['name'] ?? ($user->name ?? '');
        $phone        = $data['phone'];
        $address      = $data['address'];
        $email        = $data['email'] ?? $user->email ?? null;
        $paymentMethod= $data['payment_method'] ?? 'cod';

        $rawItems     = $data['order_details'] ?? $data['items'] ?? [];
        if (!is_array($rawItems) || count($rawItems) === 0) {
            return response()->json(['message' => 'Giỏ hàng trống hoặc sai định dạng items'], 422);
        }

        // Chuẩn hoá dòng
        $lines = [];
        $total = 0;
        foreach ($rawItems as $i) {
            $pid   = $i['product_id'] ?? $i['id'] ?? null;
            $qty   = (int)($i['quantity'] ?? $i['qty'] ?? 1);
            $price = (int)($i['unit_price'] ?? $i['price'] ?? 0);
            if (!$pid || $qty <= 0) continue;

            $amount = $qty * $price;
            $total += $amount;

            $lines[] = [
                'product_id' => $pid,
                'qty'        => $qty,
                'price_buy'  => $price,
                'amount'     => $amount,
                // tuỳ chọn: tên/ảnh nếu bảng chi tiết có
                // 'name'    => $i['name'] ?? null,
                // 'thumbnail'=> $i['thumbnail'] ?? null,
            ];
        }

        if (empty($lines)) {
            return response()->json(['message' => 'Không có dòng hàng hợp lệ'], 422);
        }

        // Tạo đơn + chi tiết
        try {
            DB::beginTransaction();

            $order = Order::create([
                'user_id'        => $user->id,
                'name'           => $customerName,
                'phone'          => $phone,
                'email'          => $email,
                'address'        => $address,
                'status'         => 0,           // 0 = mới tạo
                'payment_method' => $paymentMethod,      // cần có cột này (migrate ở trên)
                'payment_status' => 'unpaid',            // unpaid|paid|failed
                'note'           => $request->input('note'),
            ]);

            foreach ($lines as $ln) {
                OrderDetail::create([
                    'order_id'   => $order->id,
                    'product_id' => $ln['product_id'],
                    'price_buy'  => $ln['price_buy'],
                    'qty'        => $ln['qty'],
                    'amount'     => $ln['amount'],
                ]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Không lưu được đơn hàng',
                'error'   => $e->getMessage(),
            ], 500);
        }

        // Nếu COD → trả OK luôn
        if ($paymentMethod === 'cod') {
            return response()->json([
                'success'  => true,
                'message'  => 'Đặt hàng thành công (COD)',
                'order_id' => $order->id,
                'total'    => $total,
            ]);
        }

        // Nếu MoMo → tạo payUrl và trả cho FE
        if ($paymentMethod === 'momo') {
            try {
                $pay = $this->createMoMoPayment($order->id, $total);
                if (!$pay['success']) {
                    // gateway lỗi: cho phép fallback COD hoặc báo lỗi
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tạo được thanh toán MoMo: '.$pay['message'],
                    ], 500);
                }

                // Lưu mã giao dịch/gateway order code (nếu cần)
                if (!empty($pay['orderId'])) {
                    Order::where('id', $order->id)->update([
                        'gateway_order_code' => $pay['orderId'],
                    ]);
                }

                return response()->json([
                    'success'  => true,
                    'message'  => 'Tạo thanh toán MoMo thành công',
                    'order_id' => $order->id,
                    'total'    => $total,
                    'payUrl'   => $pay['payUrl'],  // FE redirect tới đây
                ]);
            } catch (\Throwable $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lỗi tích hợp MoMo: '.$e->getMessage(),
                ], 500);
            }
        }

        // Default
        return response()->json([
            'success'  => true,
            'message'  => 'Đặt hàng thành công',
            'order_id' => $order->id,
            'total'    => $total,
        ]);
    }

    // ================== MoMo helper ==================
    protected function createMoMoPayment(int $orderId, int $amount): array
    {
        $endpoint   = config('services.momo.create') ?? env('MOMO_ENDPOINT_CREATE');
        $partnerCode= env('MOMO_PARTNER_CODE');
        $accessKey  = env('MOMO_ACCESS_KEY');
        $secretKey  = env('MOMO_SECRET_KEY');

        $orderInfo  = "Thanh toan don #{$orderId}";
        $redirectUrl= env('MOMO_RETURN_URL');
        $ipnUrl     = env('MOMO_IPN_URL');
        $requestId  = (string)now()->timestamp.$orderId;
        $orderIdStr = "MBS{$orderId}_".now()->format('YmdHis');
        $extraData  = ""; // base64 nếu cần

        $rawHash = "accessKey={$accessKey}&amount={$amount}&extraData={$extraData}".
                   "&ipnUrl={$ipnUrl}&orderId={$orderIdStr}&orderInfo={$orderInfo}".
                   "&partnerCode={$partnerCode}&redirectUrl={$redirectUrl}&requestId={$requestId}".
                   "&requestType=captureWallet";
        $signature = hash_hmac('sha256', $rawHash, $secretKey);

        $payload = [
            'partnerCode' => $partnerCode,
            'accessKey'   => $accessKey,
            'requestId'   => $requestId,
            'amount'      => (string)$amount,
            'orderId'     => $orderIdStr,
            'orderInfo'   => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl'      => $ipnUrl,
            'extraData'   => $extraData,
            'requestType' => 'captureWallet',
            'signature'   => $signature,
            'lang'        => 'vi',
        ];

        $res = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post($endpoint, $payload);

        if (!$res->ok()) {
            return ['success' => false, 'message' => 'HTTP '.$res->status()];
        }

        $j = $res->json();
        if (!empty($j['resultCode']) && (int)$j['resultCode'] !== 0) {
            return ['success' => false, 'message' => $j['message'] ?? 'MoMo error'];
        }

        return [
            'success' => true,
            'payUrl'  => $j['payUrl'] ?? $j['deeplink'] ?? null,
            'orderId' => $j['orderId'] ?? null, // mã của MoMo
        ];
    }

    // ================== MoMo: Return URL (user được redirect về) ==================
    public function momoReturn(Request $request)
    {
        // MoMo sẽ trả các tham số query: resultCode, message, orderId, amount...
        $resultCode = (int)$request->get('resultCode', -1);
        $message    = $request->get('message');
        $momoOrderId= $request->get('orderId');
        $amount     = (int)$request->get('amount', 0);

        // Optional: map ngược momoOrderId -> order_id (nếu bạn lưu gateway_order_code ở trên)
        if ($momoOrderId) {
            Order::where('gateway_order_code', $momoOrderId)
                ->update([
                    'payment_status' => $resultCode === 0 ? 'paid' : 'failed',
                    'paid_at'        => $resultCode === 0 ? now() : null,
                    'updated_at'     => now(),
                ]);
        }

        // Trả trang/JSON tuỳ bạn. Ở đây trả JSON cho nhanh.
        return response()->json([
            'success'     => $resultCode === 0,
            'message'     => $message,
            'momoOrderId' => $momoOrderId,
            'amount'      => $amount,
        ]);
    }

    // ================== MoMo: IPN URL (server to server) ==================
    public function momoIPN(Request $request)
    {
        // IPN quan trọng hơn Return (đảm bảo server cập nhật)
        $resultCode  = (int)$request->input('resultCode', -1);
        $message     = $request->input('message');
        $momoOrderId = $request->input('orderId'); // của MoMo
        $amount      = (int)$request->input('amount', 0);

        if ($momoOrderId) {
            Order::where('gateway_order_code', $momoOrderId)
                ->update([
                    'payment_status' => $resultCode === 0 ? 'paid' : 'failed',
                    'paid_at'        => $resultCode === 0 ? now() : null,
                    'updated_at'     => now(),
                ]);
        }

        // Phản hồi đúng format để MoMo biết IPN đã nhận
        return response()->json(['resultCode' => 0, 'message' => 'OK']);
    }

    // ================== CẬP NHẬT TRẠNG THÁI ==================
    public function updateStatus(Request $request, $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $request->validate(['status' => 'required|integer']);
        $order->status = $request->input('status');
        $order->save();

        return response()->json(['message' => 'Status updated']);
    }
}
