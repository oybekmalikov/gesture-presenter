import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';

import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SeminarsPage } from './pages/SeminarsPage';
import { SeminarDetailPage } from './pages/SeminarDetailPage';
import { LiveStreamsPage } from './pages/LiveStreamsPage';
import { LiveSeminarPage } from './pages/LiveSeminarPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { DepartmentTeamPage } from './pages/DepartmentTeamPage';
import { UserMgmtPage } from './pages/UserMgmtPage';
import { FileRetentionPage } from './pages/FileRetentionPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { MySeminarsPage } from './pages/MySeminarsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<AppLayout />}>
                  <Route index element={<DashboardPage />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="seminars" element={<SeminarsPage />} />
                  <Route path="seminars/:id" element={<SeminarDetailPage />} />
                  <Route path="live" element={<LiveStreamsPage />} />
                  <Route path="live/:id" element={<LiveSeminarPage />} />
                  <Route path="bookmarks" element={<BookmarksPage />} />
                  <Route path="ai" element={<AiAssistantPage />} />

                  <Route path="team" element={<DepartmentTeamPage />} />
                  <Route path="users" element={<UserMgmtPage />} />
                  <Route path="file-retention" element={<FileRetentionPage />} />
                  <Route path="audit" element={<AuditLogsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="statistics" element={<StatisticsPage />} />
                  <Route path="my-seminars" element={<MySeminarsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  </ThemeProvider>
  );
};

export default App;
