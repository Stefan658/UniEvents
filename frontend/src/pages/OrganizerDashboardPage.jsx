import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import Button from '../components/Button';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { getAllEvents, deleteEvent } from '../api/events';
import { getEventRegistrations } from '../api/registrations';
import { getEventFeedbackSummary } from '../api/feedback';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit2, Trash2, Calendar, MapPin, Users, ExternalLink, Star, RefreshCcw } from 'lucide-react';

const OrganizerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [feedbackSummaries, setFeedbackSummaries] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const allEvents = await getAllEvents();
        const myEvents = allEvents.filter(event => event.organizer_id === user.id);
        setEvents(myEvents);

        // Fetch participant counts and feedback summaries for each event
        const counts = {};
        const summaries = {};
        await Promise.all(myEvents.map(async (event) => {
          try {
            const [registrations, summary] = await Promise.all([
              getEventRegistrations(event.id),
              getEventFeedbackSummary(event.id)
            ]);
            counts[event.id] = Array.isArray(registrations) ? registrations.length : 0;
            summaries[event.id] = summary;
          } catch (err) {
            console.error(`Failed to fetch data for event ${event.id}:`, err);
            counts[event.id] = 0;
          }
        }));
        setParticipantCounts(counts);
        setFeedbackSummaries(summaries);
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
        // Remove from counts and summaries too
        setParticipantCounts(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setFeedbackSummaries(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } catch (err) {
        alert('Failed to delete event: ' + err);
      }
    }
  };

  const handleRetake = (event) => {
    navigate('/organizer/events/new', { state: { templateEvent: event } });
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
  
  // Average rating across all events that have feedback
  const eventsWithFeedback = Object.values(feedbackSummaries).filter(s => 
    s && 
    s.total_feedbacks > 0 && 
    s.average_rating !== null && 
    s.average_rating !== undefined &&
    !isNaN(Number(s.average_rating))
  );

  const avgRating = eventsWithFeedback.length > 0
    ? (eventsWithFeedback.reduce((acc, s) => acc + Number(s.average_rating), 0) / eventsWithFeedback.length).toFixed(1)
    : '0.0';

  // Capacity utilization calculation
  const capacityEvents = events.filter(e => e.max_participants && e.max_participants > 0);
  const totalMaxParticipants = capacityEvents.reduce((acc, e) => acc + Number(e.max_participants), 0);
  const totalRegisteredForCapacity = capacityEvents.reduce((acc, e) => acc + (participantCounts[e.id] || 0), 0);
  
  const capacityUsage = totalMaxParticipants > 0
    ? Math.round((totalRegisteredForCapacity / totalMaxParticipants) * 100)
    : 0;

  const renderEventsTable = (eventsList, isPast = false) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50/50 text-left border-b border-gray-50">
            <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Event Details</th>
            <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
            <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-center">Participants</th>
            {isPast && <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-center">Feedback</th>}
            <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {eventsList.map((event) => (
            <tr key={event.id} className="hover:bg-gray-50/30 transition-colors group">
              <td className="px-8 py-5">
                <div className="flex items-center">
                  <div>
                    <p className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{event.title}</p>
                    <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                      {event.category_name} • {formatDate(event.start_at)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-8 py-5">
                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                  event.status === 'published' || event.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                  event.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                  event.status === 'rejected' || event.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                  'bg-gray-50 text-gray-700 border-gray-100'
                }`}>
                  {event.status}
                </span>
              </td>
              <td className="px-8 py-5 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold text-gray-900">{participantCounts[event.id] || 0}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Registered</span>
                </div>
              </td>
              {isPast && (
                <td className="px-8 py-5 text-center">
                  {feedbackSummaries[event.id] && feedbackSummaries[event.id].total_feedbacks > 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-bold text-gray-900">{feedbackSummaries[event.id].average_rating}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{feedbackSummaries[event.id].total_feedbacks} reviews</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">No feedback</span>
                  )}
                </td>
              )}
              <td className="px-8 py-5 text-right">
                <div className="flex items-center justify-end space-x-2">
                  <Link to={`/events/${event.id}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all" title="View Details">
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                  {!isPast ? (
                    <>
                      <Link to={`/organizer/events/${event.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Edit Event">
                        <Edit2 className="w-5 h-5" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(event.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Event"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleRetake(event)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                      title="Schedule Again"
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const now = new Date();
  const upcomingEvents = events
    .filter(event => new Date(event.end_at) >= now)
    .sort((a, b) => new Date(a.start_at) - new Date(b.start_at));

  const pastEvents = events
    .filter(event => new Date(event.end_at) < now)
    .sort((a, b) => new Date(b.start_at) - new Date(a.start_at));

  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-primary-100">
            Management Portal
          </div>
          <h1 className="text-4xl font-semibold font-black text-gray-900 tracking-tighter">Organizer Dashboard</h1>
          <p className="text-gray-500 font-medium mt-2">Manage your events and track participation.</p>
        </div>
        <Link to="/organizer/events/new">
          <Button className="shadow-primary-200 shadow-xl !py-3 !px-6">
            <Plus className="w-5 h-5 mr-2" />
            Create New Event
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
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
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Avg Platform Rating</p>
          <div className="flex items-center">
            <p className="text-4xl font-black text-primary-600 tracking-tighter mr-3">{avgRating}</p>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < Math.round(parseFloat(avgRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                />
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-gray-100/50">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Capacity Usage</p>
          <div className="flex items-center">
            <p className="text-4xl font-black text-gray-900 tracking-tighter mr-3">{capacityUsage}%</p>
            <Users className="w-5 h-5 text-gray-300" />
          </div>
        </div>
      </div>

      <SectionCard title="Upcoming & Active Events" className="!p-0 mb-12">
        {loading ? (
          <div className="p-12"><Loader /></div>
        ) : error ? (
          <div className="p-8"><ErrorMessage message={error} /></div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-20 px-8">
            <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold text-lg">No upcoming events scheduled.</p>
            <Link to="/organizer/events/new" className="text-primary-600 font-black mt-2 inline-block hover:underline">
              Create one now
            </Link>
          </div>
        ) : (
          renderEventsTable(upcomingEvents, false)
        )}
      </SectionCard>

      <SectionCard title="Past Events" className="!p-0">
        {loading ? (
          <div className="p-12"><Loader /></div>
        ) : error ? (
          <div className="p-8"><ErrorMessage message={error} /></div>
        ) : pastEvents.length === 0 ? (
          <div className="text-center py-12 px-8">
            <p className="text-gray-300 font-bold">No past events to display.</p>
          </div>
        ) : (
          renderEventsTable(pastEvents, true)
        )}
      </SectionCard>
    </PageContainer>
  );
};

export default OrganizerDashboardPage;
