import React from 'react';

const InputField = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  error = '',
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-bold text-gray-700 tracking-tight">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-3 rounded-xl border ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
        } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-medium placeholder:text-gray-400`}
      />
      {error && <p className="text-xs font-bold text-red-600">{error}</p>}
    </div>
  );
};

export default InputField;
