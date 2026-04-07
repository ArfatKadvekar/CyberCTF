import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from './context/SessionContext';

// Layouts
import PlayerLayout from './layouts/PlayerLayout';
import AdminLayout from './layouts/AdminLayout';

// Public pages
import JoinPage from './pages/JoinPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Player pages
import HomePage from './pages/player/HomePage';
import ChallengesPage from './pages/player/ChallengesPage';
import ChallengePage from './pages/player/ChallengePage';
import LeaderboardPage from './pages/player/LeaderboardPage';
import ProfilePage from './pages/player/ProfilePage';

import CreateChallengePage from './pages/admin/CreateChallengePage';

// Admin pages
import DashboardPage from './pages/admin/DashboardPage';
import AdminChallengesPage from './pages/admin/ChallengesPage';
import AdminCategoriesPage from './pages/admin/CategoriesPage';
import UsersPage from './pages/admin/UsersPage';
import StreamerModePage from './pages/admin/StreamerModePage';

// Loading spinner
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-mono">Loading...</p>
      </div>
    </div>
  );
}

// Protected route wrapper for players
function PlayerRoute({ children }) {
  const { user, loading, isPlayer } = useSession();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (!isPlayer) return <Navigate to="/admin" replace />;
  
  return children;
}

// Protected route wrapper for admins
function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useSession();
  
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  
  return children;
}

// Public route - redirect if logged in
function PublicRoute({ children }) {
  const { user, loading, isAdmin, isPlayer } = useSession();
  
  if (loading) return <LoadingScreen />;
  if (isPlayer) return <Navigate to="/home" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <JoinPage />
          </PublicRoute>
        }
      />
      <Route
        path="/admin/login"
        element={
          <PublicRoute>
            <AdminLoginPage />
          </PublicRoute>
        }
      />

      {/* Player routes */}
      <Route
        path="/home"
        element={
          <PlayerRoute>
            <PlayerLayout>
              <HomePage />
            </PlayerLayout>
          </PlayerRoute>
        }
      />
      <Route
        path="/challenges"
        element={
          <PlayerRoute>
            <PlayerLayout>
              <ChallengesPage />
            </PlayerLayout>
          </PlayerRoute>
        }
      />
      <Route
        path="/challenges/:id"
        element={
          <PlayerRoute>
            <PlayerLayout>
              <ChallengePage />
            </PlayerLayout>
          </PlayerRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <PlayerRoute>
            <PlayerLayout>
              <LeaderboardPage />
            </PlayerLayout>
          </PlayerRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PlayerRoute>
            <PlayerLayout>
              <ProfilePage />
            </PlayerLayout>
          </PlayerRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/challenges"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminChallengesPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminRoute>
            <AdminLayout>
              <AdminCategoriesPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/challenges/new"
        element={
          <AdminRoute>
            <AdminLayout>
              <CreateChallengePage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <AdminLayout>
              <UsersPage />
            </AdminLayout>
          </AdminRoute>
        }
      />
      <Route
        path="/admin/stream"
        element={
          <AdminRoute>
            <StreamerModePage />
          </AdminRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
