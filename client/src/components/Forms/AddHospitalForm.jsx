import React, { useState } from 'react';
import PropTypes from 'prop-types';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';

export default function AddHospitalForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    admin_full_name: '',
    admin_email: '',
    admin_password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/api/hospitals/', formData);
      toast.success("Hospital and Admin created successfully!");
      onSubmit();
    } catch(error) {
        toast.error(error.response?.data?.detail || "Failed to create hospital.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Hospital Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Name *</label>
            <input
              type="text" required value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hospital Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 123 Health St, Medville, USA"
              />
            </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Initial Administrator Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Full Name *</label>
              <input
                type="text" required value={formData.admin_full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email *</label>
              <input
                type="email" required value={formData.admin_email}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Initial Password *</label>
              <input
                type="password" required value={formData.admin_password}
                onChange={(e) => setFormData(prev => ({ ...prev, admin_password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="w-full sm:w-auto px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button type="submit" disabled={isLoading} className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50">
          {isLoading ? 'Creating...' : 'Create Hospital & Admin'}
        </button>
      </div>
    </form>
  );
}

AddHospitalForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};