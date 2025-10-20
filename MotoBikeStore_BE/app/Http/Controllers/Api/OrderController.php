<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Events\OrderStatusUpdated;

class OrderController extends Controller
{
    /* ================== Helpers ================== */
    /**
     * Chuẩn hoá danh sách item để FE dùng trực tiếp:
     * name, qty, price, amount, thumbnail_url, product_id
     */
    protected function mapItems($details)
    {
        return $details->map(function ($d) {
            $p = $d->product; // có thể null nếu SP bị xoá
            return [
                'product_id'    => $d->product_id,
                'name'          => $p->name ?? ($d->name ?? ('Sản phẩm #' . ($d->product_id ?? ''))),
                'qty'           => (int) ($d->qty ?? 0),
                'price'         => (float) ($d->price_buy ?? 0),
                'amount'        => (float) ($d->amount ?? ((int)($d->qty ?? 0) * (float)($d->price_buy ?? 0))),
                'thumbnail_url' => $p->thumbnail_url ?? $d->thumbnail ?? null,
            ];
        })->values();
    }

    /**
     * Tính tổng từ chi tiết
     */
    protected function calcTotal($order)
    {
        return $order->details->sum(function ($d) {
            $price = (float) ($d->price_buy ?? 0);
            $qty   = (int)   ($d->qty ?? 0);
            return $price * $qty;
        });
    }

    /* ================== CUSTOMER: DS đơn của chính mình ================== */
    public function index()
    {
        $uid = auth()->id(); // vì route đã ở nhóm auth:sanctum
        $orders = Order::with(['details.product'])
            ->where('user_id', $uid)
            ->orderByDesc('id')
            ->get()
            ->map(function ($o) {
                $o->total = $this->calcTotal($o);
                return $o;
            });

        // FE của bạn đọc được cả dạng mảng thuần hoặc bọc "data"
        return response()->json(['data' => $orders]);
    }

    /* ================== CUSTOMER: Xem chi tiết đơn của chính mình ================== */
    public function show($id)
    {
        $uid = auth()->id();
        $order = Order::with(['details.product'])
            ->where('user_id', $uid)
            ->find($id);

        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $order->total = $this->calcTotal($order);

        // Để FE đọc dễ hơn, trả thêm "items" đã map sẵn
        $order->items = $this->mapItems($order->details);

        return response()->json($order);
    }

    /* ================== ADMIN: Danh sách tất cả đơn ================== */
    public function adminIndex()
    {
        $orders = Order::with(['details.product'])
            ->orderByDesc('id')
            ->get()
            ->map(function ($o) {
                $o->total = $this->calcTotal($o);
                return $o;
            });

        return response()->json(['data' => $orders]);
    }

    /* ================== ADMIN: Xem chi tiết 1 đơn ================== */
    public function adminShow($id)
    {
        $order = Order::with(['details.product'])->find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $order->total = $this->calcTotal($order);
        $order->items = $this->mapItems($order->details);

        return response()->json($order);
    }

