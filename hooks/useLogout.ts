'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function useLogout() {
  const { signOut } = useClerk();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.push('/');
  }

  return handleLogout;
}