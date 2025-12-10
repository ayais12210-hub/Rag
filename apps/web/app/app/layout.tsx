'use client';
import { useUser } from "@clerk/nextjs";
import { trpc } from "../../lib/trpc";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Bootstrap User & Check Org
  const { data, isLoading } = trpc.me.useMutation(); 
  // Note: Using mutation for "get or create" logic on mount is a simple MVP pattern

  useEffect(() => {
    if (isLoaded && user) {
      // In a real app we'd query first, but here we just hit the endpoint to ensure DB sync
      // We trigger the mutation immediately to sync Clerk user to DB
      // In prod, use webhooks
      // This is a placeholder for the "Check Org" logic
    }
  }, [isLoaded, user]);

  if (!isLoaded) return <div className="h-screen flex items-center justify-center text-white">Loading Auth...</div>;
  if (!user) {
    router.push("/");
    return null;
  }

  // Very simplified Org Selection
  // In real app: Show Org Switcher
  const activeOrgId = user.unsafeMetadata.activeOrgId;

  if (!activeOrgId) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
              <h2 className="text-2xl mb-4">Welcome, {user.firstName}</h2>
              <p className="mb-4">You need to create an organization to start.</p>
              <CreateOrgForm userId={user.id} />
          </div>
      )
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <aside className="w-64 border-r border-slate-800 p-4 flex flex-col">
        <div className="font-bold text-xl mb-8">Lumina</div>
        <nav className="space-y-2 flex-1">
          <NavLink href="/app/chat">Chat</NavLink>
          <NavLink href="/app/settings/sources">Data Sources</NavLink>
          <NavLink href="/app/settings/team">Team</NavLink>
        </nav>
        <div className="text-xs text-slate-500">Org: {activeOrgId}</div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, children }: any) {
    return <Link href={href} className="block px-4 py-2 rounded hover:bg-slate-800 transition">{children}</Link>
}

function CreateOrgForm({ userId }: { userId: string }) {
    const { user } = useUser();
    const createOrg = trpc.createOrg.useMutation({
        onSuccess: async (org) => {
            // Write back to Clerk metadata so our header logic works
            await user?.update({ unsafeMetadata: { activeOrgId: org.id } });
            window.location.reload();
        }
    });

    const onSubmit = (e: any) => {
        e.preventDefault();
        const name = e.target.orgName.value;
        createOrg.mutate({ clerkId: userId, name });
    }

    return (
        <form onSubmit={onSubmit} className="flex gap-2">
            <input name="orgName" placeholder="Organization Name" className="text-black px-3 py-2 rounded" required />
            <button disabled={createOrg.isLoading} className="bg-blue-600 px-4 py-2 rounded">Create</button>
        </form>
    )
}