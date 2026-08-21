import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserDashboard } from '../components/dashboard/UserDashboard';
import { HeadDepartmentDashboard } from '../components/dashboard/HeadDepartmentDashboard';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { SuperadminDashboard } from '../components/dashboard/SuperadminDashboard';
import { Loader } from 'lucide-react';

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
          <Loader /> Boshqaruv paneli yuklanmoqda...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isSuperadmin) {
    return <SuperadminDashboard />;
  }

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (isHeadDepartment) {
    return <HeadDepartmentDashboard />;
  }

  return <UserDashboard />;
};

export default DashboardPage;
