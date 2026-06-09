import React, { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import { getAllEvents, updateEventStatus } from '../api/events';
import { getOrganizers } from '../api/users';
import { getEventRegistrations } from '../api/registrations';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeEvent } from '../utils/localizeEvent';
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
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboardPage = () => {
  const { language, t } = useLanguage();
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedOrganizerId, setExpandedOrganizerId] = useState(null);

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

  const toggleOrganizerExpansion = (id) => {
    setExpandedOrganizerId(expandedOrganizerId === id ? null : id);
  };

  const handleStatusUpdate = async (id, status) => {
    // Keep internal status names logic but visually translate if needed
    const translatedStatus = t(`status.${status}`, status);
    if (!window.confirm(t('admin.confirmStatus').replace('{status}', translatedStatus))) return;
    
    setActionLoading(true);
    try {
      await updateEventStatus(id, status);
      // Refresh data
      await fetchAdminData();
    } catch (err) {
      alert(t('admin.statusFailed') + err);
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

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return true;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('admin.dateTbd');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t('admin.invalidDate');
    const locale = language === 'ro' ? 'ro-RO' : 'en-US';
    return date.toLocaleDateString(locale, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDashboardDateRange = (start, end) => {
    if (!start) return t('admin.dateTbd');
    const date1 = new Date(start);
    if (isNaN(date1.getTime())) return t('admin.invalidDate');

    const locale = language === 'ro' ? 'ro-RO' : 'en-US';

    if (!end || isSameDay(start, end)) {
      return date1.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) + 
             (end ? ` - ${new Date(end).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : '');
    }
    
    const date2 = new Date(end);
    if (isNaN(date2.getTime())) return t('admin.invalidDateRange');

    return `${date1.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })} - ${date2.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const filteredEvents = events.filter(event => {
    if (activeTab === 'pending') return event.status === 'pending';
    if (activeTab === 'published') return event.status === 'published' || event.status === 'active';
    if (activeTab === 'rejected') return event.status === 'rejected';
    if (activeTab === 'cancelled') return event.status === 'cancelled';
    return true;
  });

  if (loading && events.length === 0) return <PageContainer><div className="py-20"><Loader /></div></PageContainer>;
  if (error) return <PageContainer><ErrorMessage message={error} /></PageContainer>;

  return (
    <PageContainer>
      <div className="mb-12">
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-primary-100">
          <Shield className="w-3 h-3 mr-2" />
          {t('admin.portal')}
        </div>
        <h1 className="text-4xl font-semibold font-black text-gray-900 tracking-tighter">{t('admin.title')}</h1>
        <p className="text-gray-500 font-medium mt-2">{t('admin.subtitle')}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-gray-100/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Calendar className="w-32 h-32" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{t('admin.totalEvents')}</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{totalEvents}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-gray-100/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <UserCheck className="w-32 h-32" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{t('admin.totalOrganizers')}</p>
          <p className="text-4xl font-black text-gray-900 tracking-tighter">{totalOrganizers}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-soft border border-gray-100/50 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Users className="w-32 h-32" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{t('admin.totalRegistrations')}</p>
          <p className="text-4xl font-black text-primary-600 tracking-tighter">{totalRegistrations}</p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Events Moderation Section */}
        <SectionCard className="!p-0 overflow-hidden">
          <div className="bg-gray-50/50 border-b border-gray-100 px-8 py-4 flex flex-wrap gap-4 items-center justify-between">
            <h2 className="text-xl font-semibold font-black text-gray-900 tracking-tight">{t('admin.eventModeration')}</h2>
            <div className="flex bg-white p-1 rounded-xl border border-gray-200">
              {['pending', 'published', 'rejected', 'cancelled'].map((tab) => {
                const tabTitle = t(`admin.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === tab 
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                        : 'text-gray-400 hover:text-primary-600'
                    }`}
                  >
                    {tabTitle}
                    <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${
                      activeTab === tab ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      {events.filter(e => {
                        if (tab === 'published') return e.status === 'published' || e.status === 'active';
                        return e.status === tab;
                      }).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-20 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-gray-400 font-bold">{t('admin.noEventsFound').replace('{tab}', t(`admin.tab${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`))}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/20 text-left border-b border-gray-50">
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">{t('admin.colEventOrg')}</th>
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">{t('admin.colDateLoc')}</th>
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">{t('admin.colNotes')}</th>
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">{t('admin.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEvents.map((event) => {
                    const conflicts = checkConflicts(event);
                    const displayEvent = localizeEvent(event, language);
                    return (
                      <tr key={event.id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-8 py-6">
                          <div>
                            <Link 
                              to={`/events/${event.id}`} 
                              target="_blank"
                              className="font-bold text-gray-900 mb-1 hover:text-primary-600 hover:underline transition-colors block w-fit"
                            >
                              {displayEvent.title}
                            </Link>
                            <p className="text-xs font-bold text-primary-600">{t('admin.by')} {event.organizer_full_name}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            <div className="flex items-center text-xs font-bold text-gray-600">
                              <Clock className="w-3 h-3 mr-2 text-gray-400" />
                              {formatDashboardDateRange(event.start_at, event.end_at)}
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
                              const blockingEvent = localizeEvent(blocking[0], language);
                              return (
                                <div className="flex items-start bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 max-w-xs">
                                  <XCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{t('admin.blockingConflict')}</p>
                                    <p className="text-[10px] font-medium leading-tight">{t('admin.blockingDesc')} '{blockingEvent.title}'.</p>
                                  </div>
                                </div>
                              );
                            }
                            if (warning.length > 0) {
                              return (
                                <div className="flex items-start bg-amber-50 text-amber-700 p-3 rounded-xl border border-amber-100 max-w-xs">
                                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{t('admin.warningConflict')}</p>
                                    <p className="text-[10px] font-medium leading-tight">{t('admin.warningDesc').replace('{count}', warning.length)}</p>
                                  </div>
                                </div>
                              );
                            }
                            return <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">{t('admin.noIssues')}</span>;
                          })()}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
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
                                  title={checkConflicts(event).blocking.length > 0 ? t('admin.cannotApprove') : t('admin.approvePublish')}
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleStatusUpdate(event.id, 'rejected')}
                                  disabled={actionLoading}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                  title={t('admin.rejectEvent')}
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}

                            {activeTab === 'published' && (
                              <button 
                                onClick={() => handleStatusUpdate(event.id, 'cancelled')}
                                disabled={actionLoading}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title={t('admin.cancelEvent')}
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            )}

                            {(activeTab === 'rejected' || activeTab === 'cancelled') && (
                              <button 
                                onClick={() => handleStatusUpdate(event.id, 'published')}
                                disabled={actionLoading || checkConflicts(event).blocking.length > 0}
                                className={`p-2 rounded-xl transition-all ${
                                  checkConflicts(event).blocking.length > 0 
                                    ? 'text-gray-200 cursor-not-allowed' 
                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                                title={checkConflicts(event).blocking.length > 0 ? t('admin.cannotRestore') : t('admin.approveRestore')}
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
        <SectionCard title={t('admin.registeredOrganizers')} className="!p-0 h-fit">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 text-left border-b border-gray-50">
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">{t('admin.colName')}</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">{t('admin.colEmail')}</th>
                  <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">{t('admin.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {organizers.map((organizer) => {
                  const isExpanded = expandedOrganizerId === organizer.id;
                  const organizerEvents = events.filter(e => e.organizer_id === organizer.id);
                  const totalOrgEvents = organizerEvents.length;
                  const publishedOrgEvents = organizerEvents.filter(e => e.status === 'published' || e.status === 'active').length;
                  const pendingOrgEvents = organizerEvents.filter(e => e.status === 'pending').length;
                  const rejectedOrgEvents = organizerEvents.filter(e => e.status === 'rejected').length;
                  const cancelledOrgEvents = organizerEvents.filter(e => e.status === 'cancelled').length;
                  const totalOrgRegistrations = organizerEvents.reduce((acc, e) => acc + (participantCounts[e.id] || 0), 0);

                  return (
                    <React.Fragment key={organizer.id}>
                      <tr className={`transition-colors ${isExpanded ? 'bg-primary-50/30' : 'hover:bg-gray-50/30'}`}>
                        <td className="px-8 py-5">
                          <p className="font-bold text-gray-900">{organizer.full_name || `${organizer.first_name} ${organizer.last_name}`}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-medium text-gray-500">{organizer.email}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => toggleOrganizerExpansion(organizer.id)}
                            className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                              isExpanded 
                                ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                                : 'text-primary-600 hover:bg-primary-50'
                            }`}
                          >
                            {isExpanded ? t('admin.showLess') : t('admin.showMore')}
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-2" /> : <ChevronDown className="w-3.5 h-3.5 ml-2" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan="3" className="px-8 py-8 bg-gray-50/30">
                            <div className="space-y-8">
                              <div>
                                <div className="flex items-center justify-between mb-6">
                                  <div>
                                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{t('admin.organizerInsights')}</h3>
                                    <p className="text-xs font-bold text-gray-500">{t('admin.organizerActivity')} - {organizer.full_name}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                  {[
                                    { label: t('admin.totalEvents'), value: totalOrgEvents, color: 'gray' },
                                    { label: t('admin.publishedEvents'), value: publishedOrgEvents, color: 'green' },
                                    { label: t('admin.pendingEvents'), value: pendingOrgEvents, color: 'amber' },
                                    { label: t('admin.rejectedEvents'), value: rejectedOrgEvents, color: 'red' },
                                    { label: t('admin.cancelledEvents'), value: cancelledOrgEvents, color: 'rose' },
                                    { label: t('admin.totalRegistrations'), value: totalOrgRegistrations, color: 'primary' }
                                  ].map((stat, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                                      <p className={`text-xl font-black tracking-tighter text-${stat.color === 'primary' ? 'primary-600' : stat.color + '-600'}`}>{stat.value}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">{t('admin.organizerEvents')}</h4>
                                {organizerEvents.length === 0 ? (
                                  <p className="text-sm font-bold text-gray-400 py-4 italic">{t('admin.noOrganizerEvents')}</p>
                                ) : (
                                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                    <table className="w-full text-left">
                                      <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-50">
                                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('admin.colEventOrg')}</th>
                                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('admin.colDateLoc')}</th>
                                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{t('admin.registrations')}</th>
                                          <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">{t('admin.colActions')}</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                        {organizerEvents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(event => {
                                          const displayEvent = localizeEvent(event, language);
                                          return (
                                            <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                                              <td className="px-6 py-4">
                                                <p className="text-xs font-bold text-gray-900">{displayEvent.title}</p>
                                                <p className="text-[10px] font-black uppercase text-primary-600">{event.category_name}</p>
                                              </td>
                                              <td className="px-6 py-4">
                                                <p className="text-[10px] font-bold text-gray-600">{formatDate(event.start_at)}</p>
                                                <p className="text-[10px] font-medium text-gray-400">{event.location}</p>
                                              </td>
                                              <td className="px-6 py-4">
                                                <span className="text-xs font-black text-gray-900">{participantCounts[event.id] || 0}</span>
                                              </td>
                                              <td className="px-6 py-4 text-right">
                                                <Link 
                                                  to={`/events/${event.id}`} 
                                                  target="_blank"
                                                  className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline"
                                                >
                                                  {t('admin.viewEvent')}
                                                </Link>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
};

export default AdminDashboardPage;
