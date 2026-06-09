import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Info, AlertTriangle, Calendar as CalendarIcon, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyRegistrations } from '../api/registrations';
import { generateNotifications } from '../utils/notificationUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeEvent } from '../utils/localizeEvent';

const NotificationBell = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const userId = user?.id || 'student';
  const STORAGE_KEY = `unievents_read_notifications_${userId}`;

  // Load read state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setReadIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load read notifications from localStorage', e);
    }
  }, [STORAGE_KEY]);

  // Fetch registrations and generate notifications
  const fetchAndGenerateNotifications = async () => {
    setLoading(true);
    try {
      const registrations = await getMyRegistrations();
      const generated = generateNotifications(registrations);
      setNotifications(generated);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAndGenerateNotifications();
  }, []);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const newReadIds = [...readIds, id];
      setReadIds(newReadIds);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newReadIds));
    }
  };

  const markAllAsRead = (e) => {
    e.stopPropagation();
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    navigate(notification.link);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'waitlisted':
        return <Info className="w-5 h-5 text-amber-500" />;
      case 'feedback_missing':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'event_today':
      case 'event_tomorrow':
        return <CalendarIcon className="w-5 h-5 text-primary-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getMessageForType = (notification) => {
    // Localize the event title for display
    const localizedEvent = localizeEvent({ title: notification.eventTitle }, language);
    const titleToDisplay = localizedEvent.title || notification.eventTitle;
    
    // Get the base translation string
    const baseMessage = t(`notifications.types.${notification.type}`);
    
    // Fallback if translation is missing
    if (baseMessage === `notifications.types.${notification.type}`) {
      return `${notification.type}: ${titleToDisplay}`;
    }
    
    // Inject the localized title into the translation string
    return baseMessage.replace('{event}', titleToDisplay);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          if (!isOpen) fetchAndGenerateNotifications(); // Refresh on open
          setIsOpen(!isOpen);
        }}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
        aria-label={t('notifications.title')}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-black text-gray-900">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors flex items-center"
              >
                <Check className="w-3 h-3 mr-1" />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-sm font-medium text-gray-400">
                {t('notifications.loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">{t('notifications.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => {
                  const isUnread = !readIds.includes(notification.id);
                  return (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-start gap-3 group ${
                        isUnread ? 'bg-primary-50/30' : ''
                      }`}
                    >
                      <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${isUnread ? 'bg-white shadow-sm border border-primary-100' : 'bg-gray-50'}`}>
                        {getIconForType(notification.type)}
                      </div>
                      <div className="flex-grow min-w-0 pr-2">
                        <p className={`text-sm leading-snug mb-1.5 ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                          {getMessageForType(notification)}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-primary-600 group-hover:underline">
                            {t('notifications.viewEvent')}
                          </span>
                          {isUnread && (
                            <>
                              <span className="text-gray-300 text-[10px]">•</span>
                              <span className="text-[10px] font-bold text-red-500">{t('notifications.unread')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;