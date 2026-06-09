export const generateNotifications = (registrations) => {
  if (!Array.isArray(registrations) || registrations.length === 0) {
    return [];
  }

  const notifications = [];
  const now = new Date();
  
  // Set time to 00:00:00 for accurate day boundary comparisons in local time
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const dayAfterTomorrowStart = new Date(todayStart);
  dayAfterTomorrowStart.setDate(dayAfterTomorrowStart.getDate() + 2);

  registrations.forEach(reg => {
    const eventId = reg.event_id;
    const eventTitle = reg.event_title;
    if (!eventId || !eventTitle) return;

    const eventDate = reg.event_start_at ? new Date(reg.event_start_at) : null;
    let isPast = false;
    let isToday = false;
    let isTomorrow = false;

    if (eventDate) {
      isPast = eventDate < now;
      const eventDateStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      isToday = eventDateStart.getTime() === todayStart.getTime();
      isTomorrow = eventDateStart.getTime() === tomorrowStart.getTime();
    }

    // 1. Cancelled
    if (reg.status === 'cancelled' || reg.event_status === 'cancelled') {
      notifications.push({
        id: `cancelled_${eventId}`,
        type: 'cancelled',
        priority: 1,
        eventId: eventId,
        eventTitle: eventTitle,
        eventStartAt: reg.event_start_at,
        link: `/events/${eventId}`
      });
      return; // Skip other notifications for cancelled events
    }

    // 2. Today
    if (reg.status === 'confirmed' && isToday && !isPast) {
      notifications.push({
        id: `today_${eventId}`,
        type: 'event_today',
        priority: 2,
        eventId: eventId,
        eventTitle: eventTitle,
        eventStartAt: reg.event_start_at,
        link: `/events/${eventId}`
      });
    }

    // 3. Tomorrow
    if (reg.status === 'confirmed' && isTomorrow) {
      notifications.push({
        id: `tomorrow_${eventId}`,
        type: 'event_tomorrow',
        priority: 3,
        eventId: eventId,
        eventTitle: eventTitle,
        eventStartAt: reg.event_start_at,
        link: `/events/${eventId}`
      });
    }

    // 4. Waitlist
    if (reg.status === 'waitlisted' && !isPast) {
      notifications.push({
        id: `waitlist_${eventId}`,
        type: 'waitlisted',
        priority: 4,
        eventId: eventId,
        eventTitle: eventTitle,
        eventStartAt: reg.event_start_at,
        link: `/events/${eventId}`
      });
    }

    // 5. Feedback Missing
    if (reg.status === 'confirmed' && isPast && reg.has_feedback === false) {
      notifications.push({
        id: `feedback_${eventId}`,
        type: 'feedback_missing',
        priority: 5,
        eventId: eventId,
        eventTitle: eventTitle,
        eventStartAt: reg.event_start_at,
        link: `/events/${eventId}#feedback`
      });
    }
  });

  // Sort: First by priority (ascending), then by date (ascending if available)
  return notifications.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    if (a.eventStartAt && b.eventStartAt) {
      return new Date(a.eventStartAt) - new Date(b.eventStartAt);
    }
    return 0;
  });
};
