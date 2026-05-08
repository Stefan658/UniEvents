import React, { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { getAllEvents } from '../api/events';
import { getMyRegistrations } from '../api/registrations';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Calendar } from 'lucide-react';
import heroBg from '../assets/backg-based-from-logo.png';
import globalBg from '../assets/backg.png';

const HomePage = () => {
  const { user, isAuthenticated, role } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getAllEvents();
        const now = new Date();
        
        const upcoming = data.filter(event => 
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
                // We might lack some fields like category_name here if not in registration serializer
                // But EventCard expects some fields. Let's check what reg has.
              }));
            
            // To get full event data for the cards, we should filter the global data
            const myPastEventIds = new Set(pastRegs.map(r => r.id));
            const personalizedPast = data.filter(event => myPastEventIds.has(event.id))
              .sort((a, b) => new Date(b.start_at) - new Date(a.start_at));
              
            setPastEvents(personalizedPast);
          } catch (regErr) {
            console.error('Failed to fetch personalized past events:', regErr);
            setPastEvents([]);
          }
        } else {
          // Guests, Admins, Organizers do not see personal past events
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

  return (
    <div className="relative">
      <div className="relative z-10">
        <PageContainer>
          <div className="relative mb-24 pt-20 pb-28 overflow-hidden rounded-[4rem] bg-white border border-gray-100/50 shadow-soft">
            {/* Hero Background Layer - Restored backg-based-from-logo.png */}
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
              {/* Subtle Radial Depth Glow */}
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
                    {upcomingEvents.length} Upcoming
                  </span>
                </div>

                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 shadow-sm">
                    <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-400 font-bold text-lg">No upcoming events found. Check back soon!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {upcomingEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>

              {pastEvents.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-3xl font-bold text-gray-500 tracking-tight">Review Attended Events</h2>
                    <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
                  </div>                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 opacity-90 grayscale-[50%] hover:grayscale-0 transition-all duration-500">
                    {pastEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
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
