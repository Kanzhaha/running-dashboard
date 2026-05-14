import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginPage } from './components/auth/LoginPage';
import { UserSetup } from './components/auth/UserSetup';
import { Dashboard } from './components/layout/Dashboard';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ProfilePage } from './pages/ProfilePage';
import { ActivitySummaryPage } from './pages/ActivitySummaryPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <UserSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activity-summary"
          element={
            <ProtectedRoute>
              <ActivitySummaryPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;