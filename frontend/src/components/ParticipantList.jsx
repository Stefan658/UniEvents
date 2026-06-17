import React, { useState, useEffect } from 'react';
import { getEventRegistrations } from '../api/registrations';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import { User, Mail, Calendar, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ParticipantList = ({ eventId }) => {
  const { language, t } = useLanguage();
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
    return date.toLocaleDateString(language === 'ro' ? 'ro-RO' : 'en-US');
  };

  const handleExportCSV = () => {
    if (participants.length === 0) return;

    const headers = [
      t('participants.participantHeader'),
      'Email',
      t('participants.regDateHeader'),
      t('participants.statusHeader')
    ];

    const rows = participants.map(reg => [
      reg.user_full_name || t('participants.anonymous'),
      reg.user_email || '',
      formatDate(reg.registered_at),
      t(`status.${reg.status}`, reg.status)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `participants-event-${eventId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      {participants.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 mr-2 text-primary-500" />
            {t('participants.exportCSV')}
          </button>
        </div>
      )}
      
      <div className="overflow-x-auto">
        {participants.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 italic">{t('participants.noParticipants')}</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('participants.participantHeader')}</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('participants.regDateHeader')}</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">{t('participants.statusHeader')}</th>
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
                        <div className="font-semibold text-gray-900">{reg.user_full_name || t('participants.anonymous')}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" /> {reg.user_email || t('participants.noEmail')}
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
                      {t(`status.${reg.status}`, reg.status) || t('participants.registered')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ParticipantList;
