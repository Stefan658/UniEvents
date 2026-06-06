import React, { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import EventCard from '../components/EventCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { getNearbyEvents } from '../api/events';
import { MapPin, Sparkles, LayoutGrid, List, Compass, Info } from 'lucide-react';

const UniNearbyPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const fetchNearby = async () => {
      try {
        const data = await getNearbyEvents();
        setEvents(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNearby();
  }, []);

  return (
    <div className="relative">
      <PageContainer>
        {/* Header Section */}
        <div className="relative mb-16 pt-16 pb-20 overflow-hidden rounded-[3.5rem] bg-gradient-to-br from-indigo-600 via-primary-600 to-violet-700 text-white shadow-xl shadow-primary-900/10">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <Compass className="absolute -top-12 -right-12 w-64 h-64 rotate-12" />
            <MapPin className="absolute -bottom-8 -left-8 w-48 h-48 -rotate-12" />
          </div>

          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider mb-8 border border-white/30 shadow-sm">
              <Compass className="w-3.5 h-3.5 mr-2" />
              Explore Beyond Campus
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-tight mb-6">
              Uni Nearby
            </h1>

            <p className="text-lg md:text-xl text-indigo-50 font-medium leading-relaxed opacity-90">
              Discover student-friendly events and opportunities around Suceava.
              Opportunities that matter for your growth and lifestyle.
            </p>
          </div>
        </div>

        {/* Informational Banner */}
        <div className="mb-12 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm text-indigo-600 flex-shrink-0">
            <Info className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-indigo-900 mb-1">Local Opportunities</h3>
            <p className="text-indigo-700/80 leading-relaxed text-sm">
              These opportunities are outside the university campus but are curated for students interested in culture, music, tech, volunteering, sport, and networking. They are provided by our city partners and local communities.
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        {!loading && !error && events.length > 0 && (
          <div className="flex justify-center mb-12">
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

        {/* Events Content */}
        {loading ? (
          <div className="py-24 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-500 font-normal animate-pulse">Scanning the city for opportunities...</p>
          </div>
        ) : error ? (
          <div className="max-w-2xl mx-auto">
            <ErrorMessage message={error} />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Compass className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-lg">No nearby opportunities available right now. Check back soon!</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8' : 'flex flex-col gap-6'}>
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                isNearby={true} 
                variant={viewMode === 'list' ? 'row' : 'card'} 
              />
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
};

export default UniNearbyPage;
