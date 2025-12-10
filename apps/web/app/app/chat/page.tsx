'use client';
import { trpc } from "../../../../lib/trpc";
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

interface Message {
    role: 'USER' | 'ASSISTANT';
    content: string;
}

export default function ChatPage() {
    const { user } = useUser();
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const sessions = trpc.chat.listSessions.useQuery();
    const createSession = trpc.chat.createSession.useMutation();
    const history = trpc.chat.getHistory.useQuery(
        { sessionId: currentSessionId! }, 
        { enabled: !!currentSessionId }
    );

    // Load history when switching sessions
    useEffect(() => {
        if (history.data) {
            setMessages(history.data.map((m: any) => ({ role: m.role, content: m.content })));
        }
    }, [history.data]);

    // Scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleCreateSession = async () => {
        const s = await createSession.mutateAsync();
        sessions.refetch();
        setCurrentSessionId(s.id);
        setMessages([]);
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isStreaming) return;
        
        let activeId = currentSessionId;
        if (!activeId) {
            const s = await createSession.mutateAsync();
            setCurrentSessionId(s.id);
            activeId = s.id;
            sessions.refetch();
        }

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'USER', content: userMsg }]);
        setIsStreaming(true);

        try {
            // Using standard fetch for streaming
            const res = await fetch('http://localhost:3001/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: activeId,
                    message: userMsg,
                    userId: user?.id,
                    organizationId: user?.unsafeMetadata?.activeOrgId
                })
            });

            if (!res.body) throw new Error("No body");
            
            // Add placeholder for assistant
            setMessages(prev => [...prev, { role: 'ASSISTANT', content: "" }]);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value);
                
                setMessages(prev => {
                    const newArr = [...prev];
                    const last = newArr[newArr.length - 1];
                    last.content += chunkValue;
                    return newArr;
                });
            }

        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'ASSISTANT', content: "Error communicating with server." }]);
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-800 bg-slate-900 p-4 flex flex-col">
                <button onClick={handleCreateSession} className="w-full bg-blue-600 text-white p-2 rounded mb-4 hover:bg-blue-500">
                    + New Chat
                </button>
                <div className="flex-1 overflow-y-auto space-y-1">
                    {sessions.data?.map((s: any) => (
                        <button 
                            key={s.id} 
                            onClick={() => setCurrentSessionId(s.id)}
                            className={`w-full text-left p-2 rounded text-sm truncate ${currentSessionId === s.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            {s.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-950">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {!currentSessionId && messages.length === 0 && (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            Select a chat or start a new one.
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-2xl p-4 rounded-lg ${m.role === 'USER' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                                <div className="whitespace-pre-wrap">{m.content}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
                
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <form onSubmit={sendMessage} className="flex gap-2 max-w-4xl mx-auto">
                        <input 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button disabled={isStreaming} className="bg-blue-600 px-6 py-2 rounded-lg font-bold disabled:opacity-50">
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}