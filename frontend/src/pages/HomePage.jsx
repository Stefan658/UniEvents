import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { getAllEvents, getPopularEvents, getRecommendedEvents } from '../api/events';
import { getMyRegistrations } from '../api/registrations';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeEvent } from '../utils/localizeEvent';
import { Sparkles, Calendar, TrendingUp, LayoutGrid, List, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import heroBg from '../assets/backg-based-from-logo.png';
import globalBg from '../assets/backg.png';

const INITIAL_VISIBLE_COUNT = 10;
const VISIBLE_INCREMENT = 10;

const HomePage = () => {
  const { user, isAuthenticated, role } = useAuth();
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [viewMode, setViewMode] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    organizer: '',
    location: '',
    participationType: '',
    dateRange: '',
    entryType: '',
    requiresRegistration: ''
  });
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [popularEvents, setPopularEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  
  // Pagination / Visible counts
  const [upcomingVisible, setUpcomingVisible] = useState(INITIAL_VISIBLE_COUNT);
  const [recommendedVisible, setRecommendedVisible] = useState(INITIAL_VISIBLE_COUNT);
  const [popularVisible, setPopularVisible] = useState(INITIAL_VISIBLE_COUNT);
  const [pastVisible, setPastVisible] = useState(INITIAL_VISIBLE_COUNT);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Derived filter options
  const categories = useMemo(() => [...new Set(upcomingEvents.map(e => e.category_name))].filter(Boolean).sort(), [upcomingEvents]);
  const organizers = useMemo(() => [...new Set(upcomingEvents.map(e => e.organizer_full_name || e.organizer_email))].filter(Boolean).sort(), [upcomingEvents]);
  const locations = useMemo(() => [...new Set(upcomingEvents.map(e => e.location))].filter(Boolean).sort(), [upcomingEvents]);
  const hasActiveFilters = useMemo(() => Object.values(filters).some(val => val !== '' && val !== 'all'), [filters]);
  const activeFiltersCount = useMemo(() => Object.values(filters).filter(val => val !== '' && val !== 'all').length, [filters]);

  // Reset visible counts when search or filters change
  useEffect(() => {
    setUpcomingVisible(INITIAL_VISIBLE_COUNT);
    setRecommendedVisible(INITIAL_VISIBLE_COUNT);
    setPopularVisible(INITIAL_VISIBLE_COUNT);
    setPastVisible(INITIAL_VISIBLE_COUNT);
  }, [searchQuery, filters]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchPromises = [
          getAllEvents(),
          getPopularEvents().catch(err => {
            console.error('Failed to fetch popular events:', err);
            return [];
          })
        ];

        // Only fetch recommendations for participants
        if (isAuthenticated && role === 'student') {
          fetchPromises.push(
            getRecommendedEvents().catch(err => {
              console.error('Failed to fetch recommended events:', err);
              return [];
            })
          );
        }

        const results = await Promise.all(fetchPromises);
        const allEventsData = results[0];
        const popularEventsData = results[1];
        const recommendedEventsData = (isAuthenticated && role === 'student') ? results[2] : [];

        const now = new Date();
        
        setPopularEvents(popularEventsData);
        setRecommendedEvents(recommendedEventsData);

        const upcoming = allEventsData.filter(event => 
          new Date(event.start_at) >= now && 
          (event.status === 'published' || event.status === 'active')
        ).sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
        
        setUpcomingEvents(upcoming);

        // Personalize Past Events
        if (isAuthenticated && role === 'student') {
          try {
            const myRegs = await getMyRegistrations();
            const pastRegs = myRegs
              .filter(reg => new Date(reg.event_start_at) < now)
              .map(reg => ({
                id: reg.event_id,
                title: reg.event_title,
                start_at: reg.event_start_at,
                location: reg.event_location,
                participation_type: reg.event_participation_type,
              }));
            
            const myPastEventIds = new Set(pastRegs.map(r => r.id));
            const personalizedPast = allEventsData.filter(event => myPastEventIds.has(event.id))
              .sort((a, b) => new Date(b.start_at) - new Date(a.start_at));
              
            setPastEvents(personalizedPast);
          } catch (regErr) {
            console.error('Failed to fetch personalized past events:', regErr);
            setPastEvents([]);
          }
        } else {
          setPastEvents([]);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isAuthenticated, role]);

  const filterEvents = (eventsList) => {
    let filtered = eventsList;

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.category_name?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.organizer_full_name?.toLowerCase().includes(q) ||
        e.organizer_email?.toLowerCase().includes(q) ||
        e.participation_type?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(e => e.category_name === filters.category);
    }

    // Organizer filter
    if (filters.organizer && filters.organizer !== 'all') {
      filtered = filtered.filter(e => e.organizer_full_name === filters.organizer || e.organizer_email === filters.organizer);
    }

    // Location filter
    if (filters.location && filters.location !== 'all') {
      filtered = filtered.filter(e => e.location === filters.location);
    }

    // Participation type filter
    if (filters.participationType && filters.participationType !== 'all') {
      filtered = filtered.filter(e => e.participation_type === filters.participationType);
    }

    // Entry type filter
    if (filters.entryType === 'free') {
      filtered = filtered.filter(e => e.is_free_entry);
    } else if (filters.entryType === 'paid') {
      filtered = filtered.filter(e => !e.is_free_entry);
    }

    // Requires registration filter
    if (filters.requiresRegistration === 'yes') {
      filtered = filtered.filter(e => e.requires_registration);
    } else if (filters.requiresRegistration === 'no') {
      filtered = filtered.filter(e => !e.requires_registration);
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.start_at);
        if (filters.dateRange === 'today') {
          return eventDate.toDateString() === now.toDateString();
        }
        if (filters.dateRange === 'this_week') {
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          return eventDate >= today && eventDate < nextWeek;
        }
        if (filters.dateRange === 'this_month') {
          return eventDate.getMonth() === now.getMonth() && 
                 eventDate.getFullYear() === now.getFullYear() &&
                 eventDate >= today;
        }
        return true;
      });
    }

    return filtered;
  };

  const filteredUpcoming = useMemo(() => filterEvents(upcomingEvents), [upcomingEvents, searchQuery, filters]);
  const filteredPopular = useMemo(() => filterEvents(popularEvents), [popularEvents, searchQuery, filters]);
  const filteredPast = useMemo(() => filterEvents(pastEvents), [pastEvents, searchQuery, filters]);
  const filteredRecommended = useMemo(() => filterEvents(recommendedEvents), [recommendedEvents, searchQuery, filters]);

  return (
    <div className="relative">
      <div className="relative z-10">
        <PageContainer>
          <div className="relative mb-24 pt-20 pb-28 overflow-hidden rounded-[4rem] bg-white border border-gray-100/50 shadow-soft">
            {/* Hero Background Layer */}
            <div 
              className="absolute inset-0 z-0 opacity-90 brightness-[0.95] contrast-[1.2] saturate-[1.6]"
              style={{ 
                backgroundImage: `url(${heroBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            ></div>
            
            {/* BRAND COLOR ACCENT & CENTER FOCUS OVERLAYS */}
            <div 
              className="absolute inset-0 z-10 pointer-events-none" 
              style={{ 
                background: `
                  radial-gradient(circle at center, rgba(255,255,255,0.25), transparent 60%),
                  linear-gradient(to bottom, rgba(59,130,246,0.08), transparent, rgba(139,92,246,0.08))
                `
              }}
            ></div>
            
            {/* BOTTOM FADE for page integration */}
            <div className="absolute inset-x-0 bottom-0 h-48 z-10 bg-gradient-to-t from-white via-white/20 to-transparent pointer-events-none"></div>
            
            <div 
              className="relative z-20 text-center px-8 py-14 max-w-5xl mx-auto rounded-[3rem] shadow-2xl shadow-primary-900/5"
              style={{
                background: 'rgba(255,255,255,0.35)',
                backdropFilter: 'blur(2px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-400/10 to-transparent -z-20 blur-3xl rounded-full"></div>
              
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-md text-primary-700 text-xs font-bold uppercase tracking-wider mb-10 border border-white/60 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                {t('home.heroSubtitle')}
              </div>

              <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl md:text-7xl tracking-tighter leading-[0.95] mb-8">
                {t('home.heroTitle1')} <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-500">{t('home.heroTitle2')}</span>
              </h1>

              <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-normal leading-relaxed">
                {t('home.heroDesc')}
              </p>
            </div>
          </div>

          {!loading && !error && (
            <div className="flex flex-col items-center mb-12 gap-6">
              {searchQuery && (
                <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="inline-flex items-center px-6 py-3 rounded-[2rem] bg-primary-50 border border-primary-100 shadow-sm">
                    <Search className="w-4 h-4 text-primary-600 mr-3" />
                    <span className="text-gray-600 font-medium">
                      {t('home.searchResults')} <span className="text-primary-700 font-bold">"{searchQuery}"</span>
                    </span>
                    <div className="w-px h-4 bg-primary-200 mx-4"></div>
                    <Link 
                      to="/" 
                      className="text-primary-600 hover:text-primary-800 font-bold text-sm flex items-center group"
                    >
                      {t('home.clear')}
                      <X className="w-4 h-4 ml-1.5 group-hover:rotate-90 transition-transform" />
                    </Link>
                  </div>
                  {(filteredUpcoming.length === 0 && filteredPast.length === 0 && filteredPopular.length === 0) && (
                    <p className="mt-8 text-gray-400 font-medium italic">{t('home.noMatchesAll')}</p>
                  )}
                </div>
              )}

              {/* Filter Section */}
              <div className="w-full max-w-6xl bg-white/60 backdrop-blur-md p-4 md:p-6 rounded-[2.5rem] border border-white/40 shadow-xl shadow-primary-900/5 transition-all duration-300">
                <div 
                  className="flex flex-wrap items-center justify-between gap-4 px-2 cursor-pointer group"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-xl text-primary-600 group-hover:scale-110 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {t('home.filterBy')}
                        {activeFiltersCount > 0 && (
                          <span className="flex items-center justify-center bg-primary-600 text-white text-[10px] font-black w-5 h-5 rounded-full shadow-sm animate-in zoom-in duration-300">
                            {activeFiltersCount}
                          </span>
                        )}
                      </h3>
                      {!filtersOpen && hasActiveFilters && (
                        <p className="text-xs text-gray-500 font-medium mt-0.5 animate-in fade-in slide-in-from-left-2">
                          {t('home.filtersActive')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 ml-auto">
                    {hasActiveFilters && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters({
                            category: '',
                            organizer: '',
                            location: '',
                            participationType: '',
                            dateRange: '',
                            entryType: '',
                            requiresRegistration: ''
                          });
                        }}
                        className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-primary-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        {t('home.clearFilters')}
                      </button>
                    )}

                    <div className={`p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-all ${filtersOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {filtersOpen && (
                  <div className="mt-8 pt-8 border-t border-gray-100/50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Category Filter */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t('home.category')}</label>
                        <select
                          value={filters.category}
                          onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer outline-none appearance-none hover:border-primary-200 shadow-sm"
                        >
                          <option value="">{t('home.allCategories')}</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{t(`cat.${cat}`, cat)}</option>
                          ))}
                        </select>
                      </div>

                      {/* Organizer Filter */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t('home.organizer')}</label>
                        <select
                          value={filters.organizer}
                          onChange={(e) => setFilters(prev => ({ ...prev, organizer: e.target.value }))}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer outline-none appearance-none hover:border-primary-200 shadow-sm"
                        >
                          <option value="">{t('home.allOrganizers')}</option>
                          {organizers.map(org => (
                            <option key={org} value={org}>{org}</option>
                          ))}
                        </select>
                      </div>

                      {/* Location Filter */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t('home.location')}</label>
                        <select
                          value={filters.location}
                          onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer outline-none appearance-none hover:border-primary-200 shadow-sm"
                        >
                          <option value="">{t('home.allLocations')}</option>
                          {locations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>

                      {/* Participation Type */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t('home.type')}</label>
                        <select
                          value={filters.participationType}
                          onChange={(e) => setFilters(prev => ({ ...prev, participationType: e.target.value }))}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer outline-none appearance-none hover:border-primary-200 shadow-sm"
                        >
                          <option value="">{t('home.allTypes')}</option>
                          <option value="on-site">{t('home.onsite')}</option>
                          <option value="online">{t('home.online')}</option>
                          <option value="hybrid">{t('home.hybrid')}</option>
                        </select>
                      </div>

                      {/* Date Filter */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t('home.date')}</label>
                        <select
                          value={filters.dateRange}
                          onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer outline-none appearance-none hover:border-primary-200 shadow-sm"
                        >
                          <option value="">{t('home.allTime')}</option>
                          <option value="today">{t('home.today')}</option>
                          <option value="this_week">{t('home.thisWeek')}</option>
                          <option value="this_month">{t('home.thisMonth')}</option>
                        </select>
                      </div>

                      {/* Entry Type */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t('home.entry')}</label>
                        <select
                          value={filters.entryType}
                          onChange={(e) => setFilters(prev => ({ ...prev, entryType: e.target.value }))}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer outline-none appearance-none hover:border-primary-200 shadow-sm"
                        >
                          <option value="">{t('home.all')}</option>
                          <option value="free">{t('home.freeEntry')}</option>
                          <option value="paid">{t('home.paidTicket')}</option>
                        </select>
                      </div>

                      {/* Registration Filter */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t('home.registration')}</label>
                        <select
                          value={filters.requiresRegistration}
                          onChange={(e) => setFilters(prev => ({ ...prev, requiresRegistration: e.target.value }))}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all cursor-pointer outline-none appearance-none hover:border-primary-200 shadow-sm"
                        >
                          <option value="">{t('home.all')}</option>
                          <option value="yes">{t('home.regRequired')}</option>
                          <option value="no">{t('home.noRegNeeded')}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Filter Chips - Always visible if filters active */}
                {hasActiveFilters && (
                  <div className={`mt-4 flex flex-wrap gap-2 ${filtersOpen ? 'pt-6 border-t border-gray-100' : ''} animate-in fade-in slide-in-from-bottom-2`}>
                    {Object.entries(filters).map(([key, value]) => {
                      if (!value || value === 'all') return null;
                      let label = value;
                      if (key === 'entryType') label = value === 'free' ? t('home.freeEntry') : t('home.paidTicket');
                      if (key === 'requiresRegistration') label = value === 'yes' ? t('home.regRequired') : t('home.noRegNeeded');
                      if (key === 'dateRange') {
                        if (value === 'today') label = t('home.today');
                        else if (value === 'this_week') label = t('home.thisWeek');
                        else if (value === 'this_month') label = t('home.thisMonth');
                        else label = value.replace('_', ' ');
                      }
                      if (key === 'category') label = t(`cat.${value}`, value);
                      if (key === 'participationType') {
                        if (value === 'on-site') label = t('home.onsite');
                        else if (value === 'online') label = t('home.online');
                        else if (value === 'hybrid') label = t('home.hybrid');
                      }
                      
                      let displayKey = t(`home.${key}`, key);
                      if (key === 'dateRange') displayKey = t('home.date');
                      if (key === 'participationType') displayKey = t('home.type');
                      
                      return (
                        <span key={key} className="inline-flex items-center px-3 py-1.5 rounded-xl bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-wider border border-primary-100/50 shadow-sm hover:bg-primary-100 transition-colors">
                          <span className="opacity-40 mr-1.5">{displayKey}:</span>
                          {label}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilters(prev => ({ ...prev, [key]: '' }));
                            }}
                            className="ml-2 hover:text-primary-900 transition-colors p-0.5 rounded-full hover:bg-primary-200/50"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-100 shadow-soft flex gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <Loader size="lg" />
              <p className="mt-4 text-gray-500 font-normal animate-pulse">Loading amazing events...</p>
            </div>
          ) : error ? (
            <div className="max-w-2xl mx-auto">
              <ErrorMessage message={error} />
            </div>
          ) : (
            <>
              <div className="mb-20">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t('home.upcomingTitle')}</h2>
                  <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
                  <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-xl border border-primary-100">
                    {filteredUpcoming.length} {(searchQuery || hasActiveFilters) ? t('home.matches') : t('home.upcoming')}
                  </span>
                </div>

                {filteredUpcoming.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 shadow-sm">
                    <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      {searchQuery ? <Search className="w-8 h-8 text-gray-300" /> : <Calendar className="w-8 h-8 text-gray-300" />}
                    </div>
                    <p className="text-gray-400 font-bold text-lg">
                      {(searchQuery || hasActiveFilters) ? t('home.noUpcomingFiltered') : t('home.noUpcoming')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-6'}>
                      {filteredUpcoming.slice(0, upcomingVisible).map((event) => (
                        <EventCard key={event.id} event={localizeEvent(event, language)} variant={viewMode === 'list' ? 'row' : 'card'} />
                      ))}
                    </div>
                    
                    {filteredUpcoming.length > upcomingVisible && (
                      <div className="mt-12 flex justify-center">
                        <button
                          onClick={() => setUpcomingVisible(prev => prev + VISIBLE_INCREMENT)}
                          className="px-8 py-3 bg-white border border-gray-200 text-primary-600 font-bold rounded-2xl shadow-soft hover:shadow-md hover:border-primary-100 hover:bg-primary-50 transition-all active:scale-95 text-sm"
                        >
                          {t('home.seeMore')} ({filteredUpcoming.length - upcomingVisible})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {filteredRecommended.length > 0 && !searchQuery && !hasActiveFilters && (
                <div className="mb-20">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
                      <Sparkles className="w-8 h-8 mr-3 text-primary-600" />
                      {t('home.recommendedTitle')}
                    </h2>
                    <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
                  </div>

                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-6'}>
                    {filteredRecommended.slice(0, recommendedVisible).map((event) => (
                      <EventCard key={`rec-${event.id}`} event={localizeEvent(event, language)} variant={viewMode === 'list' ? 'row' : 'card'} />
                    ))}
                  </div>

                  {filteredRecommended.length > recommendedVisible && (
                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={() => setRecommendedVisible(prev => prev + VISIBLE_INCREMENT)}
                        className="px-8 py-3 bg-white border border-gray-200 text-primary-600 font-bold rounded-2xl shadow-soft hover:shadow-md hover:border-primary-100 hover:bg-primary-50 transition-all active:scale-95 text-sm"
                      >
                        {t('home.seeMore')} ({filteredRecommended.length - recommendedVisible})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {filteredPopular.length > 0 && (
                <div className="mb-20">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
                      <TrendingUp className="w-8 h-8 mr-3 text-primary-600" />
                      {t('home.popularTitle')}
                    </h2>
                    <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
                  </div>

                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-6'}>
                    {filteredPopular.slice(0, popularVisible).map((event) => (
                      <EventCard key={`popular-${event.id}`} event={localizeEvent(event, language)} variant={viewMode === 'list' ? 'row' : 'card'} />
                    ))}
                  </div>

                  {filteredPopular.length > popularVisible && (
                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={() => setPopularVisible(prev => prev + VISIBLE_INCREMENT)}
                        className="px-8 py-3 bg-white border border-gray-200 text-primary-600 font-bold rounded-2xl shadow-soft hover:shadow-md hover:border-primary-100 hover:bg-primary-50 transition-all active:scale-95 text-sm"
                      >
                        {t('home.seeMore')} ({filteredPopular.length - popularVisible})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {filteredPast.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-bold text-gray-500 tracking-tight">{t('home.pastTitle')}</h2>
                    <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
                  </div>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 opacity-90 grayscale-[50%] hover:grayscale-0 transition-all duration-500' : 'flex flex-col gap-6 opacity-90 grayscale-[50%] hover:grayscale-0 transition-all duration-500'}>
                    {filteredPast.slice(0, pastVisible).map((event) => (
                      <EventCard key={event.id} event={localizeEvent(event, language)} variant={viewMode === 'list' ? 'row' : 'card'} />
                    ))}
                  </div>

                  {filteredPast.length > pastVisible && (
                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={() => setPastVisible(prev => prev + VISIBLE_INCREMENT)}
                        className="px-8 py-3 bg-white border border-gray-200 text-gray-500 font-bold rounded-2xl shadow-soft hover:shadow-md hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95 text-sm"
                      >
                        {t('home.seeMore')} ({filteredPast.length - pastVisible})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </PageContainer>
      </div>
    </div>
  );
};

export default HomePage;
