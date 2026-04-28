import React, { useState, useEffect } from 'react';
import InputField from './InputField';
import Button from './Button';
import { getAllCategories } from '../api/categories';
import Loader from './Loader';

const EventForm = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isLoading,
  buttonText = 'Save Event' 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_at: '',
    end_at: '',
    location: '',
    category_id: '',
    participation_type: 'on-site',
    max_participants: '',
    requires_registration: false,
    is_free_entry: true
  });

  const [categories, setCategories] = useState([]);
  const [fetchingCategories, setFetchingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      // Format dates for datetime-local input (YYYY-MM-DDTHH:MM)
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };

      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        start_at: formatDate(initialData.start_at),
        end_at: formatDate(initialData.end_at),
        location: initialData.location || '',
        category_id: initialData.category_id || '',
        participation_type: initialData.participation_type || 'on-site',
        max_participants: initialData.max_participants || '',
        requires_registration: !!initialData.requires_registration,
        is_free_entry: !!initialData.is_free_entry
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (fetchingCategories) return <Loader />;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="md:col-span-2">
          <InputField
            label="Event Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Annual Tech Symposium"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 tracking-tight mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-medium placeholder:text-gray-400"
            placeholder="Tell us more about the event..."
          ></textarea>
        </div>

        <InputField
          label="Start Date & Time"
          name="start_at"
          type="datetime-local"
          value={formData.start_at}
          onChange={handleChange}
          required
        />

        <InputField
          label="End Date & Time"
          name="end_at"
          type="datetime-local"
          value={formData.end_at}
          onChange={handleChange}
          required
        />

        <InputField
          label="Location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="e.g., Main Auditorium"
          required
        />

        <div>
          <label className="block text-sm font-bold text-gray-700 tracking-tight mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-medium appearance-none"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 tracking-tight mb-2">
            Participation Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="participation_type"
              value={formData.participation_type}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-medium appearance-none"
            >
              <option value="on-site">On-site</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <InputField
          label="Max Participants"
          name="max_participants"
          type="number"
          value={formData.max_participants || ''}
          onChange={handleChange}
          placeholder="Leave empty for unlimited"
        />

        <div className="flex flex-col space-y-4 pt-4">
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                name="requires_registration"
                checked={formData.requires_registration}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
              />
            </div>
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">Requires Registration</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                name="is_free_entry"
                checked={formData.is_free_entry}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer"
              />
            </div>
            <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900 transition-colors">Free Entry</span>
          </label>
        </div>
      </div>

      <div className="pt-6 flex justify-end space-x-4">
        {onCancel && (
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel}
            className="px-8"
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          isLoading={isLoading} 
          className="w-full md:w-auto px-12 py-4 shadow-primary-100 shadow-xl"
        >
          {buttonText}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;
