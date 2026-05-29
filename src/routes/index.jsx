import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/Login';
import RoleSelection from '../pages/RoleSelection';
import Signup from '../pages/Signup';
import Loader from '../components/Loader';
import { useAppContext } from '../context/AppContext';

const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Customers = React.lazy(() => import('../pages/Customers'));
const Attendance = React.lazy(() => import('../pages/Attendance'));
const Memberships = React.lazy(() => import('../pages/Memberships'));
const Notifications = React.lazy(() => import('../pages/Notifications'));
const Analytics = React.lazy(() => import('../pages/Analytics'));
const Settings = React.lazy(() => import('../pages/Settings'));
const Profile = React.lazy(() => import('../pages/Profile'));
const AccessDenied = React.lazy(() => import('../pages/AccessDenied'));

/**
 * AuthGate — blocks ALL rendering until auth check is complete.
 * While authLoading is true, shows a fullscreen spinner.
 * This prevents any dashboard flash or route flicker.
 */
const AuthGate = ({ children }) => {
  const { authLoading } = useAppContext();

  if (authLoading) {
    return <Loader />;
  }

  return children;
};

// ProtectedRoute ensures the user is authenticated before accessing protected routes
const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useAppContext();
  if (authLoading) {
    return <Loader />;
  }
  if (!user) {
    return <Navigate to="/role-selection" replace />;
  }
  return children;
};

// AdminRoute ensures only admin users can access admin pages
const AdminRoute = ({ children }) => {
  const { user } = useAppContext();
  if (!user) {
    // Not logged in, go to role selection
    return <Navigate to="/role-selection" replace />;
  }
  if (user.role !== 'admin') {
    // Authenticated but not admin, show access denied
    return <Navigate to="/access-denied" replace />;
  }
  return children;
};

/**
 * PublicOnlyRoute — only accessible when NOT logged in.
 * If logged in, redirect to dashboard.
 */
const PublicOnlyRoute = ({ children }) => {
  const { user } = useAppContext();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function RootRedirect() {
  const { user } = useAppContext();
  return <Navigate to={user ? '/dashboard' : '/role-selection'} replace />;
}

export default function AppRoutes() {
  return (
    <AuthGate>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/role-selection"
            element={
              <PublicOnlyRoute>
                <RoleSelection />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />

          {/* PROTECTED ROUTES — require authentication */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="clients"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendance"
              element={
                <AdminRoute>
                  <Attendance />
                </AdminRoute>
              }
            />
            <Route
              path="memberships"
              element={
                <AdminRoute>
                  <Memberships />
                </AdminRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <AdminRoute>
                  <Notifications />
                </AdminRoute>
              }
            />
            <Route
              path="analytics"
              element={
                <AdminRoute>
                  <Analytics />
                </AdminRoute>
              }
            />
            <Route
              path="settings"
              element={
                <AdminRoute>
                  <Settings />
                </AdminRoute>
              }
            />
            <Route
              path="profile"
              element={
                <AdminRoute>
                  <Profile />
                </AdminRoute>
              }
            />
          </Route>

          <Route
            path="/access-denied"
            element={<AccessDenied />}
          />

          {/* Catch-all: redirect */}
          <Route
            path="*"
            element={<CatchAllRedirect />}
          />
        </Routes>
      </Suspense>
    </AuthGate>
  );
}

function CatchAllRedirect() {
  const { user } = useAppContext();
  return <Navigate to={user ? '/dashboard' : '/role-selection'} replace />;
}
