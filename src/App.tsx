import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useAtom } from 'jotai';
import { isAuthenticatedAtom, logout } from './store/auth';

// Layout
import AppLayout from './layouts/AppLayout';

// Pages
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import CollectionPage from './pages/CollectionPage';
import RatingsPage from './pages/RatingsPage';
import StatsPage from './pages/StatsPage';
import ExportPage from './pages/ExportPage';
import SettingsPage from './pages/SettingsPage';

// Auth
import { OAuthRedirectAuth } from './components/Auth/OAuthRedirectAuth';

// Auth page component
const AuthPage = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px'
  }}>
    <OAuthRedirectAuth />
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Theme
const theme = createTheme({
  primaryColor: 'red',
  defaultRadius: 'md',
  // Additional theme settings
  components: {
    Button: {
      defaultProps: {
        color: 'red',
      },
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom);

  // Check authentication status on app load
  useEffect(() => {
    // Authentication is already checked in the store initialization
  }, []);

  const handleLogout = () => {
    logout(setIsAuthenticated, () => {}, () => {});
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={
            isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
          } />
          <Route
            path="*"
            element={
              <AppLayout onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/history" element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/collection" element={
                    <ProtectedRoute>
                      <CollectionPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/ratings" element={
                    <ProtectedRoute>
                      <RatingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/stats" element={
                    <ProtectedRoute>
                      <StatsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/export" element={
                    <ProtectedRoute>
                      <ExportPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
