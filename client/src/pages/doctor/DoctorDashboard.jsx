// client/src/pages/doctor/DoctorDashboard.jsx

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Play, CheckCircle, Pill, ClipboardList, History } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import PrescriptionStatusBadge from '../../components/common/PrescriptionStatusBadge';
import ConsultationModal from '../../components/modals/ConsultationModal';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingConsultation, setIsStartingConsultation] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // New state for tab switching
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'completed'

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.get('/api/appointments/', {
        params: { appointment_date: today }
      });
      
      // Filter strictly for the logged-in doctor
      const myAppointments = response.data
        .filter(apt => apt.doctor.id === user?.id)
        // 👇 FIXED: Changed appointment_time to appointmentTime
        .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime());
        
      setAppointments(myAppointments);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load appointments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const handleStartConsultation = async (appointmentToStart) => {
    setIsStartingConsultation(appointmentToStart.id);
    try {
      const response = await apiClient.put(`/api/appointments/${appointmentToStart.id}/status/start`);
      
      // Update the list immediately
      setAppointments(prev => prev.map(a => a.id === response.data.id ? response.data : a));
      
      // Open the modal
      setSelectedAppointment(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to start consultation.");
    } finally {
      setIsStartingConsultation(null);
    }
  };
  
  const handleCloseConsultation = () => {
    setSelectedAppointment(null);
    fetchAppointments(); // Refresh list to move appointment to 'Completed' tab
  };

  // Helper to calculate age from DOB if backend doesn't send age directly
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  // Filter appointments based on status
  const queueAppointments = appointments.filter(a => 
    ['Scheduled', 'In-Consultation', 'No-Show'].includes(a.status)
  );

  const completedAppointments = appointments.filter(a => 
    ['Completed', 'Cancelled'].includes(a.status)
  );

  const renderAppointmentList = (list, isQueue) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
          <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p>{isQueue ? "No active appointments remaining." : "No completed consultations yet today."}</p>
        </div>
      );
    }

    return list.map((appointment) => {
      const prescription = appointment.visit?.prescription;
      
      // Logic for interactions
      const isStartable = appointment.status === 'Scheduled';
      const isEditable = appointment.status === 'Completed' || appointment.status === 'In-Consultation';
      
      const rowClasses = `flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg transition-all shadow-sm gap-y-3 ${
        isEditable ? 'hover:border-purple-300 hover:shadow-md cursor-pointer bg-white' : 'bg-gray-50'
      }`;

      // 👇 FIXED: Robust date parsing
      const timeString = appointment.appointmentTime 
        ? new Date(appointment.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Time N/A';

      return (
        <div 
          key={appointment.id} 
          className={rowClasses}
          onClick={() => isEditable && setSelectedAppointment(appointment)}
        >
          {/* Left Side: Patient Details */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center sm:space-x-6 gap-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-500 min-w-[100px]">
              <Clock className="h-4 w-4 text-purple-500" />
              <span className="font-medium">
                {timeString}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 min-w-[200px]">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">{appointment.patient.fullName}</span>
              <span className="text-xs text-gray-500">
                ({appointment.patient.sex}, {appointment.patient.age || calculateAge(appointment.patient.dateOfBirth)})
              </span>
            </div>

            <div className="flex items-center gap-x-2 flex-wrap">
              <StatusBadge status={appointment.status} type="appointment" size="sm" />
              
              {appointment.status === 'Completed' && (
                prescription ? (
                  <PrescriptionStatusBadge status={prescription.status} />
                ) : (
                  <div className="inline-flex items-center space-x-1.5 rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    <Pill className="h-3 w-3" />
                    <span>No Rx</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="w-full sm:w-auto flex items-center justify-end sm:space-x-4 sm:ml-4 flex-shrink-0">
            
            {/* 1. Scheduled: Start Button */}
            {isStartable && (
              <button
                onClick={(e) => { e.stopPropagation(); handleStartConsultation(appointment); }}
                disabled={isStartingConsultation === appointment.id}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-purple-300 transition-colors shadow-sm"
              >
                {isStartingConsultation === appointment.id ? (
                   <span className="animate-pulse">Starting...</span>
                ) : (
                   <>
                     <Play className="h-4 w-4" />
                     <span>Start Consult</span>
                   </>
                )}
              </button>
            )}

            {/* 2. In Progress Indicator */}
            {appointment.status === 'In-Consultation' && (
                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <span className="text-sm font-medium">Continue</span>
                </div>
            )}

            {/* 3. Completed: Edit Button */}
            {appointment.status === 'Completed' && (
                <div className="flex items-center space-x-2 text-gray-500 hover:text-purple-600 transition-colors">
                    <span className="text-sm font-medium">Review / Edit</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">
             Schedule for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-4 px-6 text-sm font-medium focus:outline-none transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'queue'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Clock className="h-4 w-4" />
              Active Queue 
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'queue' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                {queueAppointments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-4 px-6 text-sm font-medium focus:outline-none transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'completed'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <History className="h-4 w-4" />
              Completed Today
              <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                {completedAppointments.length}
              </span>
            </button>
          </div>

          <div className="p-6 min-h-[400px]">
            {isLoading ? (
               <div className="space-y-4 animate-pulse">
                 {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>)}
               </div>
            ) : (
              <div className="space-y-4">
                {activeTab === 'queue' 
                  ? renderAppointmentList(queueAppointments, true)
                  : renderAppointmentList(completedAppointments, false)
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedAppointment && (
        <ConsultationModal 
            appointment={selectedAppointment} 
            onClose={handleCloseConsultation} 
        />
      )}
    </>
  );
}