import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Screenshots from "./pages/Screenshots";
import Category from "./pages/Category";
import Trash from "./pages/Trash";
import Analytics from "./pages/Analytics";
import Navbar from "./components/Navbar";
import DashboardLayout from "./components/DashboardLayout";
import AuthModal from "./components/AuthModal";
import { AuthProvider, useAuth } from "./context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

// Global Layout wrapper to conditionally show public Navbar
const AppContent = () => {
  const location = useLocation();
  const isPublicRoute = location.pathname === '/';
  
  return (
    <>
      {isPublicRoute && <Navbar />}
      <AuthModal />
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/screenshots" element={<PrivateRoute><Screenshots /></PrivateRoute>} />
        <Route path="/category" element={<PrivateRoute><Category /></PrivateRoute>} />
        <Route path="/trash" element={<PrivateRoute><Trash /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-white">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}