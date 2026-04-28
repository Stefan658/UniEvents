import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import Button from '../components/Button';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { getAllEvents, deleteEvent } from '../api/events';
import { getEventRegistrations } from '../api/registrations';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, Calendar, MapPin, Users, ExternalLink } from 'lucide-react';

const OrganizerDashboardPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const allEvents = await getAllEvents();
        const myEvents = allEvents.filter(event => event.organizer_id === user.id);
        setEvents(myEvents);

        // Fetch participant counts for each event
        const counts = {};
        await Promise.all(myEvents.map(async (event) => {
          try {
            const registrations = await getEventRegistrations(event.id);
            counts[event.id] = Array.isArray(registrations) ? registrations.length : 0;
          } catch (err) {
            console.error(`Failed to fetch registrations for event ${event.id}:`, err);
            counts[event.id] = 0;
          }
        }));
        setParticipantCounts(counts);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(id);
        setEvents(events.filter(event => event.id !== id));
        // Remove from counts too
        setParticipantCounts(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } catch (err) {
        alert('Failed to delete event: ' + err);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Summary statistics calculations
  const totalEvents = events.length;
  const activeRegistrations = Object.values(participantCounts).reduce((acc, count) => acc + count, 0);
  
  // Capacity utilization
  // Only include events that have a max_participants limit
  const totalParticipantsInLimitedEvents = events.reduce((acc, event) => {
    if (event.max_participants) {
      return acc + (participantCounts[event.id] || 0);
    }
    return acc;
  }, 0);
  
  const totalCapacityOfLimitedEvents = events.reduce((acc, event) => {
    return acc + (event.max_participants || 0);
  }, 0);

  const capacityUtilization = totalCapacityOfLimitedEvents > 0 
    ? Math.round((totalParticipantsInLimitedEvents / totalCapacityOfLimitedEvents) * 100) 
    : 0;

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-primary-100">
            Management Portal
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Organizer Dashboard</h1>
          <p className="text-gray-500 font-medium mt-2">Manage your events and track participation.</p>
        </div>
        <Link to="/organizer/events/new">
          <Button className="shadow-primary-200 shadow-xl !py-3 !px-6">
            <Plus className="w-5 h-5 mr-2" />
            Create New Event
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-gray-100/50">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Total Events</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{totalEvents}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-gray-100/50">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Active Registrations</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">
            {activeRegistrations}
          </p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-gray-100/50">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Capacity Utilization</p>
          <p className="text-4xl font-black text-primary-600 tracking-tighter">{capacityUtilization}%</p>
        </div>
      </div>

      <SectionCard title="My Events" className="!p-0">
        {loading ? (
          <div className="p-12"><Loader /></div>
        ) : error ? (
          <div className="p-8"><ErrorMessage message={error} /></div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 px-8">
            <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-lg">You haven't created any events yet.</p>
            <Link to="/organizer/events/new" className="text-primary-600 font-black mt-2 inline-block hover:underline">
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 text-left border-b border-gray-50">
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Event Details</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Category</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Participants</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center">
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{event.title}</p>
                          <div className="flex items-center text-xs text-gray-400 font-medium mt-1">
                            <MapPin className="w-3 h-3 mr-1" /> {event.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                        {event.category_name}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-gray-700">{formatDate(event.start_at)}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center text-sm font-bold text-gray-700">
                        <Users className="w-4 h-4 mr-2 text-gray-300" />
                        {participantCounts[event.id] || 0} / {event.max_participants || '∞'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/events/${event.id}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
                          <ExternalLink className="w-5 h-5" />
                        </Link>
                        <Link to={`/organizer/events/${event.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <Edit2 className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(event.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </PageContainer>
  );
};

export default OrganizerDashboardPage;
