import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-6 tracking-tighter">Lumina.</h1>
      <p className="text-xl text-slate-400 mb-8 max-w-2xl text-center">
        The Enterprise AI Knowledge Hub. Chat with your PDFs, Slack, and Drive documents securely.
      </p>
      <div className="flex gap-4">
        <Link href="/app/chat" className="px-6 py-3 bg-blue-600 rounded-lg font-semibold hover:bg-blue-500 transition">
          Enter App
        </Link>
      </div>
    </div>
  );
}
