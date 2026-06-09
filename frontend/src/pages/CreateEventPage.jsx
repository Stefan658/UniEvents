import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createEvent } from '../api/events';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import EventForm from '../components/EventForm';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, RefreshCcw } from 'lucide-react';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const templateEvent = location.state?.templateEvent;

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    try {
      await createEvent({
        ...formData,
        organizer_id: user.id
      });
      alert(t('organizer.submitAdmin'));
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
        {t('organizer.backToDash')}
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold font-black text-gray-900">{t('organizer.createTitle')}</h1>
          {templateEvent && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl border border-primary-100 text-sm font-bold animate-in fade-in slide-in-from-right-4 duration-500">
              <RefreshCcw className="w-4 h-4" />
              <span>{t('organizer.basedOnPrev')}</span>
            </div>
          )}
        </div>
        
        <SectionCard>
          <EventForm 
            initialData={templateEvent}
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