    /* ================== CHECKOUT ================== */
    public function checkout(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $data = $request->validate([
            'customer_name'  => 'nullable|string|max:100',
            'name'           => 'nullable|string|max:100',
            'phone'          => 'required|string|max:20',
            'address'        => 'required|string|max:255',
            'email'          => 'nullable|email|max:255',
            'items'          => 'nullable|array|min:1',
            'order_details'  => 'nullable|array|min:1',
            'payment_method' => 'nullable|in:cod,momo',
        ]);

        $customerName = $data['customer_name'] ?? $data['name'] ?? ($user->name ?? '');
        $phone        = $data['phone'];
        $address      = $data['address'];
        $email        = $data['email'] ?? $user->email ?? null;
        $paymentMethod= $data['payment_method'] ?? 'cod';

        $rawItems = $data['order_details'] ?? $data['items'] ?? [];
        if (!is_array($rawItems) || count($rawItems) === 0) {
            return response()->json(['message' => 'Giỏ hàng trống hoặc sai định dạng items'], 422);
        }

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
            ];
        }

        if (empty($lines)) {
            return response()->json(['message' => 'Không có dòng hàng hợp lệ'], 422);
        }

        try {
            DB::beginTransaction();

            $order = Order::create([
                'user_id'        => $user->id,
                'name'           => $customerName,
                'phone'          => $phone,
                'email'          => $email,
                'address'        => $address,
                'status'         => 0,               // 0 = mới tạo
                'payment_method' => $paymentMethod,  // cần cột này
                'payment_status' => 'unpaid',        // unpaid|paid|failed
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

        if ($paymentMethod === 'cod') {
            return response()->json([
                'success'  => true,
                'message'  => 'Đặt hàng thành công (COD)',
                'order_id' => $order->id,
                'total'    => $total,
            ]);
        }

        if ($paymentMethod === 'momo') {
            try {
                $pay = $this->createMoMoPayment($order->id, $total);
                if (!$pay['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Không tạo được thanh toán MoMo: ' . $pay['message'],
                    ], 500);
                }

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
                    'payUrl'   => $pay['payUrl'],
                ]);
            } catch (\Throwable $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lỗi tích hợp MoMo: ' . $e->getMessage(),
                ], 500);
            }
        }

        return response()->json([
            'success'  => true,
            'message'  => 'Đặt hàng thành công',
            'order_id' => $order->id,
            'total'    => $total,
        ]);
    }

    /* ================== MoMo helper ================== */
    protected function createMoMoPayment(int $orderId, int $amount): array
    {
        $endpoint    = config('services.momo.create') ?? env('MOMO_ENDPOINT_CREATE');
        $partnerCode = env('MOMO_PARTNER_CODE');
        $accessKey   = env('MOMO_ACCESS_KEY');
        $secretKey   = env('MOMO_SECRET_KEY');

        $orderInfo  = "Thanh toan don #{$orderId}";
        $redirectUrl= env('MOMO_RETURN_URL');
        $ipnUrl     = env('MOMO_IPN_URL');
        $requestId  = (string) now()->timestamp . $orderId;
        $orderIdStr = "MBS{$orderId}_" . now()->format('YmdHis');
        $extraData  = "";

        $rawHash = "accessKey={$accessKey}&amount={$amount}&extraData={$extraData}" .
                   "&ipnUrl={$ipnUrl}&orderId={$orderIdStr}&orderInfo={$orderInfo}" .
                   "&partnerCode={$partnerCode}&redirectUrl={$redirectUrl}&requestId={$requestId}" .
                   "&requestType=captureWallet";
        $signature = hash_hmac('sha256', $rawHash, $secretKey);

        $payload = [
            'partnerCode' => $partnerCode,
            'accessKey'   => $accessKey,
            'requestId'   => $requestId,
            'amount'      => (string) $amount,
            'orderId'     => $orderIdStr,
            'orderInfo'   => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl'      => $ipnUrl,
            'extraData'   => $extraData,
            'requestType' => 'captureWallet',
            'signature'   => $signature,
            'lang'        => 'vi',
        ];

        $res = Http::withHeaders(['Content-Type' => 'application/json'])->post($endpoint, $payload);

        if (!$res->ok()) {
            return ['success' => false, 'message' => 'HTTP ' . $res->status()];
        }

        $j = $res->json();
        if (!empty($j['resultCode']) && (int) $j['resultCode'] !== 0) {
            return ['success' => false, 'message' => $j['message'] ?? 'MoMo error'];
        }

        return [
            'success' => true,
            'payUrl'  => $j['payUrl'] ?? $j['deeplink'] ?? null,
            'orderId' => $j['orderId'] ?? null,
        ];
    }

    /* ================== MoMo Return ================== */
    public function momoReturn(Request $request)
    {
        $resultCode  = (int) $request->get('resultCode', -1);
        $message     = $request->get('message');
        $momoOrderId = $request->get('orderId');
        $amount      = (int) $request->get('amount', 0);

        if ($momoOrderId) {
            Order::where('gateway_order_code', $momoOrderId)->update([
                'payment_status' => $resultCode === 0 ? 'paid' : 'failed',
                'paid_at'        => $resultCode === 0 ? now() : null,
                'updated_at'     => now(),
            ]);
        }

        return response()->json([
            'success'     => $resultCode === 0,
            'message'     => $message,
            'momoOrderId' => $momoOrderId,
            'amount'      => $amount,
        ]);
    }

    /* ================== MoMo IPN ================== */
    public function momoIPN(Request $request)
    {
        $resultCode  = (int) $request->input('resultCode', -1);
        $message     = $request->input('message');
        $momoOrderId = $request->input('orderId');
        $amount      = (int) $request->input('amount', 0);

        if ($momoOrderId) {
            Order::where('gateway_order_code', $momoOrderId)->update([
                'payment_status' => $resultCode === 0 ? 'paid' : 'failed',
                'paid_at'        => $resultCode === 0 ? now() : null,
                'updated_at'     => now(),
            ]);
        }

        return response()->json(['resultCode' => 0, 'message' => 'OK']);
    }

    /* ================== Admin cập nhật trạng thái ================== */
        public function updateStatus(Request $request, $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $request->validate(['status' => 'required|integer']);
        $order->status = (int) $request->input('status');
        $order->save();

        // TÍNH LẠI total nếu muốn gửi kèm
        $order->loadMissing('details');
        $order->total = $order->details->sum(fn($d) => ($d->price_buy ?? 0) * ($d->qty ?? 0));

        // 🔔 BẮN EVENT
        event(new OrderStatusUpdated($order));

        return response()->json(['message' => 'Status updated']);
    }
}
