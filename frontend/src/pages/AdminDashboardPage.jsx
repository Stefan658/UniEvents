import React, { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { getAllEvents } from '../api/events';
import { getOrganizers } from '../api/users';
import { getEventRegistrations } from '../api/registrations';
import { Calendar, Users, UserCheck, Shield, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboardPage = () => {
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
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

    fetchAdminData();
  }, []);

  const totalEvents = events.length;
  const totalOrganizers = organizers.length;
  const totalRegistrations = Object.values(participantCounts).reduce((acc, count) => acc + count, 0);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) return <PageContainer><div className="py-20"><Loader /></div></PageContainer>;
  if (error) return <PageContainer><ErrorMessage message={error} /></PageContainer>;

  return (
    <PageContainer>
      <div className="mb-12">
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-primary-100">
          <Shield className="w-3 h-3 mr-2" />
          System Administration
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Admin Panel</h1>
        <p className="text-gray-500 font-medium mt-2">Global overview of platform activity and users.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Organizers List */}
        <SectionCard title="Organizers" className="!p-0 h-fit">
          {organizers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold">No organizers found</div>
          ) : (
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
          )}
        </SectionCard>

        {/* Events Overview */}
        <SectionCard title="Global Events Overview" className="!p-0 h-fit">
          {events.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold">No events available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 text-left border-b border-gray-50">
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Event</th>
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Organizer</th>
                    <th className="px-8 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Reg.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{event.title}</p>
                          <div className="flex items-center text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                            <MapPin className="w-3 h-3 mr-1" /> {event.location}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-gray-600">{event.organizer_full_name}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-primary-600">{participantCounts[event.id] || 0}</span>
                          <Link to={`/events/${event.id}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all ml-2">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </PageContainer>
  );
};

export default AdminDashboardPage;
