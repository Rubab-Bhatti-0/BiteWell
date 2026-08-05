"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/ai-agents');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#94a3b8',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      gap: '12px'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        border: '2px solid #00A3E1',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      Redirecting to AI Agents Dashboard...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
