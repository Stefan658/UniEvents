import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import SectionCard from '../components/SectionCard';
import { getEventById, updateEventStatus, getAllEvents } from '../api/events';
import { registerForEvent, getEventRegistrations, cancelRegistration } from '../api/registrations';
import { getEventMaterials } from '../api/materials';
import { submitFeedback, getEventFeedback, getEventFeedbackSummary } from '../api/feedback';
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
  XCircle,
  Star,
  Globe,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

const EventDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated, role } = useAuth();
  const [event, setEvent] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [userRegistration, setUserRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState({ type: '', text: '' });
  const [allEvents, setAllEvents] = useState([]);
  
  // Feedback states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [userFeedback, setUserFeedback] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [allFeedback, setAllFeedback] = useState([]);

  const fetchRegistrations = async () => {
    try {
      const registrationsData = await getEventRegistrations(id);
      setRegistrations(registrationsData);

      if (isAuthenticated && user) {
        const myReg = Array.isArray(registrationsData) 
          ? registrationsData.find(r => r.user_id === user.id && r.status !== 'cancelled') 
          : null;
        setUserRegistration(myReg);
      }
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    }
  };

  const fetchUserFeedback = async () => {
    if (isAuthenticated && user) {
      try {
        const feedbacks = await getEventFeedback(id);
        const myFeedback = Array.isArray(feedbacks) 
          ? feedbacks.find(f => f.user_id === user.id) 
          : null;
        setUserFeedback(myFeedback);
      } catch (err) {
        console.error('Failed to fetch user feedback:', err);
      }
    }
  };

  const fetchFeedbackData = async () => {
    try {
      const [summary, feedbackList] = await Promise.all([
        getEventFeedbackSummary(id),
        getEventFeedback(id)
      ]);
      setFeedbackSummary(summary);
      setAllFeedback(Array.isArray(feedbackList) ? feedbackList : []);
    } catch (err) {
      console.error('Failed to fetch feedback data:', err);
    }
  };

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventData, materialsData] = await Promise.all([
          getEventById(id),
          getEventMaterials(id)
        ]);
        setEvent(eventData);
        setMaterials(materialsData);
        
        const promises = [
          fetchRegistrations(),
          fetchUserFeedback(),
          fetchFeedbackData()
        ];

        if (role === 'admin') {
          promises.push(getAllEvents().then(setAllEvents));
        }

        await Promise.all(promises);
      } catch (err) {
        setError(err?.response?.data?.error || err?.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [id, isAuthenticated, role, user]);

  const checkConflicts = () => {
    if (!event || !event.start_at || !event.end_at || !event.location || allEvents.length === 0) return { warning: [], blocking: [] };
    
    const startA = new Date(event.start_at).getTime();
    const endA = new Date(event.end_at).getTime();
    const locA = event.location.trim().toLowerCase();
    
    const overlaps = allEvents.filter(other => {
      if (other.id === event.id) return false;
      if (!other.start_at || !other.end_at || !other.location) return false;
      if (['rejected', 'cancelled'].includes(other.status)) return false;
      
      const locB = other.location.trim().toLowerCase();
      if (locA !== locB) return false;
      
      const startB = new Date(other.start_at).getTime();
      const endB = new Date(other.end_at).getTime();
      return startA < endB && endA > startB;
    });

    return {
      warning: overlaps.filter(o => o.status === 'pending'),
      blocking: overlaps.filter(o => ['published', 'active'].includes(o.status))
    };
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      setRegistrationMessage({ type: 'error', text: 'Please log in to register for events.' });
      return;
    }

    setActionLoading(true);
    setRegistrationMessage({ type: '', text: '' });
    try {
      const response = await registerForEvent(user.id, event.id);
      
      // Refresh registrations to update available slots and user status
      await fetchRegistrations();
      
      let message = 'Registration successful.';
      if (response.email_status === 'sent') {
        message += ' Confirmation email sent.';
      } else if (response.email_status === 'skipped') {
        message += ' Email confirmation is not configured in this environment.';
      } else if (response.email_status === 'failed') {
        message += ' Confirmation email could not be sent.';
      }
      
      setRegistrationMessage({ type: 'success', text: message });
      
      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setRegistrationMessage({ type: '', text: '' });
      }, 5000);
    } catch (err) {
      setRegistrationMessage({ type: 'error', text: err || 'Registration failed.' });
      // Also auto-hide error messages after 5 seconds
      setTimeout(() => {
        setRegistrationMessage({ type: '', text: '' });
      }, 5000);
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
      const response = await cancelRegistration(userRegistration.id);
      
      // Refresh registrations to update available slots and user status
      await fetchRegistrations();
      
      let message = 'Registration cancelled.';
      if (response.email_status === 'sent') {
        message += ' Cancellation email sent.';
      } else if (response.email_status === 'skipped') {
        message += ' Email cancellation is not configured in this environment.';
      } else if (response.email_status === 'failed') {
        message += ' Cancellation email could not be sent.';
      }
      
      setRegistrationMessage({ type: 'success', text: message });
      
      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setRegistrationMessage({ type: '', text: '' });
      }, 5000);
    } catch (err) {
      setRegistrationMessage({ type: 'error', text: err || 'Cancellation failed.' });
      // Also auto-hide error messages after 5 seconds
      setTimeout(() => {
        setRegistrationMessage({ type: '', text: '' });
      }, 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    
    setFeedbackLoading(true);
    setFeedbackMessage({ type: '', text: '' });
    
    try {
      const payload = {
        user_id: user.id,
        event_id: parseInt(id),
        rating: rating,
        comment: comment
      };
      
      const response = await submitFeedback(payload);
      setUserFeedback(response);
      setFeedbackMessage({ type: 'success', text: 'Thank you for your feedback!' });
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: err || 'Failed to submit feedback.' });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleAdminStatusUpdate = async (status) => {
    let confirmMsg = `Are you sure you want to ${status === 'published' ? 'approve' : 'reject'} this event?`;
    if (status === 'cancelled') confirmMsg = 'Are you sure you want to cancel this published event? This will notify participants.';

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(true);
    setRegistrationMessage({ type: '', text: '' });
    try {
      const updatedEvent = await updateEventStatus(id, status);
      setEvent(updatedEvent);
      
      let successMsg = `Event ${status === 'published' ? 'approved and published' : 'rejected'} successfully.`;
      if (status === 'cancelled') successMsg = 'Event cancelled successfully.';

      setRegistrationMessage({ 
        type: 'success', 
        text: successMsg
      });

      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setRegistrationMessage({ type: '', text: '' });
      }, 5000);
    } catch (err) {
      setRegistrationMessage({ type: 'error', text: err || 'Failed to update event status.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareEvent = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setRegistrationMessage({ type: 'success', text: 'Event link copied to clipboard.' });
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (err) {
      setRegistrationMessage({ type: 'error', text: 'Could not copy the link. Please copy it manually from the address bar.' });
    }

    // Auto-hide message after 5 seconds
    setTimeout(() => {
      setRegistrationMessage({ type: '', text: '' });
    }, 5000);
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

  const isCancelled = event.status === 'cancelled';

  const canSeeMeetingLink = 
    !isCancelled && (
      role === 'admin' || 
      role === 'organizer' || 
      (isAuthenticated && userRegistration)
    );

  const isPastEvent = new Date(event.end_at) < new Date();

  const confirmedCount = Array.isArray(registrations) 
    ? registrations.filter(r => r.status === 'confirmed' || r.status === 'pending').length 
    : 0;

  const availableSlots = event.max_participants !== null && event.max_participants !== undefined
    ? Math.max(0, event.max_participants - confirmedCount) 
    : 'Unlimited';

  const isPaidEvent = event?.is_free_entry === false;

  const hasTicketPrice =
    event?.ticket_price !== null &&
    event?.ticket_price !== undefined &&
    Number(event.ticket_price) > 0;

  const formattedTicketPrice = hasTicketPrice
    ? Number(event.ticket_price).toFixed(2).replace(/\.00$/, "")
    : null;

  const ctaButtonText = event?.is_free_entry ? 'Register Now' : 'Reserve Spot';

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

              <h1 className="text-4xl md:text-5xl font-semibold font-black text-gray-900 tracking-tighter leading-tight mb-8">
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
                <h3 className="text-xl font-semibold font-black text-gray-900 mb-4 tracking-tight">About this event</h3>
                <div className="text-gray-600 leading-relaxed font-medium whitespace-pre-wrap text-lg">
                  {event.description}
                </div>
              </div>
            </div>
          </div>

          {/* Online Access Section */}
          {(event.participation_type === 'online' || event.participation_type === 'hybrid') && event.online_meeting_url && (
            <div className="bg-primary-600 rounded-[2rem] p-8 text-white shadow-soft-lg shadow-primary-200 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-xl font-black">Online Access</h4>
                </div>
                
                <p className="text-blue-100 font-medium text-sm mb-6 leading-relaxed">
                  This event has an online component on <span className="font-bold text-white capitalize">{event.online_platform}</span>.
                </p>

                {canSeeMeetingLink ? (
                  <a 
                    href={event.online_meeting_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full bg-white text-blue-600 font-bold py-3 px-6 rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                  >
                    Join Online Event
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                ) : (
                  <div className="bg-blue-700/50 backdrop-blur-sm border border-blue-400/30 rounded-2xl p-4">
                    <p className="text-xs font-bold text-blue-100 text-center">
                      {!isAuthenticated 
                        ? "Login/Register to unlock the meeting link" 
                        : "Register to unlock the meeting link"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Community Feedback Section */}
          <SectionCard title="Community Feedback" className="!bg-gradient-to-br from-white to-gray-50/30">
            {feedbackSummary && feedbackSummary.total_feedbacks > 0 ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[2rem] bg-gray-50/50 border border-gray-100">
                  <div className="text-center md:border-r md:border-gray-200 md:pr-10">
                    <p className="text-5xl font-black text-gray-900 tracking-tighter mb-1">
                      {feedbackSummary.average_rating || '0.0'}
                    </p>
                    <div className="flex justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.round(feedbackSummary.average_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Average Rating</p>
                  </div>
                  
                  <div className="grid grid-cols-3 flex-grow gap-4 text-center md:text-left md:pl-4">
                    <div>
                      <p className="text-2xl font-black text-gray-900">{feedbackSummary.total_feedbacks}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Reviews</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">{feedbackSummary.max_rating || '-'}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Highest</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">{feedbackSummary.min_rating || '-'}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lowest</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Recent Comments</h4>
                  {allFeedback.filter(f => f.comment).length > 0 ? (
                    allFeedback.filter(f => f.comment).map((f) => (
                      <div key={f.id} className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="bg-primary-50 p-1.5 rounded-lg">
                              <User className="w-3.5 h-3.5 text-primary-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-900">{f.user_full_name || 'Participant'}</span>
                          </div>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${i < f.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm font-medium leading-relaxed italic">"{f.comment}"</p>
                        <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-tighter">
                          {new Date(f.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 font-medium italic ml-1">No written reviews yet.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-6">
                <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-400 font-bold text-lg tracking-tight">No feedback yet</p>
                <p className="text-gray-400 text-sm font-medium mt-1">Be the first to share your experience after the event!</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8 sticky top-24 self-start">
          <SectionCard className="!p-0 overflow-hidden">
            <div className="p-8 pb-4">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Registration</h3>
              <p className="text-gray-500 font-medium text-sm mb-4">Join this event to get full access and updates.</p>
              {!event.is_free_entry && (
                <div className="flex flex-col space-y-1 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-3xl font-black text-primary-600 tracking-tighter">
                    {formattedTicketPrice ? `${formattedTicketPrice} RON` : 'Not specified'}
                  </p>
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    Payment processing is not available yet. Registration reserves your spot.
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-8 pb-8 pt-4">
              {isCancelled ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-[2rem] bg-red-50 border border-red-100 text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-40" />
                    <p className="font-black text-red-900 mb-2 text-lg leading-tight">Event Cancelled</p>
                    <p className="text-sm font-medium text-red-700 leading-relaxed">
                      This event was cancelled due to unforeseen reasons. We apologize for the inconvenience.
                    </p>
                  </div>
                  <Button variant="ghost" className="w-full" onClick={handleShareEvent}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Event
                  </Button>
                </div>
              ) : (
                <>
                  {/* Admin Moderation Actions (Independent) */}
                  {role === 'admin' && (
                    <div className="mb-6 space-y-4">
                      {(event.status === 'published' || event.status === 'active') && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mb-2">Moderation Actions</p>
                          <Button 
                            variant="secondary"
                            className="w-full !py-3 text-red-600 border-red-100 hover:bg-red-50"
                            onClick={() => handleAdminStatusUpdate('cancelled')}
                            isLoading={actionLoading}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Cancel Event
                          </Button>
                        </div>
                      )}

                      {event.status === 'pending' && (
                        <div className="space-y-3">
                          {(() => {
                            const { warning, blocking } = checkConflicts();
                            return (
                              <>
                                {blocking.length > 0 && (
                                  <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start space-x-3">
                                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-red-700 leading-relaxed">
                                      Cannot approve: overlaps with published event '{blocking[0].title}'.
                                    </p>
                                  </div>
                                )}
                                {blocking.length === 0 && warning.length > 0 && (
                                  <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start space-x-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold text-amber-700 leading-relaxed">
                                      Warning: overlaps with {warning.length} other pending event(s).
                                    </p>
                                  </div>
                                )}
                                
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 text-center mb-2">Moderation Actions</p>
                                <Button 
                                  className="w-full !py-3 bg-green-600 hover:bg-green-700 shadow-green-100"
                                  onClick={() => handleAdminStatusUpdate('published')}
                                  isLoading={actionLoading}
                                  disabled={blocking.length > 0}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" /> Approve & Publish
                                </Button>
                                <Button 
                                  variant="secondary"
                                  className="w-full !py-3 text-red-600 border-red-100 hover:bg-red-50"
                                  onClick={() => handleAdminStatusUpdate('rejected')}
                                  isLoading={actionLoading}
                                >
                                  <XCircle className="w-4 h-4 mr-2" /> Reject Event
                                </Button>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      <div className="border-b border-gray-100 pt-2"></div>
                    </div>
                  )}

                  {/* Registration Logic */}
                  {event.requires_registration ? (
                    <>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 mb-6">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="font-bold text-gray-700">Available Slots</span>
                        </div>
                        <span className="text-primary-600 font-black">
                          {availableSlots}
                        </span>
                      </div>

                      {!isPastEvent ? (
                        <div className="space-y-4">
                          {!isAuthenticated ? (
                            <div className="space-y-4">
                              <p className="text-sm font-bold text-gray-600 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200 text-center leading-relaxed">
                                Sign in to reserve your spot for this event. Available for students and professors.
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
                                  disabled={availableSlots === 0}
                                >
                                  {availableSlots === 0 ? 'Sold Out' : ctaButtonText}
                                </Button>
                              )}
                            </>
                          ) : (
                            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-center">
                              <p className="text-sm font-bold text-blue-700 leading-relaxed">
                                {role === 'admin' ? 'Admin View' : 'Organizer View'}
                              </p>
                              <p className="text-xs font-medium text-blue-600 mt-1">
                                Registration is only available for university participants.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="p-4 rounded-2xl bg-gray-100 text-gray-500 text-center font-bold">
                            Registration Closed
                          </div>
                          
                          {/* Feedback Section for Past Events */}
                          <div className="pt-6 border-t border-gray-100">
                            <h4 className="text-lg font-semibold font-black text-gray-900 mb-4 tracking-tight">Event Feedback</h4>
                            
                            {!isAuthenticated ? (
                              <p className="text-sm font-medium text-gray-500 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                                Please <Link to="/login" className="text-primary-600 font-bold hover:underline">log in</Link> to share your feedback about this event.
                              </p>
                            ) : role !== 'student' ? (
                              <p className="text-sm font-medium text-gray-500 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                                Feedback is available only for registered participants.
                              </p>
                            ) : !userRegistration ? (
                              <p className="text-sm font-medium text-gray-500 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                                Feedback is available only for registered participants.
                              </p>
                            ) : userFeedback ? (
                              <div className="p-4 rounded-2xl bg-primary-50 border border-primary-100">
                                <div className="flex items-center mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-4 h-4 ${i < userFeedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                                <p className="text-xs font-black uppercase tracking-widest text-primary-700 mb-2">Your Feedback</p>
                                <p className="text-sm font-medium text-gray-700 italic">"{userFeedback.comment || 'No comment provided.'}"</p>
                              </div>
                            ) : (
                              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                                <div>
                                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Rating</label>
                                  <div className="flex space-x-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <button
                                        key={s}
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className="focus:outline-none transition-transform active:scale-90"
                                      >
                                        <Star 
                                          className={`w-6 h-6 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Your Thoughts</label>
                                  <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="What did you think of the event?"
                                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all min-h-[100px]"
                                  />
                                </div>
                                <Button 
                                  type="submit" 
                                  className="w-full !py-3 shadow-lg shadow-primary-100"
                                  isLoading={feedbackLoading}
                                >
                                  Submit Feedback
                                </Button>
                              </form>
                            )}
                            
                            {feedbackMessage.text && (
                              <div className={`mt-4 p-4 rounded-2xl flex items-start space-x-3 ${
                                feedbackMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {feedbackMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                                <p className="text-sm font-bold">{feedbackMessage.text}</p>
                              </div>
                            )}
                          </div>
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

                  {registrationMessage.text && (
                    <div className={`mt-4 p-4 rounded-2xl flex items-start space-x-3 ${
                      registrationMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {registrationMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                      <p className="text-sm font-bold">{registrationMessage.text}</p>
                    </div>
                  )}

                  <Button variant="ghost" className="w-full mt-4" onClick={handleShareEvent}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Event
                  </Button>
                </>
              )}
            </div>
          </SectionCard>

          {role === 'student' && (
            <div className="bg-blue-900 rounded-[2rem] p-8 text-white shadow-soft-lg shadow-blue-200 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
              <h4 className="text-xl font-black mb-2 relative z-10">Need help?</h4>
              <p className="text-blue-100/80 font-medium text-sm mb-6 relative z-10 leading-relaxed">
                If you have any questions about this event, please contact the organizer or visit our help center.
              </p>
              <Link to={`/support?eventId=${id}`} className="inline-flex items-center text-sm font-bold bg-white text-blue-900 px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors relative z-10">
                Contact Us
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default EventDetailsPage;
