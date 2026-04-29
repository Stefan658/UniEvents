import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import EventDetailsPage from './pages/EventDetailsPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import SupportPage from './pages/SupportPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MyRegistrationsPage from './pages/MyRegistrationsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />
              <Route path="/support" element={<SupportPage />} />
              
              {/* Participant Routes */}
              <Route 
                path="/my-registrations" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyRegistrationsPage />
                  </ProtectedRoute>
                } 
              />

              {/* Organizer Routes */}
              <Route 
                path="/organizer" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizer/events/new" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <CreateEventPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizer/events/:id/edit" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <EditEventPage />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback */}
              <Route path="*" element={<div className="p-12 text-center text-gray-500 font-medium">Page not found</div>} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-100 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} UniEvents — Ștefan cel Mare University of Suceava
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
