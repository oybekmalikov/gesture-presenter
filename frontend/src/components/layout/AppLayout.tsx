// src/components/layout/AppLayout.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const contentRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const onScroll = () => setShowScrollTop(content.scrollTop > 380);
    content.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => content.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Yuklanmoqda...</div>
      </div>
    );
  }

  // Strictly redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Topbar />

      <div className="layout">
        <Sidebar />

        <main ref={contentRef} id="app-content" className="content">
          <Outlet />

          <button
            type="button"
            className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
            aria-label="Scroll to top"
            onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4.5 12.5 10 7l5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
