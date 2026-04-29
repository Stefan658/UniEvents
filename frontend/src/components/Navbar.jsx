import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Calendar, LayoutDashboard, Shield, Menu, X, Home, Bookmark, ExternalLink, BookOpen } from 'lucide-react';
import Button from './Button';
import { logoutUser } from '../api/auth';

const Navbar = () => {
  const { user, logout, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      logout();
      navigate('/login');
    }
  };

  const navLinks = [
    { name: 'Browse Events', path: '/', icon: Home },
    ...(isAuthenticated && role === 'student' ? [{ name: 'My Registrations', path: '/my-registrations', icon: Bookmark }] : []),
    ...(isAuthenticated && role === 'organizer' ? [{ name: 'Dashboard', path: '/organizer', icon: LayoutDashboard }] : []),
    ...(isAuthenticated && role === 'admin' ? [{ name: 'Admin Panel', path: '/admin', icon: Shield }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 py-3">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="bg-primary-600 p-2 rounded-xl group-hover:rotate-6 transition-transform duration-300 shadow-primary-200 shadow-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary-600 to-primary-900">
                UniEvents
              </span>
            </Link>
            
            <div className="hidden sm:ml-10 sm:flex sm:space-x-1">
              {navLinks.map((link) => (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center space-x-2 ${
                    isActive(link.path) 
                      ? 'bg-primary-50 text-primary-700' 
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <link.icon className={`h-4 w-4 ${isActive(link.path) ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span>{link.name}</span>
                </Link>
              ))}
              
              <a 
                href="https://orar.usv.ro/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center space-x-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              >
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span>Orar USV</span>
                <ExternalLink className="h-3 w-3 text-gray-300" />
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-bold text-gray-900 leading-none mb-1">{user.name || user.email.split('@')[0]}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-md leading-none">
                    {role === 'student' ? 'Participant' : role}
                  </span>
                </div>
                <Button variant="secondary" onClick={handleLogout} className="!p-2.5 !rounded-xl border-gray-100 hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-all">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Link to="/login">
                <Button className="shadow-primary-100 shadow-lg hover:shadow-primary-200">Sign In</Button>
              </Link>
            )}
            
            <button className="sm:hidden p-2 text-gray-500" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden bg-white border-b border-gray-100 p-4 space-y-2">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`block px-4 py-3 rounded-xl text-base font-bold ${
                isActive(link.path) ? 'bg-primary-50 text-primary-700' : 'text-gray-600'
              }`}
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <a 
            href="https://orar.usv.ro/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block px-4 py-3 rounded-xl text-base font-bold text-gray-600"
            onClick={() => setIsOpen(false)}
          >
            Orar USV
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
