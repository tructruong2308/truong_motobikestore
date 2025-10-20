<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // phát ngay (không xài queue)
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcastNow
{
    use InteractsWithSockets, SerializesModels;

    public int $orderId;
    public int $userId;
    public int $status;
    public string $statusLabel;
    public string $at;

    public function __construct($order)
    {
        $this->orderId = (int) ($order->id ?? $order['id']);
        $this->userId  = (int) ($order->user_id ?? $order['user_id']);
        $this->status  = (int) ($order->status ?? $order['status']);

        // KHỚP với FE/Admin: 0..5
        $this->statusLabel = match ($this->status) {
            0 => 'Chờ xác nhận',
            1 => 'Đã xác nhận',
            2 => 'Đang đóng gói',
            3 => 'Đang giao',
            4 => 'Đã giao',
            5 => 'Đã hủy',
            default => 'Không xác định',
        };

        $this->at = now()->toIso8601String();
    }

    public function broadcastOn(): PrivateChannel
    {
        // Kênh riêng của user
        return new PrivateChannel('users.' . $this->userId);
    }

    public function broadcastAs(): string
    {
        // Tên sự kiện để FE .listen('.order.status.updated', ...)
        return 'order.status.updated';
    }

    public function broadcastWith(): array
    {
        // Payload ổn định cho FE
        return [
            'order' => [
                'id'     => $this->orderId,
                'status' => $this->status,
                'label'  => $this->statusLabel,
            ],
            'at' => $this->at,
        ];
    }
}
