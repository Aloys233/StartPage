"use client";

import { LogtoProvider, useLogto } from '@logto/react';
import React, { useEffect } from 'react';
import { clearSession, request, setAccessToken, setSessionUser } from '@/api/client';
import type { UserProfile } from '@/features/home/types';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.PUBLIC_API_BASE_URL ||
  'https://start-api.aloys233.top';

const logtoEndpoint =
  process.env.NEXT_PUBLIC_LOGTO_ENDPOINT ||
  process.env.PUBLIC_LOGTO_ENDPOINT ||
  'https://auth.aloys233.top/';

const logtoAppId =
  process.env.NEXT_PUBLIC_LOGTO_APP_ID ||
  process.env.PUBLIC_LOGTO_APP_ID ||
  '1qeu84y9ylavx1i7k6bgt';

const config = {
  endpoint: logtoEndpoint,
  appId: logtoAppId,
  resources: [apiBaseUrl],
  scopes: ['email', 'profile', 'offline_access'],
};

const TokenSync = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, getAccessToken } = useLogto();

  useEffect(() => {
    const sync = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessToken(config.resources?.[0]);
          if (!token) {
            console.warn('No access token for resource', config.resources?.[0]);
            return;
          }
          setAccessToken(token);

          const profile = await request<UserProfile>('/api/me', { auth: true });
          setSessionUser(profile);
        } catch (e) {
          console.error('Failed to sync Logto token', e);
        }
      } else {
        clearSession();
      }
    };

    sync();
  }, [isAuthenticated, getAccessToken]);

  return <>{children}</>;
};

export const LogtoAuth = ({ children }: { children: React.ReactNode }) => {
  return (
    <LogtoProvider config={config}>
      <TokenSync>{children}</TokenSync>
    </LogtoProvider>
  );
};
