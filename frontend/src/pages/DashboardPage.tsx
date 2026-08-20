// src/pages/DashboardPage.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserDashboard } from '../components/dashboard/UserDashboard';
import { HeadDepartmentDashboard } from '../components/dashboard/HeadDepartmentDashboard';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { SuperadminDashboard } from '../components/dashboard/SuperadminDashboard';

export const DashboardPage: React.FC = () => {
  const {
    isAuthenticated,
    isSuperadmin,
    isAdmin,
    isHeadDepartment,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="page active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Boshqaruv paneli yuklanmoqda...
        </div>
      </div>
    );
  }

  // If not authenticated, directly redirect to Login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 1. SUPERADMIN Dashboard
  if (isSuperadmin) {
    return <SuperadminDashboard />;
  }

  // 2. ADMIN Dashboard
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // 3. HEAD_DEPARTMENT Dashboard
  if (isHeadDepartment) {
    return <HeadDepartmentDashboard />;
  }

  // 4. Regular USER Dashboard (Default)
  return <UserDashboard />;
};

export default DashboardPage;
