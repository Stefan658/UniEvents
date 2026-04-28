import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, updateEvent } from '../api/events';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import EventForm from '../components/EventForm';
import ParticipantList from '../components/ParticipantList';
import MaterialManager from '../components/MaterialManager';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { ArrowLeft, Settings, Users, FileText } from 'lucide-react';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventById(id);
        setEvent(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleSubmit = async (formData) => {
    setIsUpdating(true);
    try {
      await updateEvent(id, formData);
      alert('Event updated successfully!');
      navigate('/organizer');
    } catch (err) {
      alert(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <Loader fullPage />;
  if (error) return <PageContainer><ErrorMessage message={error} /></PageContainer>;

  return (
    <PageContainer>
      <button 
        onClick={() => navigate('/organizer')} 
        className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-8 font-medium group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
        Back to Dashboard
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:w-1/4 space-y-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'details' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5 mr-3" /> Event Details
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'participants' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5 mr-3" /> Participants
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'materials' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5 mr-3" /> Materials
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:w-3/4">
          {activeTab === 'details' && (
            <SectionCard title="Edit Event Details">
              <EventForm 
                initialData={event} 
                onSubmit={handleSubmit} 
                onCancel={() => navigate('/organizer')} 
                isLoading={isUpdating} 
              />
            </SectionCard>
          )}

          {activeTab === 'participants' && (
            <SectionCard title="Event Participants">
              <ParticipantList eventId={id} />
            </SectionCard>
          )}

          {activeTab === 'materials' && (
            <SectionCard title="Manage Event Materials">
              <MaterialManager eventId={id} />
            </SectionCard>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default EditEventPage;
