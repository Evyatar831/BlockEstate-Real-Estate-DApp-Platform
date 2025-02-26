import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import MenuPage from './components/MenuPage';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import ForgotPassword from './components/ForgotPassword';
import AboutPage from './components/AboutPage';
import SellPropertyPage from './components/SellPropertyPage';
import PropertyListingsPage from './components/PropertyListingsPage';
import PurchasedProperties from './components/PurchasedProperties';
import MyListedProperties from './components/MyListedProperties';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('access');
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navbar />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
            <Route path="/sell-property" element={<ProtectedRoute><SellPropertyPage /></ProtectedRoute>} />
           <Route path="/buy-property" element={<ProtectedRoute><PropertyListingsPage /></ProtectedRoute>} />
            <Route path="/my-listed-properties" element={<ProtectedRoute><MyListedProperties /></ProtectedRoute>} />
            <Route path="/purchased-properties" element={<ProtectedRoute><PurchasedProperties /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/about" element={<AboutPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;