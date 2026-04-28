import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`bg-red-50 border-l-4 border-red-400 p-4 rounded-md ${className}`}>
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  );
};

export default ErrorMessage;
