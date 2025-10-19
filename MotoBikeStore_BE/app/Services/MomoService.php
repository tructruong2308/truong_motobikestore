<?php
// app/Services/MomoService.php
namespace App\Services;

use Illuminate\Support\Facades\Http;

class MomoService
{
    public function createPayment(array $data): array
    {
        $endpoint   = config('services.momo.create', env('MOMO_ENDPOINT_CREATE'));
        $partnerCode= env('MOMO_PARTNER_CODE');
        $accessKey  = env('MOMO_ACCESS_KEY');
        $secretKey  = env('MOMO_SECRET_KEY');

        $payload = [
            "partnerCode" => $partnerCode,
            "partnerName" => "MotoBikeStore",
            "storeId"     => "MBS01",
            "requestType" => "captureWallet",
            "ipnUrl"      => env('MOMO_IPN_URL'),
            "redirectUrl" => env('MOMO_REDIRECT_URL'),
            "orderId"     => $data['orderId'],        // mã đơn của bạn
            "amount"      => (string)$data['amount'], // string
            "orderInfo"   => $data['orderInfo'] ?? ("Thanh toan don " . $data['orderId']),
            "lang"        => "vi",
            "extraData"   => base64_encode(json_encode([
                "order_code" => $data['orderId']
            ], JSON_UNESCAPED_UNICODE)),
            "requestId"   => $data['requestId'],      // mã duy nhất
            "autoCapture" => true,
            "orderGroupId"=> "",
        ];

        // raw signature string
        $raw = "accessKey=$accessKey&amount={$payload['amount']}&extraData={$payload['extraData']}"
             . "&ipnUrl={$payload['ipnUrl']}&orderId={$payload['orderId']}&orderInfo={$payload['orderInfo']}"
             . "&partnerCode=$partnerCode&redirectUrl={$payload['redirectUrl']}&requestId={$payload['requestId']}"
             . "&requestType={$payload['requestType']}";
        $signature = hash_hmac('sha256', $raw, $secretKey);

        $payload['signature'] = $signature;

        $res = Http::timeout(20)->post($endpoint, $payload);
        return $res->json();
    }

    public function verifySignature(array $params): bool
    {
        $secretKey = env('MOMO_SECRET_KEY');
        // build raw from MoMo docs for IPN/return
        $raw = "accessKey={$params['accessKey']}"
             . "&amount={$params['amount']}"
             . "&extraData={$params['extraData']}"
             . "&message={$params['message']}"
             . "&orderId={$params['orderId']}"
             . "&orderInfo={$params['orderInfo']}"
             . "&orderType={$params['orderType']}"
             . "&partnerCode={$params['partnerCode']}"
             . "&payType={$params['payType']}"
             . "&requestId={$params['requestId']}"
             . "&responseTime={$params['responseTime']}"
             . "&resultCode={$params['resultCode']}"
             . "&transId={$params['transId']}";
        $sig = hash_hmac('sha256', $raw, $secretKey);
        return hash_equals($sig, $params['signature'] ?? '');
    }
}
