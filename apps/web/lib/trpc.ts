import { createTRPCReact } from '@trpc/react-query';

// Using any for skeleton simplicity to avoid build-time strict dependency issues on the API package
export const trpc = createTRPCReact<any>(); 
