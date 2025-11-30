// client/src/components/Forms/AppointmentForm.jsx

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { User as UserIcon } from 'lucide-react';
import PatientSearchModal from '../common/PatientSearchModal';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';
import { useAuth } from '../../contexts/AuthContext';

export default function AppointmentForm({ onSubmit, onCancel, patient = null, defaultDoctorId = null }) {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState(patient);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  
  const [formData, setFormData] = useState({
    doctor_id: defaultDoctorId ? String(defaultDoctorId) : '',
    appointment_time: '',
    visit_purpose: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // --- START: CORRECTED CODE ---
  // FIX: This useEffect hook synchronizes the component's state with the props
  // whenever the `patient` or `defaultDoctorId` props change. This ensures the
  // form is correctly populated every time the modal is opened for a new patient.
  useEffect(() => {
    setSelectedPatient(patient);
    if (defaultDoctorId) {
      setFormData(prev => ({ ...prev, doctor_id: String(defaultDoctorId) }));
      if (user) {
        setDoctors([user]);
      }
    } else {
        const fetchDoctors = async () => {
          try {
              const response = await apiClient.get('/api/users', { params: { role: 'doctor', is_active: true }});
              setDoctors(response.data);
          } catch (error) {
              toast.error("Failed to load list of doctors.");
          }
      }
      fetchDoctors();
    }
  }, [patient, defaultDoctorId, user]);
  // --- END: CORRECTED CODE ---
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Please select a patient first.');
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        patient_id: selectedPatient._id,
        doctor_id: formData.doctor_id,
        appointment_time: new Date(formData.appointment_time).toISOString(),
        visit_purpose: formData.visit_purpose,
      };
      const response = await apiClient.post('/api/appointments', payload);
      onSubmit(response.data);
    } catch(error) {
        toast.error(error.response?.data?.detail || "Failed to create appointment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Patient *</label>
          {selectedPatient ? (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <p className="font-medium text-gray-900">{selectedPatient.fullName}</p>
              {!patient && (
                <button type="button" onClick={() => setShowPatientModal(true)} className="text-purple-600 text-sm font-medium">Change</button>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => setShowPatientModal(true)} className="w-full p-4 border-2 border-dashed rounded-lg flex justify-center items-center">
              <UserIcon className="h-5 w-5 mr-2" /> Select Patient
            </button>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Doctor *</label>
          <select
            required
            name="doctor_id" // Add name attribute for clarity
            value={formData.doctor_id}
            onChange={(e) => setFormData(prev => ({ ...prev, doctor_id: e.target.value }))}
            disabled={!!defaultDoctorId}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
          >
            <option value="">Select a doctor</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
           <input
            type="datetime-local" required value={formData.appointment_time}
            onChange={e => setFormData(prev => ({ ...prev, appointment_time: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visit Purpose (optional)</label>
          <textarea
            value={formData.visit_purpose} onChange={(e) => setFormData(prev => ({ ...prev, visit_purpose: e.target.value }))}
            rows={3} className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-6 border-t">
          <button type="button" onClick={onCancel} className="w-full sm:w-auto px-6 py-2 border rounded-lg font-medium">Cancel</button>
          <button type="submit" disabled={isLoading || !selectedPatient || !formData.doctor_id || !formData.appointment_time} className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg font-medium disabled:opacity-50">
            {isLoading ? 'Creating...' : 'Create Appointment'}
          </button>
        </div>
      </form>
      {!patient && (
        <PatientSearchModal isOpen={showPatientModal} onClose={() => setShowPatientModal(false)} onSelectPatient={setSelectedPatient} />
      )}
    </>
  );
}

AppointmentForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  patient: PropTypes.object,
  defaultDoctorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};