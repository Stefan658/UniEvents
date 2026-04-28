import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, User, ArrowRight } from 'lucide-react';
import Button from './Button';

const EventCard = ({ event }) => {
  if (!event) return null;
  const { 
    id, 
    title, 
    category_name, 
    start_at, 
    organizer_full_name,
    is_free_entry 
  } = event;

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Link to={`/events/${id}`} className="block group h-full">
      <div className="bg-white rounded-3xl shadow-soft border border-gray-100/50 overflow-hidden hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
        <div className="p-6 flex-grow">
          <div className="flex justify-between items-start mb-5">
            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-100/50">
              <Tag className="w-3 h-3 mr-1.5" />
              {category_name || 'Event'}
            </span>
            {is_free_entry && (
              <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100/50">
                Free
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors leading-tight">
            {title}
          </h3>
          
          <div className="space-y-2.5 mb-6">
            <div className="flex items-center text-sm font-medium text-gray-500">
              <div className="bg-gray-50 p-1.5 rounded-lg mr-2.5 group-hover:bg-primary-50 transition-colors">
                <Calendar className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
              </div>
              {formatDate(start_at)}
            </div>
            <div className="flex items-center text-sm font-medium text-gray-500">
              <div className="bg-gray-50 p-1.5 rounded-lg mr-2.5 group-hover:bg-primary-50 transition-colors">
                <User className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
              </div>
              {organizer_full_name || 'Staff'}
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6">
          <div className="flex items-center text-primary-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
            View Details <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
