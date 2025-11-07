<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatThread;
use App\Models\ChatMessage;
use Illuminate\Http\Request;

class ChatHistoryController extends Controller
{
    // POST /api/chat/threads
    public function createThread(Request $req)
    {
        $user = $req->user();
        $data = $req->validate([
            'title' => 'nullable|string|max:200',
            'model' => 'nullable|string|max:100',
        ]);
        $thread = ChatThread::create([
            'user_id' => $user->id,
            'title'   => $data['title'] ?? 'Cuộc trò chuyện mới',
            'model'   => $data['model'] ?? 'gpt-4o-mini',
        ]);
        return response()->json($thread, 201);
    }

    // GET /api/chat/threads
    public function listThreads(Request $req)
    {
        $threads = ChatThread::where('user_id', $req->user()->id)
            ->latest('updated_at')
            ->get(['id','title','model','created_at','updated_at']);
        return response()->json($threads);
    }

    // GET /api/chat/threads/{id}
    public function getThread(Request $req, $id)
    {
        $thread = ChatThread::where('user_id', $req->user()->id)
            ->with('messages')
            ->findOrFail($id);
        return response()->json($thread);
    }

    // PATCH /api/chat/threads/{id}/title
    public function renameThread(Request $req, $id)
    {
        $data = $req->validate(['title' => 'required|string|max:200']);
        $thread = ChatThread::where('user_id', $req->user()->id)->findOrFail($id);
        $thread->update(['title' => $data['title']]);
        return response()->json(['ok' => true]);
    }

    // DELETE /api/chat/threads/{id}
    public function deleteThread(Request $req, $id)
    {
        ChatThread::where('user_id', $req->user()->id)->where('id',$id)->delete();
        return response()->json(['ok' => true]);
    }

    // POST /api/chat/threads/{id}/messages
    public function appendMessage(Request $req, $id)
    {
        $thread = ChatThread::where('user_id', $req->user()->id)->findOrFail($id);

        $data = $req->validate([
            'role'          => 'required|in:user,assistant,system',
            'content'       => 'required|string',
            'content_parts' => 'nullable|array',
        ]);

        $msg = ChatMessage::create([
            'thread_id'     => $thread->id,
            'role'          => $data['role'],
            'content'       => $data['content'],
            'content_parts' => $data['content_parts'] ?? null,
        ]);

        // bump updated_at để listThreads sort đúng
        $thread->touch();

        return response()->json($msg, 201);
    }
}
