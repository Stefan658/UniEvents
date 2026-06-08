import { eventTranslations } from './eventTranslations';
import { translations } from './translations';

export const localizeEvent = (event, language) => {
  if (!event) return event;
  
  // Shallow copy to prevent mutating the original data
  const localizedEvent = { ...event };
  
  if (language === 'ro') {
    // 1. Translate Title & Description from eventTranslations dictionary
    if (eventTranslations[event.title] && eventTranslations[event.title].ro) {
      const roData = eventTranslations[event.title].ro;
      localizedEvent.title = roData.title || event.title;
      if (roData.description && localizedEvent.description) {
        localizedEvent.description = roData.description;
      }
    }
  }

  // Categories are translated dynamically in the EventCard/UI using t()
  return localizedEvent;
};
