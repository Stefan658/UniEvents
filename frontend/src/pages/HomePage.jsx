import React, { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { getAllEvents } from '../api/events';
import { Sparkles, Calendar } from 'lucide-react';

const HomePage = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getAllEvents();
        const now = new Date();
        
        const upcoming = data.filter(event => new Date(event.start_at) >= now)
          .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
        
        const past = data.filter(event => new Date(event.start_at) < now)
          .sort((a, b) => new Date(b.start_at) - new Date(a.start_at));

        setUpcomingEvents(upcoming);
        setPastEvents(past);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <PageContainer>
      <div className="relative mb-20 pt-10 pb-16 overflow-hidden">
        {/* Background blobs for modern look */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-8 right-0 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700"></div>
        
        <div className="relative text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-black uppercase tracking-widest mb-6 border border-primary-100/50">
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            University Life Reimagined
          </div>
          <h1 className="text-5xl font-black text-gray-900 sm:text-6xl md:text-7xl tracking-tighter leading-[0.9] mb-6">
            Discover <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-blue-500">University Events</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
            Stay connected with the latest workshops, seminars, and student-led activities at the "Ștefan cel Mare" University.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader size="lg" />
          <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading amazing events...</p>
        </div>
      ) : error ? (
        <div className="max-w-2xl mx-auto">
          <ErrorMessage message={error} />
        </div>
      ) : (
        <>
          <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Upcoming Events</h2>
              <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
              <span className="text-sm font-bold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-xl border border-primary-100">
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
                <h2 className="text-3xl font-black text-gray-400 tracking-tight">Past Events</h2>
                <div className="h-1 flex-grow mx-8 bg-gray-100 rounded-full hidden md:block opacity-50"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60 grayscale-[50%] hover:grayscale-0 transition-all duration-500">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default HomePage;
