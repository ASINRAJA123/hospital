// src/pages/nurse/NurseDashboard.jsx

import React, { useState, useEffect } from 'react';
// --- THIS IS THE FIX (1/2): Import the centralized apiClient ---
import apiClient from '../../services/api'; 
import AppointmentForm from '../../components/Forms/AppointmentForm';
import { toast } from '../../components/common/Toaster';
import { Calendar, UserPlus, Clock, User as UserIcon } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

const formatAppointmentTime = (timeStr) => {
  if (!timeStr) return 'No Time';
  try {
    const date = new Date(timeStr);
    return isNaN(date.getTime()) ? 'Invalid Time' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return 'Invalid Time';
  }
};

export default function NurseDashboard() {
  const [todaysPatients, setTodaysPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  const fetchTodaysPatients = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      // --- THIS IS THE FIX (2/2): Use the apiClient for the network request ---
      const response = await apiClient.get('/api/appointments', {
        params: { appointment_date: today },
      });
      // ----------------------------------------------------------------------
      const sortedAppointments = response.data.sort(
        (a, b) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()
      );
      setTodaysPatients(sortedAppointments);
    } catch (error) {
      toast.error("Failed to load today's patient list.");
      setTodaysPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaysPatients();
  }, []);

  const handleAppointmentCreated = () => {
    setShowAppointmentForm(false);
    toast.success("New appointment created successfully!");
    fetchTodaysPatients();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nurse Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage today's patient appointments.</p>
          </div>
          <button
            onClick={() => setShowAppointmentForm(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            <UserPlus className="h-4 w-4" />
            <span>New Appointment</span>
          </button>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h2>
          {isLoading ? (
            <p>Loading schedule...</p>
          ) : todaysPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>No appointments scheduled for today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysPatients.map(appointment => (
                <div key={appointment.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-3">
                  <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 min-w-[90px]">
                        <Clock className="h-4 w-4" />
                        <span>{formatAppointmentTime(appointment.appointment_time)}</span>
                      </div>
                       <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{appointment.patient.full_name}</span>
                      </div>
                  </div>
                   <div className="flex items-center space-x-3 self-end sm:self-center">
                     <span className="text-sm text-gray-500 hidden md:inline">Dr. {appointment.doctor.full_name}</span>
                     <StatusBadge status={appointment.status} type="appointment" size="sm" />
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Modal
        isOpen={showAppointmentForm}
        onClose={() => setShowAppointmentForm(false)}
        title="Create New Appointment"
      >
        <AppointmentForm 
          onSubmit={handleAppointmentCreated} 
          onCancel={() => setShowAppointmentForm(false)} 
        />
      </Modal>
    </>
  );
}