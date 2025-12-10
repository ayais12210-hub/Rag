'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useAuth, useUser } from '@clerk/nextjs';

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: 'http://localhost:3001/trpc',
          async headers() {
            const token = await getToken();
            const orgId = user?.unsafeMetadata?.activeOrgId as string || ""; // Hack for state
            return {
              Authorization: token ? `Bearer ${token}` : undefined,
              'x-user-id': user?.id, // Fallback for dev
              'x-org-id': orgId
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
