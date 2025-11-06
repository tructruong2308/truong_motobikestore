<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /* ===== PUBLIC: người dùng gửi liên hệ ===== */
    public function store(Request $r)
    {
        $data = $r->validate([
            'name'    => 'required|string|max:120',
            'email'   => 'required|email|max:190',
            'phone'   => 'nullable|string|max:30',
            'subject' => 'nullable|string|max:180',
            'message' => 'required|string|min:5|max:1000',
        ]);

        $c = Contact::create($data + ['status' => 'new']);
        return response()->json(['ok' => true, 'id' => $c->id, 'data' => $c], 201);
    }

    /* ===== ADMIN ===== */
    public function index(Request $r)
    {
        $q = Contact::query()->latest();
        if ($s = $r->query('status')) $q->where('status', $s);             // new|read|done
        if ($kw = $r->query('q')) {
            $q->where(fn($x) => $x->where('name','like',"%$kw%")
                ->orWhere('email','like',"%$kw%")
                ->orWhere('phone','like',"%$kw%")
                ->orWhere('subject','like',"%$kw%"));
        }
        return response()->json($q->paginate((int)$r->query('per_page', 10)));
    }

    public function show(Contact $contact)
    {
        return response()->json(['data' => $contact]);
    }

    public function markRead(Contact $contact)
    {
        if ($contact->status === 'new') {
            $contact->status  = 'read';
            $contact->read_at = now();
            $contact->save();
        }
        return response()->json(['data' => $contact]);
    }

    public function markDone(Contact $contact)
    {
        $contact->status  = 'done';
        $contact->done_at = now();
        $contact->save();
        return response()->json(['data' => $contact]);
    }

    // (tùy chọn) 1 endpoint chung PATCH /admin/contacts/{id} body: {status:'read'|'done'}
    public function resolve(Contact $contact, Request $r)
    {
        $status = $r->string('status')->toString();
        if (!in_array($status, ['read','done'])) return response()->json(['message'=>'Invalid status'], 422);
        if ($status === 'read' && $contact->status === 'new') { $contact->status='read'; $contact->read_at=now(); }
        if ($status === 'done') { $contact->status='done'; $contact->done_at=now(); }
        $contact->save();
        return response()->json(['data' => $contact]);
    }

    public function destroy(Contact $contact)
    {
        $contact->delete(); // soft delete
        return response()->json(['message' => 'deleted']);
    }
}
