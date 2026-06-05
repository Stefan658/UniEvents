import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, User, ArrowRight } from 'lucide-react';
import Button from './Button';

const EventCard = ({ event, variant = 'card' }) => {
  if (!event) return null;
  const { 
    id, 
    title, 
    category_name, 
    start_at, 
    organizer_full_name,
    is_free_entry 
  } = event;

  const isRow = variant === 'row';

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return true;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const formatDateRange = (start, end) => {
    if (!start) return 'Date TBD';
    if (!end || isSameDay(start, end)) return formatDate(start);
    
    const d1 = new Date(start);
    const d2 = new Date(end);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 'Invalid Date Range';

    // Check if same year
    if (d1.getFullYear() === d2.getFullYear()) {
      const optionsNoYear = { month: 'short', day: 'numeric' };
      const optionsWithYear = { year: 'numeric', month: 'short', day: 'numeric' };
      return `${d1.toLocaleDateString(undefined, optionsNoYear)} - ${d2.toLocaleDateString(undefined, optionsWithYear)}`;
    }
    
    const optionsWithYear = { year: 'numeric', month: 'short', day: 'numeric' };
    return `${d1.toLocaleDateString(undefined, optionsWithYear)} - ${d2.toLocaleDateString(undefined, optionsWithYear)}`;
  };

  const isMultiDay = start_at && event.end_at && !isSameDay(start_at, event.end_at);

  const hasTicketPrice =
    event?.ticket_price !== null &&
    event?.ticket_price !== undefined &&
    Number(event.ticket_price) > 0;

  const formattedTicketPrice = hasTicketPrice
    ? Number(event.ticket_price).toFixed(2).replace(/\.00$/, "")
    : null;

  const content = (
    <div className={`p-6 flex-grow ${isRow ? 'flex flex-col md:flex-row md:items-center md:gap-8' : 'flex flex-col'}`}>
      <div className={`${isRow ? 'md:w-1/4' : 'mb-5'} flex flex-col gap-2`}>
        <div className="flex flex-wrap gap-2">
          {event.confirmed_registrations_count !== undefined && (
            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-100/50 animate-pulse">
              🔥 {event.confirmed_registrations_count} confirmed
            </span>
          )}
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-100/50">
            <Tag className="w-3 h-3 mr-1.5" />
            {category_name || 'Event'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {isMultiDay && (
            <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100/50">
              Multi-day
            </span>
          )}
          {is_free_entry ? (
            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100/50">
              Free
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100/50">
              {formattedTicketPrice ? `${formattedTicketPrice} RON` : 'Paid'}
            </span>
          )}
        </div>
      </div>
      
      <div className={isRow ? 'md:flex-grow' : ''}>
        <h3 className={`${isRow ? 'text-lg md:text-xl mb-1' : 'text-xl mb-3'} font-semibold text-primary-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight`}>
          {title}
        </h3>
        
        <div className={`${isRow ? 'flex flex-wrap gap-x-6 gap-y-1' : 'space-y-2.5'}`}>
          <div className="flex items-center text-sm font-normal text-gray-500">
            <div className="bg-gray-50 p-1.5 rounded-lg mr-2.5 group-hover:bg-primary-50 transition-colors">
              <Calendar className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
            </div>
            {formatDateRange(start_at, event.end_at)}
          </div>
          <div className="flex items-center text-sm font-normal text-gray-500">
            <div className="bg-gray-50 p-1.5 rounded-lg mr-2.5 group-hover:bg-primary-50 transition-colors">
              <User className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
            </div>
            {organizer_full_name || 'Staff'}
          </div>
        </div>
      </div>

      {isRow && (
        <div className="mt-4 md:mt-0 md:ml-auto">
          <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
            View Details <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Link to={`/events/${id}`} className="block group h-full">
      <div className={`bg-white rounded-3xl shadow-soft border border-gray-100/50 overflow-hidden hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col`}>
        {content}
        {!isRow && (
          <div className="px-6 pb-6">
            <div className="flex items-center text-primary-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              View Details <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default EventCard;
