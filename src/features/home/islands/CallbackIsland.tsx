"use client"

import { useHandleSignInCallback } from '@logto/react';
import { LogtoAuth } from '@/components/LogtoAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function CallbackContent() {
  const router = useRouter();
  const { isLoading, isAuthenticated, error } = useHandleSignInCallback(() => {
    router.push('/');
  });

  useEffect(() => {
    if (error || isAuthenticated) {
      const timer = setTimeout(() => router.push('/'), 1500);
      return () => clearTimeout(timer);
    }
  }, [error, isAuthenticated, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center text-white p-4">
        <div className="text-red-400 mb-2 font-medium">登录遇到了问题喵</div>
        <div className="text-sm opacity-60">正在为你跳转回主页...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center text-white">
      <div className="animate-pulse text-lg font-medium tracking-widest uppercase">
        {isLoading ? '正在验证会话中...' : '跳转中...'}
      </div>
    </div>
  );
}

export function CallbackIsland() {
  return (
    <LogtoAuth>
      <CallbackContent />
    </LogtoAuth>
  );
}
