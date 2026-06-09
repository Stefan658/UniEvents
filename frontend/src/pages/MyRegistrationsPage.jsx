import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Button from '../components/Button';
import { getMyRegistrations, cancelRegistration, getMyBadges } from '../api/registrations';
import { Calendar, MapPin, Clock, ExternalLink, XCircle, Bookmark, LayoutGrid, List, Trophy, Heart, Briefcase, Code, MessageSquare, Dumbbell, Award, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeEvent } from '../utils/localizeEvent';

const ICON_MAP = {
  Trophy,
  Heart,
  Briefcase,
  Code,
  MessageSquare,
  Dumbbell,
  Award
};

const MyRegistrationsPage = () => {
  const { language, t } = useLanguage();
  const [registrations, setRegistrations] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regsData, badgesData] = await Promise.all([
        getMyRegistrations(),
        getMyBadges().catch(err => {
          console.error("Failed to fetch badges", err);
          return [];
        })
      ]);
      setRegistrations(regsData);
      setBadges(badgesData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancel = async (regId) => {
    if (!window.confirm(t('registrations.cancelConfirm'))) return;

    setActionLoading(true);
    try {
      await cancelRegistration(regId);
      setRegistrations(registrations.filter(r => r.id !== regId));
    } catch (err) {
      alert(err || t('registrations.cancelFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString(language === 'ro' ? 'ro-RO' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const waitlistedRegistrations = registrations.filter(reg => 
    (reg.event_status === 'published' || reg.event_status === 'active') && 
    new Date(reg.event_start_at) >= new Date() &&
    reg.status === 'waitlisted'
  );

  const activeRegistrations = registrations.filter(reg => 
    (reg.event_status === 'published' || reg.event_status === 'active') && 
    new Date(reg.event_start_at) >= new Date() &&
    reg.status !== 'waitlisted'
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
          {t('registrations.portal')}
        </div>
        <h1 className="text-4xl font-semibold font-black text-gray-900 tracking-tighter">{t('registrations.title')}</h1>
        <p className="text-gray-500 font-medium mt-2">{t('registrations.subtitle')}</p>
      </div>

      {!loading && !error && registrations.length > 0 && (
        <div className="flex mb-12">
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
              {t('registrations.viewCards')}
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
              {t('registrations.viewList')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-20"><Loader /></div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-soft border border-gray-100 p-16 text-center">
          <div className="bg-gray-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Bookmark className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">{t('registrations.noRegistrations')}</h3>
          <p className="text-gray-500 font-medium mb-8 max-w-md mx-auto">
            {t('registrations.noRegistrationsDesc')}
          </p>
          <Link to="/">
            <Button className="shadow-primary-100 shadow-xl">{t('registrations.browseEvents')}</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-16">

          {/* Badges Section */}
          {badges.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center">
                <Award className="w-6 h-6 mr-3 text-yellow-500" />
                {t('registrations.badgesTitle')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {badges.map((badge) => {
                  const IconComponent = ICON_MAP[badge.icon] || Award;
                  return (
                    <div 
                      key={badge.code} 
                      className={`relative overflow-hidden rounded-3xl border p-6 transition-all ${
                        badge.earned 
                          ? 'bg-gradient-to-br from-white to-amber-50/30 border-amber-200 shadow-soft hover:shadow-md' 
                          : 'bg-gray-50 border-gray-100 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${badge.earned ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-400'}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-black uppercase tracking-wider ${badge.earned ? 'text-amber-600' : 'text-gray-400'}`}>
                            {badge.earned ? t('registrations.earned') : t('registrations.locked')}
                          </span>
                          <p className="text-xs font-bold text-gray-400 mt-1">
                            {badge.progress} / {badge.target}
                          </p>
                        </div>
                      </div>
                      
                      <h3 className={`text-lg font-black mb-1 ${badge.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                        {t(`registrations.badges.${badge.code}.title`)}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium mb-4 leading-relaxed">
                        {t(`registrations.badges.${badge.code}.description`)}
                      </p>

                      {badge.earned && badge.reward && (
                        <div className="mt-auto pt-4 border-t border-amber-100/50">
                          <p className="text-xs font-bold text-amber-700 flex items-center">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                            {t(`registrations.badges.${badge.code}.reward`)}
                          </p>
                        </div>
                      )}
                      
                      {/* Progress Bar for Locked Badges */}
                      {!badge.earned && (
                        <div className="mt-auto pt-4 border-t border-gray-200/50">
                           <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-gray-400 h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min((badge.progress / badge.target) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Waitlisted Events */}
          {waitlistedRegistrations.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-amber-600 mb-8 flex items-center">
                {t('registrations.waitlistedTitle')}
                <span className="ml-4 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-black">
                  {waitlistedRegistrations.length}
                </span>
              </h2>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'flex flex-col gap-6'}>
                {waitlistedRegistrations.map((reg) => (
                  <RegistrationCard 
                    key={reg.id} 
                    reg={reg} 
                    onCancel={handleCancel} 
                    actionLoading={actionLoading} 
                    variant={viewMode === 'list' ? 'row' : 'card'} 
                    isWaitlisted 
                    isNearby={reg.organizer_email?.startsWith('nearby.')}
                    language={language}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Active Registrations */}
          {activeRegistrations.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center">
                {t('registrations.upcomingTitle')}
                <span className="ml-4 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-black">
                  {activeRegistrations.length}
                </span>
              </h2>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'flex flex-col gap-6'}>
                {activeRegistrations.map((reg) => (
                  <RegistrationCard 
                    key={reg.id} 
                    reg={reg} 
                    onCancel={handleCancel} 
                    actionLoading={actionLoading} 
                    variant={viewMode === 'list' ? 'row' : 'card'} 
                    isNearby={reg.organizer_email?.startsWith('nearby.')}
                    language={language}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cancelled Events */}
          {cancelledRegistrations.length > 0 && (
            <div>
              <h2 className="text-2xl font-black text-red-600 mb-8 flex items-center">
                {t('registrations.cancelledTitle')}
                <span className="ml-4 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-black">
                  {cancelledRegistrations.length}
                </span>
              </h2>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'flex flex-col gap-6'}>
                {cancelledRegistrations.map((reg) => (
                  <RegistrationCard 
                    key={reg.id} 
                    reg={reg} 
                    isCancelled 
                    variant={viewMode === 'list' ? 'row' : 'card'} 
                    isNearby={reg.organizer_email?.startsWith('nearby.')}
                    language={language}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {pastRegistrations.length > 0 && (
            <div className="opacity-75 grayscale-[30%] hover:opacity-100 hover:grayscale-0 transition-all duration-500">
              <h2 className="text-2xl font-black text-gray-400 mb-8 flex items-center">
                {t('registrations.pastTitle')}
                <span className="ml-4 px-3 py-1 rounded-full bg-gray-100 text-gray-400 text-xs font-black">
                  {pastRegistrations.length}
                </span>
              </h2>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'flex flex-col gap-6'}>
                {pastRegistrations.map((reg) => (
                  <RegistrationCard 
                    key={reg.id} 
                    reg={reg} 
                    isPast 
                    variant={viewMode === 'list' ? 'row' : 'card'} 
                    isNearby={reg.organizer_email?.startsWith('nearby.')}
                    language={language}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
};

const RegistrationCard = ({ reg, onCancel, actionLoading, isCancelled, isPast, isWaitlisted, isNearby, variant = 'card', language, t }) => {
  const isRow = variant === 'row';

  // Use localizeEvent for rendering
  const displayEvent = localizeEvent({
    title: reg.event_title,
    description: reg.event_description, // assuming these are in the reg object
    category_name: reg.event_category_name
  }, language);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString(language === 'ro' ? 'ro-RO' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatPrice = (price) => {
    return Number(price).toFixed(2).replace(/\.00$/, "");
  };

  return (
    <SectionCard className={`group transition-all flex flex-col ${isRow ? 'md:flex-row md:items-center' : ''} ${
      isCancelled 
        ? 'border-red-100 bg-red-50/10' 
        : isWaitlisted 
          ? 'border-amber-100 bg-amber-50/10' 
          : isNearby
            ? 'border-indigo-100 bg-indigo-50/30'
            : 'hover:border-primary-100'
    }`}>
      <div className={`flex-grow ${isRow ? 'md:flex md:items-center md:gap-8' : ''}`}>
        <div className={`${isRow ? 'md:w-1/4 md:shrink-0' : 'flex justify-between items-start mb-4'}`}>
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
              isCancelled 
                ? 'bg-red-50 text-red-700 border-red-100' 
                : isWaitlisted
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : isPast 
                    ? 'bg-gray-100 text-gray-600 border-gray-200' 
                    : 'bg-green-50 text-green-700 border-green-100'
            }`}>
              {isCancelled ? t('registrations.eventCancelled') : isWaitlisted ? t('registrations.waitlisted') : reg.status === 'confirmed' ? t('registrations.confirmed') : reg.status}
            </span>
            {isNearby && (
              <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 border border-indigo-200/50">
                <MapPin className="w-3 h-3 mr-1 inline-block -translate-y-px" />
                {t('eventCard.outsideCampus')}
              </span>
            )}
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
              reg.is_free_entry 
                ? 'bg-blue-50 text-blue-700 border-blue-100' 
                : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {reg.is_free_entry ? t('eventCard.free') : reg.ticket_price ? `${formatPrice(reg.ticket_price)} RON` : t('eventCard.paid')}
            </span>
          </div>
          {!isRow && (
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {t('registrations.registeredOn')} {new Date(reg.registered_at).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US')}
            </p>
          )}
        </div>
        
        <div className={isRow ? 'md:flex-grow' : ''}>
          <h3 className={`text-xl font-semibold font-black transition-colors ${isRow ? 'mb-2' : 'mb-4'} leading-tight ${
            isCancelled ? 'text-gray-500' : 'text-gray-900 group-hover:text-primary-600'
          }`}>
            {displayEvent.title}
          </h3>
          
          <div className={`${isRow ? 'flex flex-wrap gap-x-6 gap-y-2' : 'space-y-3 mb-6'}`}>
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
              {reg.event_location} ({t('home.' + reg.event_participation_type)})
            </div>
            {isRow && (
              <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                {t('registrations.registeredOn')}: {new Date(reg.registered_at).toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US')}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className={`flex items-center space-x-3 ${isRow ? 'mt-6 md:mt-0 md:pl-6 md:border-l border-gray-100 shrink-0 md:w-[220px] md:justify-end' : 'pt-6 border-t border-gray-50'}`}>
        {!isPast && (
          <Link to={`/events/${reg.event_id}`} className={isRow ? "" : "flex-grow"}>
            <Button variant={isCancelled ? "ghost" : "secondary"} className={`${isRow ? "px-6" : "w-full"} !py-2.5 text-xs whitespace-nowrap`}>
              <ExternalLink className="w-3.5 h-3.5 mr-2" />
              {t('registrations.viewDetails')}
            </Button>
          </Link>
        )}
        
        {isPast && !isCancelled && (
          <Link to={`/events/${reg.event_id}#feedback`} className={isRow ? "" : "flex-grow"}>
            <Button variant="primary" className={`${isRow ? "px-6" : "w-full"} !py-2.5 text-xs whitespace-nowrap`}>
              {reg.has_feedback ? t('registrations.seeYourFeedback') : t('registrations.leaveFeedback')}
            </Button>
          </Link>
        )}

        {!isCancelled && !isPast && (
          <button 
            onClick={() => onCancel(reg.id)}
            disabled={actionLoading}
            className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-all shrink-0"
            title={t('registrations.cancelTooltip')}
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </SectionCard>
  );
};

export default MyRegistrationsPage;
