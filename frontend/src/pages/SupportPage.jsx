import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import SectionCard from '../components/SectionCard';
import Button from '../components/Button';
import InputField from '../components/InputField';
import { Mail, MessageSquare, Send, ChevronLeft, Sparkles, HelpCircle } from 'lucide-react';

const SupportPage = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: eventId ? `Question about Event #${eventId}` : '',
    message: ''
  });
  
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // No backend endpoint, so we just simulate success
    setSubmitted(true);
  };

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary-600 font-bold text-sm mb-8 group transition-colors">
          <div className="bg-white p-1.5 rounded-lg border border-gray-100 mr-2 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to Events
        </Link>

        <div className="relative mb-12 text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-black uppercase tracking-widest mb-4 border border-primary-100/50">
            <HelpCircle className="w-3.5 h-3.5 mr-2" />
            Support Center
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">Contact Our Team</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            Have questions about an event or the platform? We're here to help you make the most of your university experience.
          </p>
        </div>

        {submitted ? (
          <SectionCard className="text-center py-16">
            <div className="bg-green-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Send className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Message Prepared!</h2>
            <p className="text-gray-600 font-medium mb-8 max-w-md mx-auto">
              Your message has been captured. In a production version, this would be sent directly to the "Ștefan cel Mare" University events office.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={() => setSubmitted(false)} variant="secondary">
                Send Another
              </Button>
              <Link to="/">
                <Button>Return Home</Button>
              </Link>
            </div>
          </SectionCard>
        ) : (
          <SectionCard title="Send a Message">
            {eventId && (
              <div className="mb-8 p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-sm font-bold text-blue-700">
                  Support request related to Event #{eventId}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Your Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
                <InputField
                  label="University Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@student.usv.ro"
                  required
                />
              </div>

              <InputField
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="How can we help?"
                required
              />

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 tracking-tight">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-medium placeholder:text-gray-400"
                  placeholder="Type your message here..."
                ></textarea>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full !py-4 shadow-primary-200 shadow-xl">
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </form>
          </SectionCard>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100/50 shadow-soft flex items-start space-x-4">
            <div className="bg-primary-50 p-3 rounded-2xl text-primary-600">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Email Us</h4>
              <p className="text-sm text-gray-500 font-medium">events@usv.ro</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100/50 shadow-soft flex items-start space-x-4">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-1">Live Chat</h4>
              <p className="text-sm text-gray-500 font-medium">Available Mon-Fri, 9:00 - 17:00</p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default SupportPage;
