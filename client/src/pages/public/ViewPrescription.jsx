import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import { Pill, AlertTriangle, Building2 } from 'lucide-react';

export default function ViewPrescription() {
  const { token } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      if (!token) {
        setError("Invalid prescription link provided.");
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await apiClient.get(`/api/prescriptions/view/${token}`);
        setPrescription(response.data);
      } catch (err) {
        setError("Could not find the prescription. The link may be invalid or expired.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrescription();
  }, [token]);

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
            <p className="ml-4 text-gray-600">Loading Prescription...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="text-center bg-white p-8 rounded-lg shadow-md">
                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800">Error</h1>
                <p className="text-gray-600 mt-2">{error}</p>
            </div>
        </div>
    );
  }

  if (!prescription) {
    return null; // Should be handled by loading/error states
  }

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg">
        <header className="bg-purple-600 text-white p-6 rounded-t-xl text-center">
            <div className="flex justify-center items-center space-x-3">
                <Building2 className="h-8 w-8" />
                <h1 className="text-2xl font-bold">{prescription.hospital_name}</h1>
            </div>
          <p className="text-purple-200 mt-1">E-Prescription</p>
        </header>
        
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Patient</p>
              <p className="font-semibold text-lg text-gray-900">{prescription.patient_name}</p>
            </div>
            <div>
              <p className="text-gray-500">Prescribing Doctor</p>
              <p className="font-semibold text-lg text-gray-900">{prescription.doctor_name}</p>
            </div>
             <div>
              <p className="text-gray-500">Date Issued</p>
              <p className="font-semibold text-gray-900">
                {new Date(prescription.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
             <div>
              <p className="text-gray-500">Status</p>
              <p className="font-semibold text-gray-900">{prescription.status}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Pill className="h-5 w-5 mr-2 text-purple-600" />
            Medications
          </h2>
          <div className="space-y-4">
            {prescription.line_items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="font-bold text-gray-900 text-base">{item.medicine_name}</p>
                <div className="text-sm text-gray-700 mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <p><strong>Dose:</strong> {item.dose}</p>
                    <p><strong>Frequency:</strong> {item.frequency}</p>
                    <p><strong>Duration:</strong> {item.duration_days} days</p>
                </div>
                {item.instructions && <p className="mt-2 text-sm text-gray-700"><strong>Instructions:</strong> {item.instructions}</p>}
              </div>
            ))}
             {prescription.line_items.length === 0 && (
                <p className="text-gray-500">No medications were listed on this prescription.</p>
            )}
          </div>
        </div>
        
        <footer className="text-center text-xs text-gray-400 p-4 border-t mt-4">
            This is a digitally generated prescription from HealthCare HMS.
        </footer>
      </div>
    </div>
  );
}