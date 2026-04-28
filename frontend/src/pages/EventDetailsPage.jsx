import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import SectionCard from '../components/SectionCard';
import { getEventById } from '../api/events';
import { registerForEvent, getEventRegistrations, cancelRegistration } from '../api/registrations';
import { getEventMaterials } from '../api/materials';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  MapPin, 
  User, 
  Tag, 
  Users, 
  Clock, 
  CheckCircle, 
  Download, 
  FileText,
  AlertCircle,
  Share2,
  ChevronLeft,
  XCircle
} from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated, role } = useAuth();
  const [event, setEvent] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [userRegistration, setUserRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventData, materialsData] = await Promise.all([
          getEventById(id),
          getEventMaterials(id)
        ]);
        setEvent(eventData);
        setMaterials(materialsData);

        // If authenticated as student, check if already registered
        if (isAuthenticated && role === 'student' && user) {
          const registrations = await getEventRegistrations(id);
          const myReg = Array.isArray(registrations) 
            ? registrations.find(r => r.user_id === user.id) 
            : null;
          setUserRegistration(myReg);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, isAuthenticated, role, user]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
      setRegistrationMessage({ type: 'error', text: 'Please log in to register for events.' });
      return;
    }

    setActionLoading(true);
    setRegistrationMessage({ type: '', text: '' });
    try {
      const newReg = await registerForEvent(user.id, event.id);
      setUserRegistration(newReg);
      setRegistrationMessage({ type: 'success', text: 'Registration successful!' });
    } catch (err) {
      setRegistrationMessage({ type: 'error', text: err || 'Registration failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!userRegistration) return;
    
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;

    setActionLoading(true);
    setRegistrationMessage({ type: '', text: '' });
    try {
      await cancelRegistration(userRegistration.id);
      setUserRegistration(null);
      setRegistrationMessage({ type: 'success', text: 'Registration cancelled.' });
    } catch (err) {
      setRegistrationMessage({ type: 'error', text: err || 'Cancellation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) return <PageContainer><div className="py-20"><Loader /></div></PageContainer>;
  if (error) return <PageContainer><ErrorMessage message={error} /></PageContainer>;
  if (!event) return <PageContainer><ErrorMessage message="Event not found." /></PageContainer>;

  const isPastEvent = new Date(event.end_at) < new Date();

  return (
    <PageContainer>
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary-600 font-bold text-sm mb-8 group transition-colors">
        <div className="bg-white p-1.5 rounded-lg border border-gray-100 mr-2 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all">
          <ChevronLeft className="w-4 h-4" />
        </div>
        Back to Events
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Event Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="relative overflow-hidden bg-white rounded-[2.5rem] shadow-soft border border-gray-100/50 p-8 md:p-12">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Calendar className="w-64 h-64 -mr-16 -mt-16" />
            </div>
            
            <div className="relative">
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest bg-primary-50 text-primary-700 border border-primary-100/50">
                  <Tag className="w-3.5 h-3.5 mr-2" />
                  {event.category_name}
                </span>
                {event.is_free_entry && (
                  <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-100/50">
                    Free Entry
                  </span>
                )}
                {isPastEvent && (
                  <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                    Past Event
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight mb-8">
                {event.title}
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Date</p>
                    <p className="font-bold text-gray-900">{formatDate(event.start_at)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-50 p-3 rounded-2xl text-purple-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Time</p>
                    <p className="font-bold text-gray-900">{formatTime(event.start_at)} - {formatTime(event.end_at)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Location</p>
                    <p className="font-bold text-gray-900">{event.location}</p>
                    <p className="text-sm text-gray-500 font-medium capitalize">{event.participation_type}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-50 p-3 rounded-2xl text-green-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Organizer</p>
                    <p className="font-bold text-gray-900">{event.organizer_full_name}</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-blue max-w-none">
                <h3 className="text-xl font-black text-gray-900 mb-4 tracking-tight">About this event</h3>
                <div className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap text-lg">
                  {event.description}
                </div>
              </div>
            </div>
          </div>

          {materials.length > 0 && (
            <SectionCard title="Event Materials" className="!bg-gradient-to-br from-white to-gray-50/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map((material) => (
                  <a 
                    key={material.id}
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group"
                  >
                    <div className="bg-gray-50 p-3 rounded-xl mr-4 group-hover:bg-primary-50 transition-colors">
                      <FileText className="w-6 h-6 text-gray-400 group-hover:text-primary-500" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-bold text-gray-900 truncate">{material.file_name}</p>
                      <p className="text-xs font-black uppercase tracking-widest text-gray-400">{material.file_type.split('/')[1] || 'document'}</p>
                    </div>
                    <Download className="w-5 h-5 text-gray-300 group-hover:text-primary-500 ml-2" />
                  </a>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8">
          <SectionCard className="!p-0 overflow-hidden sticky top-24">
            <div className="p-8 pb-4">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Registration</h3>
              <p className="text-gray-500 font-medium text-sm">Join this event to get full access and updates.</p>
            </div>
            
            <div className="px-8 pb-8 pt-4">
              {event.requires_registration ? (
                <>
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 mb-6">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="font-bold text-gray-700">Available Slots</span>
                    </div>
                    <span className="text-primary-600 font-black">
                      {event.max_participants ? event.max_participants : 'Unlimited'}
                    </span>
                  </div>

                  {!isPastEvent ? (
                    <div className="space-y-4">
                      {/* Role-based Registration Actions */}
                      {!isAuthenticated ? (
                        <div className="space-y-4">
                          <p className="text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 text-center leading-relaxed">
                            Sign in to reserve your spot for this event.
                          </p>
                          <Link to="/login" state={{ from: { pathname: `/events/${id}` } }}>
                            <Button className="w-full !py-4 shadow-primary-200 shadow-xl mt-2">
                              Sign In to Register
                            </Button>
                          </Link>
                        </div>
                      ) : role === 'student' ? (
                        <>
                          {userRegistration ? (
                            <div className="space-y-4">
                              <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                                <p className="text-sm font-bold text-green-700">You are registered!</p>
                              </div>
                              <Button 
                                variant="secondary"
                                className="w-full !py-4 border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 transition-all"
                                onClick={handleCancel}
                                isLoading={actionLoading}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Registration
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              className="w-full !py-4 !text-base shadow-primary-200 shadow-xl"
                              onClick={handleRegister}
                              isLoading={actionLoading}
                            >
                              Register Now
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                          <p className="text-sm font-bold text-blue-700 leading-relaxed">
                            {role === 'admin' ? 'Admin View' : 'Organizer View'}
                          </p>
                          <p className="text-xs font-medium text-blue-600 mt-1">
                            Registration is only available for students.
                          </p>
                        </div>
                      )}

                      <Button variant="ghost" className="w-full">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Event
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-gray-100 text-gray-500 text-center font-bold">
                      Registration Closed
                    </div>
                  )}

                  {registrationMessage.text && (
                    <div className={`mt-4 p-4 rounded-2xl flex items-start space-x-3 ${
                      registrationMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {registrationMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                      <p className="text-sm font-bold">{registrationMessage.text}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-gray-900 mb-1">No registration required</p>
                  <p className="text-sm text-gray-500 font-medium">Just show up at the location!</p>
                </div>
              )}
            </div>
          </SectionCard>

          <div className="bg-primary-600 rounded-[2rem] p-8 text-white shadow-soft-lg shadow-primary-200 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            <h4 className="text-xl font-black mb-2 relative z-10">Need help?</h4>
            <p className="text-primary-100 font-medium text-sm mb-6 relative z-10 leading-relaxed">
              If you have any questions about this event, please contact the organizer or visit our help center.
            </p>
            <Link to={`/support?eventId=${id}`} className="inline-flex items-center text-sm font-bold bg-white text-primary-600 px-6 py-2.5 rounded-xl hover:bg-primary-50 transition-colors relative z-10">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default EventDetailsPage;
