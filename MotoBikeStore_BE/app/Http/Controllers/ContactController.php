<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    // Lưu liên hệ từ form người dùng
    public function store(Request $r)
    {
        $data = $r->validate([
            'name' => 'required',
            'email' => 'required|email',
            'phone' => 'nullable',
            'message' => 'required|min:5'
        ]);

        $c = Contact::create($data);
        return response()->json(['ok' => true, 'id' => $c->id]);
    }

    // (tuỳ chọn) Xem danh sách liên hệ cho admin
    public function index()
    {
        return Contact::latest()->paginate(20);
    }
}
