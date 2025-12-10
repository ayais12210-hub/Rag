import Link from "next/link";
import { MessageSquare, Database, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Welcome to Lumina</h1>
      <p className="text-slate-400 mb-8">Your Enterprise AI Knowledge Hub</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/app/chat" className="block p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-blue-500 transition group">
          <MessageSquare className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-bold mb-2">Chat</h2>
          <p className="text-slate-400 text-sm">Query your documents with AI.</p>
        </Link>
        
        <Link href="/app/settings/sources" className="block p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-purple-500 transition group">
          <Database className="w-8 h-8 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-bold mb-2">Data Sources</h2>
          <p className="text-slate-400 text-sm">Manage knowledge base connections.</p>
        </Link>

        <Link href="/app/settings/team" className="block p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-green-500 transition group">
          <Users className="w-8 h-8 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
          <h2 className="text-xl font-bold mb-2">Team</h2>
          <p className="text-slate-400 text-sm">Manage members and access.</p>
        </Link>
      </div>
    </div>
  );
}