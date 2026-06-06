import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Shield, Menu, X, Home, Bookmark, ExternalLink, Clock, MapPin, Search, Calendar, ChevronRight } from 'lucide-react';
import Button from './Button';
import { logoutUser } from '../api/auth';
import { getAllEvents } from '../api/events';
import logo from '../assets/unievents-logo-small-no_bg.png';

const Navbar = () => {
  const { user, logout, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  
  // Suggestions state
  const [allEvents, setAllEvents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const searchRef = useRef(null);

  // Sync internal state with URL params
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all events for suggestions (lazy)
  const loadEventsForSuggestions = async () => {
    if (allEvents.length > 0 || isFetching) return;
    setIsFetching(true);
    try {
      const data = await getAllEvents();
      setAllEvents(data || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setIsFetching(false);
    }
  };

  // Filter suggestions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const filtered = allEvents.filter(e => 
      e.title?.toLowerCase().includes(q) ||
      e.category_name?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.organizer_full_name?.toLowerCase().includes(q)
    ).slice(0, 5);
    
    setSuggestions(filtered);
  }, [searchQuery, allEvents]);

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
    setIsOpen(false);
  };

  const handleSuggestionClick = (eventId) => {
    navigate(`/events/${eventId}`);
    setShowSuggestions(false);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

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
    { name: 'Uni Nearby', path: '/nearby', icon: MapPin },
    ...(isAuthenticated && role === 'student' ? [{ name: 'My Registrations', path: '/my-registrations', icon: Bookmark }] : []),
    ...(isAuthenticated && role === 'organizer' ? [{ name: 'Dashboard', path: '/organizer', icon: LayoutDashboard }] : []),
    ...(isAuthenticated && role === 'admin' ? [{ name: 'Admin Panel', path: '/admin', icon: Shield }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-[72px] py-2">
          <div className="flex items-center flex-grow">
            <Link to="/" className="flex items-center space-x-4 group flex-shrink-0">
              <div className="relative h-12 w-12 flex items-center justify-center">
                <img 
                  src={logo} 
                  alt="UniEvents Logo" 
                  className="h-[64px] w-auto max-w-none transform translate-y-1 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-primary-600 to-primary-900 ml-7 hidden lg:block">
                UniEvents
              </span>
            </Link>
            
            <div className="hidden sm:ml-8 sm:flex sm:items-center sm:space-x-1 flex-grow">
              <div className="flex items-center space-x-1 mr-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path}
                    to={link.path} 
                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 ${
                      isActive(link.path) 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <link.icon className={`h-4 w-4 ${isActive(link.path) ? 'text-primary-600' : 'text-gray-400'}`} />
                    <span className="hidden xl:inline">{link.name}</span>
                  </Link>
                ))}
                
                <a 
                  href="https://orar.usv.ro/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="hidden xl:inline">USV Schedule</span>
                  <ExternalLink className="h-3 w-3 text-gray-300" />
                </a>
              </div>

              {/* Desktop Search Bar */}
              <div className="max-w-[240px] flex-grow relative group hidden md:block" ref={searchRef}>
                <form onSubmit={handleSearch}>
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      setShowSuggestions(true);
                      loadEventsForSuggestions();
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search events..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  />
                </form>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full mt-2 w-[320px] left-0 md:left-auto md:right-0 bg-white border border-gray-100 rounded-2xl shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Suggestions</span>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto">
                      {suggestions.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleSuggestionClick(event.id)}
                          className="w-full text-left p-3 hover:bg-primary-50 transition-colors flex items-start gap-3 group border-b border-gray-50 last:border-0"
                        >
                          <div className="mt-1 bg-white p-2 rounded-lg border border-gray-100 group-hover:border-primary-200 transition-colors">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-primary-700 transition-colors">{event.title}</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-primary-600 uppercase tracking-tight">{event.category_name}</span>
                              <span className="text-[10px] text-gray-400">•</span>
                              <span className="text-[10px] font-medium text-gray-500 truncate">{event.location}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 self-center group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                    <div className="p-3 bg-primary-600 text-white text-center">
                      <button 
                        onClick={handleSearch}
                        className="text-[11px] font-black uppercase tracking-widest hover:underline"
                      >
                        See all results for "{searchQuery}"
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-semibold text-gray-900 leading-none mb-1">{user.name || user.email.split('@')[0]}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-md leading-none">
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
        <div className="sm:hidden bg-white border-b border-gray-100 p-4 space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={loadEventsForSuggestions}
              placeholder="Search events..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
            />
          </form>

          {/* Mobile Suggestions (Simplified) */}
          {suggestions.length > 0 && (
            <div className="space-y-1 py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4 mb-2">Top Matches</p>
              {suggestions.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleSuggestionClick(event.id)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{event.title}</p>
                    <p className="text-[10px] text-gray-500">{event.category_name} • {event.location}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
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
        </div>
      )}
    </nav>
  );
};

export default Navbar;
