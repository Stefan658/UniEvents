import React, { useState, useEffect } from 'react';
import { getEventRegistrations } from '../api/registrations';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import { User, Mail, Calendar } from 'lucide-react';

const ParticipantList = ({ eventId }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const data = await getEventRegistrations(eventId);
        setParticipants(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, [eventId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString();
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="overflow-x-auto">
      {participants.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-500 italic">No participants registered yet.</p>
        </div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Participant</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Registration Date</th>
              <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {participants.map((reg) => (
              <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold mr-3">
                      {reg.user_full_name?.charAt(0) || <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{reg.user_full_name || 'Anonymous Student'}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Mail className="w-3 h-3 mr-1" /> {reg.user_email || 'No email provided'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-300" />
                    {formatDate(reg.registered_at)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    reg.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {reg.status || 'Registered'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ParticipantList;
