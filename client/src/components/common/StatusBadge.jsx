import React from 'react';
import PropTypes from 'prop-types';

export default function StatusBadge({ status, type, size = 'md' }) {
  const getStatusConfig = () => {
    switch (type) {
      case 'appointment':
        switch (status.toLowerCase()) {
          case 'scheduled':
            return 'bg-gray-100 text-gray-800';
          case 'in-consultation':
            return 'bg-purple-100 text-purple-800';
          case 'completed':
            return 'bg-green-100 text-green-800';
          case 'no-show':
            return 'bg-red-100 text-red-800';
          case 'cancelled':
            return 'bg-red-100 text-red-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      case 'prescription':
        switch (status.toLowerCase()) {
          case 'created':
            return 'bg-yellow-100 text-yellow-800';
          case 'partially-dispensed':
            return 'bg-indigo-100 text-indigo-800';
          case 'fully-dispensed':
            return 'bg-green-100 text-green-800';
          case 'not-available':
            return 'bg-red-100 text-red-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      case 'visit':
        switch (status.toLowerCase()) {
          case 'draft':
            return 'bg-yellow-100 text-yellow-800';
          case 'completed':
            return 'bg-green-100 text-green-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      case 'user':
        switch (status.toLowerCase()) {
          case 'active':
            return 'bg-green-100 text-green-800';
          case 'inactive':
            return 'bg-red-100 text-red-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (s) => {
    return s
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center ${sizeClasses} rounded-full font-medium ${getStatusConfig()}`}>
      {formatStatus(status)}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['appointment', 'prescription', 'visit', 'user']).isRequired,
  size: PropTypes.oneOf(['sm', 'md']),
};