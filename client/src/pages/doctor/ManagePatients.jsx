// client/src/pages/doctor/ManagePatients.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, CalendarPlus, Search, X, Play, FileClock } from 'lucide-react';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';
import PatientForm from '../../components/Forms/PatientForm';
import AppointmentForm from '../../components/Forms/AppointmentForm';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PatientHistoryView from '../../components/common/PatientHistoryView';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function ManagePatients() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [modalStep, setModalStep] = useState(null);
  const [activePatient, setActivePatient] = useState(null);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [patientForHistory, setPatientForHistory] = useState(null);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { skip: 0, limit: 100 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedDate) params.appointment_date = selectedDate;
      const response = await apiClient.get('/api/patients/', { params });
      setPatients(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Failed to fetch patients.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedDate]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);
  
  const handlePatientCreated = (newPatient) => {
    setActivePatient(newPatient);
    setModalStep('newAppointment');
    fetchPatients();
  };

  const handleAppointmentCreated = (newAppointment) => {
    setActiveAppointment(newAppointment);
    setModalStep('confirmStartConsultation');
  };

  const handleStartConsultation = async () => {
    if (!activeAppointment) return;
    try {
      await apiClient.put(`/api/appointments/${activeAppointment.id}/status/start`);
      toast.success("Consultation started!");
      closeModal();
      navigate('/doctor/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to start consultation.");
    }
  };

  const openNewPatientModal = () => {
    setActivePatient(null);
    setActiveAppointment(null);
    setModalStep('newPatient');
  };

  const openAppointmentModalForExistingPatient = (patient) => {
    setActivePatient(patient);
    setActiveAppointment(null);
    setModalStep('newAppointment');
  };

  const closeModal = () => {
    setModalStep(null);
    setActivePatient(null);
    setActiveAppointment(null);
  };
  
  const getModalTitle = () => {
    switch(modalStep) {
      case 'newPatient': return 'Register New Patient';
      // --- START: CORRECTED CODE ---
      // FIX: Use activePatient.fullName (camelCase) to correctly display the name.
      case 'newAppointment': return `Book Appointment for ${activePatient?.fullName}`;
      // --- END: CORRECTED CODE ---
      case 'confirmStartConsultation': return 'Appointment Created';
      default: return '';
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Patients</h1>
            <p className="text-gray-600 mt-1">Search, add, and book appointments for patients.</p>
          </div>
          <button
            onClick={openNewPatientModal}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Patient & Book</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
             <label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700 whitespace-nowrap">Appointment on:</label>
             <input
              id="appointmentDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-1.5"
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate('')} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Full Name</th>
                <th scope="col" className="px-6 py-3 hidden sm:table-cell">Phone Number</th>
                <th scope="col" className="px-6 py-3 hidden md:table-cell">DOB / Sex</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4} className="text-center p-6">Loading patients...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={4} className="text-center p-6 text-gray-500">No patients found.</td></tr>
              ) : patients.map(patient => (
                <tr key={patient.id} className="bg-white border-b hover:bg-gray-50">
                  {/* --- START: CORRECTED CODE --- */}
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {/* FIX: Use patient.fullName (camelCase) */}
                    {patient.fullName}
                    {/* FIX: Use patient.phoneNumber (camelCase) */}
                    <p className="sm:hidden text-xs font-normal text-gray-500">{patient.phoneNumber}</p>
                  </td>
                  {/* FIX: Use patient.phoneNumber (camelCase) */}
                  <td className="px-6 py-4 hidden sm:table-cell">{patient.phoneNumber}</td>
                  {/* FIX: Use patient.dateOfBirth (camelCase) */}
                  <td className="px-6 py-4 hidden md:table-cell">{patient.dateOfBirth || 'N/A'} / {patient.sex || 'N/A'}</td>
                  {/* --- END: CORRECTED CODE --- */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <button 
                          onClick={() => openAppointmentModalForExistingPatient(patient)}
                          className="font-medium text-purple-600 hover:underline flex items-center space-x-1 whitespace-nowrap">
                          <CalendarPlus size={16} />
                          <span>Book Appointment</span>
                      </button>
                      <button 
                          onClick={() => setPatientForHistory(patient)}
                          className="font-medium text-gray-600 hover:underline flex items-center space-x-1 whitespace-nowrap">
                          <FileClock size={16} />
                          <span>View History</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal isOpen={!!modalStep} onClose={closeModal} title={getModalTitle()}>
        {modalStep === 'newPatient' && (
          <PatientForm onSubmit={handlePatientCreated} onCancel={closeModal} />
        )}
        {modalStep === 'newAppointment' && activePatient && user && (
          <AppointmentForm
            patient={activePatient}
            defaultDoctorId={user._id}
            onSubmit={handleAppointmentCreated}
            onCancel={closeModal}
          />
        )}
        {modalStep === 'confirmStartConsultation' && (
          <div className="text-center space-y-6 p-4">
            {/* --- START: CORRECTED CODE --- */}
            {/* FIX: Use activePatient.fullName (camelCase) here as well. */}
            <p className="text-lg">Appointment booked successfully for {activePatient?.fullName}.</p>
            {/* --- END: CORRECTED CODE --- */}
            <p className="text-gray-600">Would you like to start the consultation now?</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
              <button onClick={closeModal} className="w-full sm:w-auto px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium">Not Now</button>
              <button
                onClick={handleStartConsultation}
                className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center space-x-2"
              >
                <Play size={16} />
                <span>Start Consultation</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {patientForHistory && (
        <Modal 
          isOpen={!!patientForHistory} 
          onClose={() => setPatientForHistory(null)} 
          title={`History for ${patientForHistory.fullName}`}
        >
          <PatientHistoryView patientId={patientForHistory.id} />
        </Modal>
      )}
    </>
  );
}