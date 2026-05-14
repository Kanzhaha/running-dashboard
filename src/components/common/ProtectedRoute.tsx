import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};