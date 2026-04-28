import React from 'react';

const SectionCard = ({ children, title, className = '', footer }) => {
  return (
    <div className={`bg-white shadow-soft border border-gray-100/50 rounded-3xl overflow-hidden ${className}`}>
      {title && (
        <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>
        </div>
      )}
      <div className="p-8">
        {children}
      </div>
      {footer && (
        <div className="px-8 py-4 border-t border-gray-50 bg-gray-50/30">
          {footer}
        </div>
      )}
    </div>
  );
};

export default SectionCard;
