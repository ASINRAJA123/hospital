// client/src/components/modals/AddUserModal.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';
import Modal from '../common/Modal';

const capitalize = (s) => s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

const initialState = {
  email: '',
  full_name: '',
  password: '',
};

const roleConfig = {
  doctor: {
    label: "Doctor's Full Name",
    placeholder: "Enter Doctor's Name with Designation"
  },
  nurse: {
    label: "Nurse's Full Name",
    placeholder: "Enter Nurse's Full Name"
  },
  medical_shop: {
    label: "Medical Shop Name",
    placeholder: "Enter the full name of the medical shop"
  },
  default: {
    label: "Full Name",
    placeholder: "Enter Full Name"
  }
};

const AddUserModal = ({ isOpen, onClose, role, onUserAdded }) => {
  const [formData, setFormData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);
  
  const currentConfig = roleConfig[role] || roleConfig.default;

  useEffect(() => {
    // This effect now correctly resets the form ONLY when the modal is opened
    // or when the role being added is changed.
    if (isOpen) {
      setFormData(initialState);
      setIsLoading(false);
    }
  // --- START: CORRECTED CODE ---
  // FIX: Add `role` to the dependency array. This prevents the effect from
  // running on every re-render, which was wiping the form state.
  }, [isOpen, role]);
  // --- END: CORRECTED CODE ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) return;
    setIsLoading(true);

    try {
      await apiClient.post('/api/users', {
        ...formData,
        role: role,
        is_active: true,
      });
      onUserAdded();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !role) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add New ${capitalize(role)}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
            {currentConfig.label}
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            placeholder={currentConfig.placeholder}
            value={formData.full_name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Initial Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-300 flex items-center"
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

AddUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  role: PropTypes.string,
  onUserAdded: PropTypes.func.isRequired,
};

export default AddUserModal;