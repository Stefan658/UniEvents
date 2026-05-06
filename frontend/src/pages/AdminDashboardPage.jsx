import React, { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import { getAllEvents, updateEventStatus } from '../api/events';
import { getOrganizers } from '../api/users';
import { getEventRegistrations } from '../api/registrations';
import { 
  Calendar, 
  Users, 
  UserCheck, 
  Shield, 
  MapPin, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboardPage = () => {
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [allEvents, allOrganizers] = await Promise.all([
        getAllEvents(),
        getOrganizers()
      ]);
      
      setEvents(allEvents);
      setOrganizers(allOrganizers);

      // Fetch participant counts for each event
      const counts = {};
      await Promise.all(allEvents.map(async (event) => {
        try {
          const registrations = await getEventRegistrations(event.id);
          counts[event.id] = Array.isArray(registrations) ? registrations.length : 0;
        } catch (err) {
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

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    if (!window.confirm(`Are you sure you want to set this event to ${status}?`)) return;
    
    setActionLoading(true);
    try {
      await updateEventStatus(id, status);
      // Refresh data
      await fetchAdminData();
    } catch (err) {
      alert('Failed to update status: ' + err);
    } finally {
      setActionLoading(false);
    }
  };

  const checkConflicts = (event) => {
    if (!event.start_at || !event.end_at || !event.location) return { warning: [], blocking: [] };
    
    const startA = new Date(event.start_at).getTime();
    const endA = new Date(event.end_at).getTime();
    const locA = event.location.trim().toLowerCase();
    
    const overlaps = events.filter(other => {
      if (other.id === event.id) return false;
      if (!other.start_at || !other.end_at || !other.location) return false;
      
      // Filter out rejected/cancelled
      if (['rejected', 'cancelled'].includes(other.status)) return false;
      
      const locB = other.location.trim().toLowerCase();
      if (locA !== locB) return false;
      
      const startB = new Date(other.start_at).getTime();
      const endB = new Date(other.end_at).getTime();
      
      // Overlap: startA < endB AND endA > startB
      return startA < endB && endA > startB;
    });

    return {
      warning: overlaps.filter(o => o.status === 'pending'),
      blocking: overlaps.filter(o => ['published', 'active'].includes(o.status))
    };
  };

  const totalEvents = events.length;
  const totalOrganizers = organizers.length;
  const totalRegistrations = Object.values(participantCounts).reduce((acc, count) => acc + count, 0);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredEvents = events.filter(event => {
    if (activeTab === 'pending') return event.status === 'pending';
    if (activeTab === 'published') return event.status === 'published' || event.status === 'active';
    if (activeTab === 'rejected') return event.status === 'rejected';
    return true;
  });

  if (loading && events.length === 0) return <PageContainer><div className="py-20"><Loader /></div></PageContainer>;
  if (error) return <PageContainer><ErrorMessage message={error} /></PageContainer>;

  return (
    <PageContainer>
      <div className="mb-12">
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-primary-100">
          <Shield className="w-3 h-3 mr-2" />
          System Administration
        </div>
        <h1 className="text-4xl font-semibold font-black text-gray-900 tracking-tighter">Admin Panel</h1>
        <p className="text-gray-500 font-medium mt-2">Manage event approvals and platform integrity.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-gray-100/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Calendar className="w-32 h-32" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Total Events</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{totalEvents}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-gray-100/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <UserCheck className="w-32 h-32" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Total Organizers</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{totalOrganizers}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-gray-100/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Users className="w-32 h-32" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Total Registrations</p>
          <p className="text-4xl font-black text-primary-600 tracking-tighter">{totalRegistrations}</p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Events Moderation Section */}
        <SectionCard className="!p-0 overflow-hidden">
          <div className="bg-gray-50/50 border-b border-gray-100 px-8 py-4 flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-xl font-semibold font-black text-gray-900 tracking-tight">Event Moderation</h2>
            <div className="flex bg-white p-1 rounded-xl border border-gray-200">
              {['pending', 'published', 'rejected'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                      : 'text-gray-400 hover:text-primary-600'
                  }`}
                >
                  {tab}
                  <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${
                    activeTab === tab ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {events.filter(e => {
                      if (tab === 'published') return e.status === 'published' || e.status === 'active';
                      return e.status === tab;
                    }).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-20 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-gray-400 font-bold">No {activeTab} events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/20 text-left border-b border-gray-50">
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Event & Organizer</th>
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Date & Location</th>
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Moderation Notes</th>
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEvents.map((event) => {
                    const conflicts = checkConflicts(event);
                    return (
                      <tr key={event.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-8 py-6">
                          <div>
                            <p className="font-bold text-gray-900 mb-1">{event.title}</p>
                            <p className="text-xs font-bold text-primary-600">by {event.organizer_full_name}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <div className="flex items-center text-xs font-bold text-gray-600">
                              <Clock className="w-3 h-3 mr-2 text-gray-400" />
                              {formatDate(event.start_at)}
                            </div>
                            <div className="flex items-center text-xs font-bold text-gray-600">
                              <MapPin className="w-3 h-3 mr-2 text-gray-400" />
                              {event.location}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {(() => {
                            const { warning, blocking } = checkConflicts(event);
                            if (blocking.length > 0) {
                              return (
                                <div className="flex items-start bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 max-w-xs">
                                  <XCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Blocking Conflict</p>
                                    <p className="text-[10px] font-medium leading-tight">Cannot approve: overlaps with published event '{blocking[0].title}'.</p>
                                  </div>
                                </div>
                              );
                            }
                            if (warning.length > 0) {
                              return (
                                <div className="flex items-start bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-100 max-w-xs">
                                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Scheduling Warning</p>
                                    <p className="text-[10px] font-medium leading-tight">Overlaps with {warning.length} other pending event(s).</p>
                                  </div>
                                </div>
                              );
                            }
                            return <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">No issues detected</span>;
                          })()}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link 
                              to={`/events/${event.id}`} 
                              target="_blank"
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                              title="Preview Event"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </Link>
                            
                            {activeTab === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleStatusUpdate(event.id, 'published')}
                                  disabled={actionLoading || checkConflicts(event).blocking.length > 0}
                                  className={`p-2 rounded-xl transition-all ${
                                    checkConflicts(event).blocking.length > 0 
                                      ? 'text-gray-200 cursor-not-allowed' 
                                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                  }`}
                                  title={checkConflicts(event).blocking.length > 0 ? "Cannot approve: scheduling conflict" : "Approve & Publish"}
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleStatusUpdate(event.id, 'rejected')}
                                  disabled={actionLoading}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title="Reject Event"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}

                            {activeTab === 'published' && (
                              <button 
                                onClick={() => handleStatusUpdate(event.id, 'rejected')}
                                disabled={actionLoading}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Unpublish / Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            )}

                            {activeTab === 'rejected' && (
                              <button 
                                onClick={() => handleStatusUpdate(event.id, 'published')}
                                disabled={actionLoading || checkConflicts(event).blocking.length > 0}
                                className={`p-2 rounded-xl transition-all ${
                                  checkConflicts(event).blocking.length > 0 
                                    ? 'text-gray-200 cursor-not-allowed' 
                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                                title={checkConflicts(event).blocking.length > 0 ? "Cannot restore: scheduling conflict" : "Approve / Restore"}
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* Organizers List (moved to bottom as secondary info) */}
        <SectionCard title="Registered Organizers" className="!p-0 h-fit">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 text-left border-b border-gray-50">
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Name</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {organizers.map((organizer) => (
                  <tr key={organizer.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-900">{organizer.full_name || `${organizer.first_name} ${organizer.last_name}`}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-medium text-gray-500">{organizer.email}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
};

export default AdminDashboardPage;
