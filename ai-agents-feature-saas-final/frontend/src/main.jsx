import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import './globals.css';
import AIAgentsPage from './pages/AIAgentsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';

function Layout({ children }) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard/ai-agents" replace />} />
          <Route path="/dashboard/ai-agents" element={<AIAgentsPage />} />
          <Route path="/dashboard/ai-agents/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/dashboard/ai-agents" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  </StrictMode>
);
