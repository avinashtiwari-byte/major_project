import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

import StudentDashboard from './pages/Student/Dashboard';
import ExamRoom from './pages/Student/ExamRoom';
import ResultDashboard from './pages/Student/ResultDashboard';
import AdminDashboard from './pages/Admin/Dashboard';
import ManageExam from './pages/Admin/ManageExam';
import AdminExamResults from './pages/Admin/ExamResults';
import Layout from './components/Layout';

const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div className="h-screen flex items-center justify-center text-white bg-slate-900">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute roleRequired="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/exam/:id/manage" element={<ProtectedRoute roleRequired="admin"><ManageExam /></ProtectedRoute>} />
          <Route path="/admin/exam/:id/results" element={<ProtectedRoute roleRequired="admin"><AdminExamResults /></ProtectedRoute>} />
          
          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute roleRequired="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/exam/:id" element={<ProtectedRoute roleRequired="student"><ExamRoom /></ProtectedRoute>} />
          <Route path="/student/results" element={<ProtectedRoute roleRequired="student"><ResultDashboard /></ProtectedRoute>} />
          <Route path="/student/results/:id" element={<ProtectedRoute roleRequired="student"><ResultDashboard /></ProtectedRoute>} />
          
          {/* Fallbacks */}
          <Route path="/student/exam/" element={<Navigate to="/student" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
