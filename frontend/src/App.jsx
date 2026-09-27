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

const DemoRoute = ({ children }) => {
  // Anyone can view the dashboard now (for demo purposes)
  return <DashboardLayout>{children}</DashboardLayout>;
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
        <Route path="/dashboard" element={<DemoRoute><Dashboard /></DemoRoute>} />
        <Route path="/screenshots" element={<DemoRoute><Screenshots /></DemoRoute>} />
        <Route path="/category" element={<DemoRoute><Category /></DemoRoute>} />
        <Route path="/trash" element={<DemoRoute><Trash /></DemoRoute>} />
        <Route path="/analytics" element={<DemoRoute><Analytics /></DemoRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
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