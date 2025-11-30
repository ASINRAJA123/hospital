// client/src/components/Forms/PatientForm.jsx

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';
import { UserPlus, Search, CheckCircle } from 'lucide-react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function PatientForm({ onSubmit, onCancel }) {
  const [step, setStep] = useState('phone_input');
  const [isLoading, setIsLoading] = useState(false);
  const [foundPatients, setFoundPatients] = useState([]);
  
  const [formData, setFormData] = useState({
    phone_number: '',
    full_name: '',
    date_of_birth: '',
    sex: 'Other',
    height: '',
    weight: '',
  });

  const debouncedPhone = useDebounce(formData.phone_number, 500);

  const handleFormDataChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone_number') {
      const sanitizedValue = value.replace(/[^0-9-()\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const searchByPhone = useCallback(async (phone) => {
    const sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.length < 5) {
      setFoundPatients([]);
      setStep('phone_input');
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/patients/search', { params: { phone_number: sanitizedPhone } });
      setFoundPatients(response.data);
      if (response.data.length > 0) {
        setStep('select_existing_patient');
      } else {
        setStep('new_patient_details');
      }
    } catch (error) {
      toast.error("Error searching for patient.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    searchByPhone(debouncedPhone);
  }, [debouncedPhone, searchByPhone]);

  const handleSubmitNewPatient = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = { 
        ...formData, 
        phone_number: formData.phone_number.replace(/\D/g, ''),
        date_of_birth: formData.date_of_birth || null,
      };
      const response = await apiClient.post('/api/patients/', payload);
      toast.success("Patient registered successfully!");
      onSubmit(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to register patient.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectExisting = (patient) => {
    // --- START: CORRECTED CODE ---
    // FIX: Use patient.fullName (camelCase) to display the correct name in the toast message.
    toast.info(`Selected existing patient: ${patient.fullName}`);
    // --- END: CORRECTED CODE ---
    onSubmit(patient);
  };
  
  const handleRegisterNew = () => {
    setStep('new_patient_details');
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Patient Phone Number *</label>
        <div className="relative">
          <input
            type="tel"
            name="phone_number"
            required
            placeholder="Start typing phone number..."
            value={formData.phone_number}
            onChange={handleFormDataChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
          {isLoading && <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 animate-pulse" />}
        </div>
      </div>
      
      {step === 'select_existing_patient' && (
        <div>
          <p className="text-sm font-medium text-green-700 bg-green-50 p-3 rounded-md mb-4">
            We found {foundPatients.length} patient(s) with this phone number. Please select one or register a new family member.
          </p>
          <div className="space-y-2">
            {foundPatients.map(p => (
              <button
                key={p._id}
                onClick={() => handleSelectExisting(p)}
                className="w-full text-left p-3 border rounded-lg hover:bg-purple-50 flex items-center justify-between"
              >
                {/* --- START: CORRECTED CODE --- */}
                <span>
                  {/* FIX: Use p.fullName (camelCase) to display the patient's name. */}
                  {p.fullName} 
                  {/* FIX: Use p.dateOfBirth (camelCase) and format it for display. */}
                  (DOB: {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : 'N/A'})
                </span>
                {/* --- END: CORRECTED CODE --- */}
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </button>
            ))}
          </div>
          <div className="mt-4 border-t pt-4">
             <button
              onClick={handleRegisterNew}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            >
              <UserPlus className="h-4 w-4" />
              <span>Register New Family Member</span>
            </button>
          </div>
        </div>
      )}

      {step === 'new_patient_details' && (
        <form onSubmit={handleSubmitNewPatient} className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
              <input
                type="text" required
                name="full_name"
                value={formData.full_name}
                onChange={handleFormDataChange}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleFormDataChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                  <select name="sex" value={formData.sex} onChange={handleFormDataChange} className="w-full px-3 py-2 border rounded-lg">
                    <option value="Other">Other</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Height (optional)</label>
                <input
                  type="text"
                  name="height"
                  placeholder="e.g., 175 cm"
                  value={formData.height}
                  onChange={handleFormDataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (optional)</label>
                <input
                  type="text"
                  name="weight"
                  placeholder="e.g., 70 kg"
                  value={formData.weight}
                  onChange={handleFormDataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onCancel} className="px-6 py-2 border rounded-lg font-medium">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50">
                {isLoading ? 'Saving...' : 'Save Patient'}
              </button>
            </div>
        </form>
      )}
    </div>
  );
}

PatientForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};