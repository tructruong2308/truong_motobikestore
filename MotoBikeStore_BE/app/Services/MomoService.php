<?php

namespace App\Services;

class MomoService
{
    public function createPayment(array $params): array
    {
        $endpoint    = config('services.momo.endpoint_create', env('MOMO_ENDPOINT_CREATE'));
        $partnerCode = env('MOMO_PARTNER_CODE');
        $accessKey   = env('MOMO_ACCESS_KEY');
        $secretKey   = env('MOMO_SECRET_KEY');

        $orderId     = (string) $params['orderId'];
        $amount      = (int) $params['amount'];
        $orderInfo   = $params['orderInfo'] ?? "Thanh toan don #{$orderId}";
        $requestId   = (string) $params['requestId'];
        $redirectUrl = env('MOMO_REDIRECT_URL');
        $ipnUrl      = env('MOMO_IPN_URL');
        $requestType = 'payWithMethod';
        $extraData   = '';

        $rawHash = "accessKey={$accessKey}&amount={$amount}&extraData={$extraData}&ipnUrl={$ipnUrl}&orderId={$orderId}&orderInfo={$orderInfo}&partnerCode={$partnerCode}&redirectUrl={$redirectUrl}&requestId={$requestId}&requestType={$requestType}";
        $signature = hash_hmac('sha256', $rawHash, $secretKey);

        $payload = [
            'partnerCode' => $partnerCode,
            'partnerName' => 'MoMo',
            'storeId'     => 'MBS',
            'requestId'   => $requestId,
            'amount'      => $amount,
            'orderId'     => $orderId,
            'orderInfo'   => $orderInfo,
            'redirectUrl' => $redirectUrl,
            'ipnUrl'      => $ipnUrl,
            'lang'        => 'vi',
            'extraData'   => $extraData,
            'requestType' => $requestType,
            'signature'   => $signature,
        ];

        $ch = curl_init($endpoint);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => "POST",
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 20,
        ]);
        $result = curl_exec($ch);
        $err    = curl_error($ch);
        curl_close($ch);

        if ($err) return ['resultCode'=>99, 'message'=>$err];
        $data = json_decode($result, true);
        return is_array($data) ? $data : ['resultCode'=>99, 'message'=>'Invalid MoMo response'];
    }

    public function verifySignature(array $params): bool
    {
        // Có thể bổ sung verify chữ ký IPN nếu cần
        return true;
    }
}
