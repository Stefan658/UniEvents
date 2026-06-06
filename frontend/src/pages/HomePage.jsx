import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { getAllEvents, getPopularEvents, getRecommendedEvents } from '../api/events';
import { getMyRegistrations } from '../api/registrations';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Calendar, TrendingUp, LayoutGrid, List, X, Search } from 'lucide-react';
import AssistantWidget from '../components/AssistantWidget';
import heroBg from '../assets/backg-based-from-logo.png';
import globalBg from '../assets/backg.png';

const INITIAL_VISIBLE_COUNT = 10;
const VISIBLE_INCREMENT = 10;

const HomePage = () => {
  const { user, isAuthenticated, role } = useAuth();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [viewMode, setViewMode] = useState('grid');
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

  // Reset visible counts when search changes
  useEffect(() => {
    setUpcomingVisible(INITIAL_VISIBLE_COUNT);
    setRecommendedVisible(INITIAL_VISIBLE_COUNT);
    setPopularVisible(INITIAL_VISIBLE_COUNT);
    setPastVisible(INITIAL_VISIBLE_COUNT);
  }, [searchQuery]);

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
    if (!searchQuery) return eventsList;
    const q = searchQuery.toLowerCase();
    return eventsList.filter(e => 
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.category_name?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.organizer_full_name?.toLowerCase().includes(q) ||
      e.participation_type?.toLowerCase().includes(q)
    );
  };

  const filteredUpcoming = useMemo(() => filterEvents(upcomingEvents), [upcomingEvents, searchQuery]);
  const filteredPopular = useMemo(() => filterEvents(popularEvents), [popularEvents, searchQuery]);
  const filteredPast = useMemo(() => filterEvents(pastEvents), [pastEvents, searchQuery]);
  const filteredRecommended = useMemo(() => filterEvents(recommendedEvents), [recommendedEvents, searchQuery]);

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
                University Life Reimagined
              </div>

              <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl md:text-7xl tracking-tighter leading-[0.95] mb-8">
                Discover <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-500">University Events</span>
              </h1>

              <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-normal leading-relaxed">
                Stay connected with the latest workshops, seminars, and student-led activities at the "Ștefan cel Mare" University of Suceava
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
                      Search results for <span className="text-primary-700 font-bold">"{searchQuery}"</span>
                    </span>
                    <div className="w-px h-4 bg-primary-200 mx-4"></div>
                    <Link 
                      to="/" 
                      className="text-primary-600 hover:text-primary-800 font-bold text-sm flex items-center group"
                    >
                      Clear
                      <X className="w-4 h-4 ml-1.5 group-hover:rotate-90 transition-transform" />
                    </Link>
                  </div>
                  {(filteredUpcoming.length === 0 && filteredPast.length === 0 && filteredPopular.length === 0) && (
                    <p className="mt-8 text-gray-400 font-medium italic">No matches found across any category.</p>
                  )}
                </div>
              )}

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
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Upcoming Events</h2>
                  <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
                  <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-xl border border-primary-100">
                    {filteredUpcoming.length} {searchQuery ? 'Matches' : 'Upcoming'}
                  </span>
                </div>

                {filteredUpcoming.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 shadow-sm">
                    <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      {searchQuery ? <Search className="w-8 h-8 text-gray-300" /> : <Calendar className="w-8 h-8 text-gray-300" />}
                    </div>
                    <p className="text-gray-400 font-bold text-lg">
                      {searchQuery ? `No events matching "${searchQuery}" found.` : 'No upcoming events found. Check back soon!'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-6'}>
                      {filteredUpcoming.slice(0, upcomingVisible).map((event) => (
                        <EventCard key={event.id} event={event} variant={viewMode === 'list' ? 'row' : 'card'} />
                      ))}
                    </div>
                    
                    {filteredUpcoming.length > upcomingVisible && (
                      <div className="mt-12 flex justify-center">
                        <button
                          onClick={() => setUpcomingVisible(prev => prev + VISIBLE_INCREMENT)}
                          className="px-8 py-3 bg-white border border-gray-200 text-primary-600 font-bold rounded-2xl shadow-soft hover:shadow-md hover:border-primary-100 hover:bg-primary-50 transition-all active:scale-95 text-sm"
                        >
                          See more events ({filteredUpcoming.length - upcomingVisible} left)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {filteredRecommended.length > 0 && !searchQuery && (
                <div className="mb-20">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
                      <Sparkles className="w-8 h-8 mr-3 text-primary-600" />
                      Recommended for You
                    </h2>
                    <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
                  </div>

                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-6'}>
                    {filteredRecommended.slice(0, recommendedVisible).map((event) => (
                      <EventCard key={`rec-${event.id}`} event={event} variant={viewMode === 'list' ? 'row' : 'card'} />
                    ))}
                  </div>

                  {filteredRecommended.length > recommendedVisible && (
                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={() => setRecommendedVisible(prev => prev + VISIBLE_INCREMENT)}
                        className="px-8 py-3 bg-white border border-gray-200 text-primary-600 font-bold rounded-2xl shadow-soft hover:shadow-md hover:border-primary-100 hover:bg-primary-50 transition-all active:scale-95 text-sm"
                      >
                        See more recommendations ({filteredRecommended.length - recommendedVisible} left)
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
                      Most Awaited Events
                    </h2>
                    <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
                  </div>

                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-6'}>
                    {filteredPopular.slice(0, popularVisible).map((event) => (
                      <EventCard key={`popular-${event.id}`} event={event} variant={viewMode === 'list' ? 'row' : 'card'} />
                    ))}
                  </div>

                  {filteredPopular.length > popularVisible && (
                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={() => setPopularVisible(prev => prev + VISIBLE_INCREMENT)}
                        className="px-8 py-3 bg-white border border-gray-200 text-primary-600 font-bold rounded-2xl shadow-soft hover:shadow-md hover:border-primary-100 hover:bg-primary-50 transition-all active:scale-95 text-sm"
                      >
                        See more events ({filteredPopular.length - popularVisible} left)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {filteredPast.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-bold text-gray-500 tracking-tight">Review Attended Events</h2>
                    <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
                  </div>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 opacity-90 grayscale-[50%] hover:grayscale-0 transition-all duration-500' : 'flex flex-col gap-6 opacity-90 grayscale-[50%] hover:grayscale-0 transition-all duration-500'}>
                    {filteredPast.slice(0, pastVisible).map((event) => (
                      <EventCard key={event.id} event={event} variant={viewMode === 'list' ? 'row' : 'card'} />
                    ))}
                  </div>

                  {filteredPast.length > pastVisible && (
                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={() => setPastVisible(prev => prev + VISIBLE_INCREMENT)}
                        className="px-8 py-3 bg-white border border-gray-200 text-gray-500 font-bold rounded-2xl shadow-soft hover:shadow-md hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95 text-sm"
                      >
                        See more past events ({filteredPast.length - pastVisible} left)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </PageContainer>
      </div>
      {(role !== 'organizer' && role !== 'admin') && <AssistantWidget />}
    </div>
  );
};

export default HomePage;
