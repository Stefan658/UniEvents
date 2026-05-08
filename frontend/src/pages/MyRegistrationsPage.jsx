import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import { getMyRegistrations, cancelRegistration } from '../api/registrations';
import { Calendar, MapPin, Clock, ExternalLink, XCircle, Bookmark } from 'lucide-react';

const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const data = await getMyRegistrations();
      setRegistrations(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancel = async (regId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;

    setActionLoading(true);
    try {
      await cancelRegistration(regId);
      setRegistrations(registrations.filter(r => r.id !== regId));
    } catch (err) {
      alert(err || 'Failed to cancel registration');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const activeRegistrations = registrations.filter(reg => 
    (reg.event_status === 'published' || reg.event_status === 'active') && 
    new Date(reg.event_start_at) >= new Date()
  );

  const pastRegistrations = registrations.filter(reg => 
    (reg.event_status === 'published' || reg.event_status === 'active') && 
    new Date(reg.event_start_at) < new Date()
  );

  const cancelledRegistrations = registrations.filter(reg => 
    reg.event_status === 'cancelled'
  );

  return (
    <PageContainer>
      <div className="mb-12">
        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-primary-50 text-primary-700 text-[10px] font-black uppercase tracking-widest mb-3 border border-primary-100">
          Participant Portal
        </div>
        <h1 className="text-4xl font-semibold font-black text-gray-900 tracking-tighter">My Registrations</h1>
        <p className="text-gray-500 font-medium mt-2">Manage your upcoming event participations.</p>
      </div>

      {loading ? (
        <div className="py-20"><Loader /></div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100 p-16 text-center">
          <div className="bg-gray-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Bookmark className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">No registrations found</h3>
          <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">
            You haven't registered for any events yet. Explore our latest events and join the university community!
          </p>
          <Link to="/">
            <Button className="shadow-primary-100 shadow-xl">Browse Events</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-16">
          {/* Active Registrations */}
          {activeRegistrations.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center">
                Upcoming Participations
                <span className="ml-4 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-black">
                  {activeRegistrations.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {activeRegistrations.map((reg) => (
                  <RegistrationCard key={reg.id} reg={reg} onCancel={handleCancel} actionLoading={actionLoading} />
                ))}
              </div>
            </div>
          )}

          {/* Cancelled Events */}
          {cancelledRegistrations.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-red-600 mb-8 flex items-center">
                Cancelled Events
                <span className="ml-4 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-black">
                  {cancelledRegistrations.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {cancelledRegistrations.map((reg) => (
                  <RegistrationCard key={reg.id} reg={reg} isCancelled />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastRegistrations.length > 0 && (
            <div className="opacity-75 grayscale-[30%] hover:opacity-100 hover:grayscale-0 transition-all duration-500">
              <h2 className="text-2xl font-black text-gray-400 mb-8 flex items-center">
                Past Events
                <span className="ml-4 px-3 py-1 rounded-full bg-gray-100 text-gray-400 text-xs font-black">
                  {pastRegistrations.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {pastRegistrations.map((reg) => (
                  <RegistrationCard key={reg.id} reg={reg} isPast />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

const RegistrationCard = ({ reg, onCancel, actionLoading, isCancelled, isPast }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatPrice = (price) => {
    return Number(price).toFixed(2).replace(/\.00$/, "");
  };

  return (
    <SectionCard className={`group transition-all flex flex-col ${isCancelled ? 'border-red-100 bg-red-50/10' : 'hover:border-primary-100'}`}>
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
              isCancelled 
                ? 'bg-red-50 text-red-700 border-red-100' 
                : isPast 
                  ? 'bg-gray-100 text-gray-600 border-gray-200' 
                  : 'bg-green-50 text-green-700 border-green-100'
            }`}>
              {isCancelled ? 'EVENT CANCELLED' : reg.status === 'confirmed' ? 'Confirmed' : reg.status}
            </span>
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
              reg.is_free_entry 
                ? 'bg-blue-50 text-blue-700 border-blue-100' 
                : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {reg.is_free_entry ? 'Free' : reg.ticket_price ? `${formatPrice(reg.ticket_price)} RON` : 'Paid'}
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Registered on {new Date(reg.registered_at).toLocaleDateString()}
          </p>
        </div>
        
        <h3 className={`text-xl font-semibold font-black transition-colors mb-4 leading-tight ${
          isCancelled ? 'text-gray-500' : 'text-gray-900 group-hover:text-primary-600'
        }`}>
          {reg.event_title}
        </h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm font-bold text-gray-600">
            <Calendar className="w-4 h-4 mr-3 text-gray-400" />
            {formatDate(reg.event_start_at)}
          </div>
          <div className="flex items-center text-sm font-bold text-gray-600">
            <Clock className="w-4 h-4 mr-3 text-gray-400" />
            {formatTime(reg.event_start_at)}
          </div>
          <div className="flex items-center text-sm font-bold text-gray-600">
            <MapPin className="w-4 h-4 mr-3 text-gray-400" />
            {reg.event_location} ({reg.event_participation_type})
          </div>
        </div>
      </div>
      
      <div className="flex space-x-3 pt-6 border-t border-gray-50">
        {!isPast && (
          <Link to={`/events/${reg.event_id}`} className="flex-grow">
            <Button variant={isCancelled ? "ghost" : "secondary"} className="w-full !py-2.5 text-xs">
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              View Details
            </Button>
          </Link>
        )}
        
        {isPast && !isCancelled && (
          <Link to={`/events/${reg.event_id}#feedback`} className="flex-grow">
            <Button variant="primary" className="w-full !py-2.5 text-xs">
              Leave Feedback
            </Button>
          </Link>
        )}

        {!isCancelled && !isPast && (
          <button 
            onClick={() => onCancel(reg.id)}
            disabled={actionLoading}
            className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all"
            title="Cancel Registration"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </SectionCard>
  );
};

export default MyRegistrationsPage;
