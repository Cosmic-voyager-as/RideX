import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OOPProvider } from './context/OOPContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { MenuDrawer } from './components/MenuDrawer';
import { OOPInspector } from './components/OOPInspector';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthPage } from './pages/AuthPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { TrackingPage } from './pages/TrackingPage';
import { GoogleOAuthProvider } from '@react-oauth/google';



const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOOPModalOpen, setIsOOPModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    
    <div className="min-h-screen flex flex-col bg-[#F7F8F9] font-sans antialiased text-[#222B45]">
      {isAuthenticated && (
        <>
          <Navbar
            onToggleOOPModal={() => setIsOOPModalOpen(!isOOPModalOpen)}
            isOOPModalOpen={isOOPModalOpen}
            onOpenMenu={() => setIsMenuOpen(true)}
          />
          <MenuDrawer
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
          />
        </>
      )}
      <main className="flex-1 flex flex-col">{children}</main>
      <OOPInspector
        isOpen={isOOPModalOpen}
        onClose={() => setIsOOPModalOpen(false)}
      />
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role === 'CUSTOMER') return <Navigate to="/customer" replace />;
  if (user.role === 'DRIVER') return <Navigate to="/driver" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;

  return <Navigate to="/auth" replace />;
};

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '607418537665-ck2hipt6h4k52ra8g095q5ci3af8leql.apps.googleusercontent.com';

export const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <OOPProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <AppLayout>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/track/:token" element={<TrackingPage />} />

                  {/* Role Protected Routes */}
                  <Route
                    path="/customer"
                    element={
                      <ProtectedRoute allowedRoles={['CUSTOMER']}>
                        <CustomerDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/driver"
                    element={
                      <ProtectedRoute allowedRoles={['DRIVER']}>
                        <DriverDashboard />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Default & Fallback */}
                  <Route path="/" element={<RootRedirect />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            </ErrorBoundary>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </OOPProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
