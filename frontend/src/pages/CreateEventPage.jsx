import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createEvent } from '../api/events';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import EventForm from '../components/EventForm';
import { ArrowLeft } from 'lucide-react';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    try {
      await createEvent({
        ...formData,
        organizer_id: user.id
      });
      navigate('/organizer');
    } catch (err) {
      alert(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <button 
        onClick={() => navigate('/organizer')} 
        className="inline-flex items-center text-gray-500 hover:text-primary-600 mb-8 font-medium group transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
        Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Create New Event</h1>
        
        <SectionCard>
          <EventForm 
            onSubmit={handleSubmit} 
            onCancel={() => navigate('/organizer')} 
            isLoading={isLoading} 
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
};

export default CreateEventPage;
