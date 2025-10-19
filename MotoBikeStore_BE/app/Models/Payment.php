<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'provider',          // momo
        'amount',
        'status',            // pending|paid|failed
        'request_id',
        'provider_txn_id',
        'response_payload',
    ];

    protected $casts = [
        'amount'           => 'integer',
        'response_payload' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
