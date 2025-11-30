// client/src/components/common/ExportRecords.jsx

import React, { useState } from 'react';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';
import PatientSearchModal from '../../components/common/PatientSearchModal';
import { User, Download, FileText } from 'lucide-react';

export default function ExportRecords() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleExport = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient first.");
      return;
    }
    setIsDownloading(true);
    try {
      const response = await apiClient.get(`/api/patients/${selectedPatient.id}/report`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `patient_report_${selectedPatient.id}.pdf`;
      if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch.length === 2)
              filename = filenameMatch[1];
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Report downloaded successfully!");

    } catch (error) {
      toast.error("Failed to generate or download the report.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Patient Records</h1>
          <p className="text-gray-600 mt-1">Search for a patient to generate a complete PDF of their medical history.</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 flex flex-col items-center text-center">
          <FileText size={48} className="text-gray-300 mb-4" />
          <h2 className="font-semibold text-lg mb-2">Select a Patient</h2>
          
          {selectedPatient ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 w-full max-w-md">
              {/* --- START: CORRECTED CODE --- */}
              {/* FIX: Use the correct camelCase property `fullName`. */}
              <p className="font-medium text-gray-900">{selectedPatient.fullName}</p>
              {/* --- END: CORRECTED CODE --- */}
              <button onClick={() => setIsModalOpen(true)} className="text-purple-600 text-sm font-medium">Change</button>
            </div>
          ) : (
             <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium w-full sm:w-auto">
                <User className="h-4 w-4" />
                <span>Search for Patient by Phone</span>
             </button>
          )}

          <div className="mt-6 w-full max-w-xs">
            <button
                onClick={handleExport}
                disabled={!selectedPatient || isDownloading}
                className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-green-300 disabled:cursor-not-allowed"
            >
                <Download className="h-5 w-5" />
                <span>{isDownloading ? 'Generating...' : 'Download Report'}</span>
            </button>
          </div>
        </div>
      </div>
      <PatientSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectPatient={(patient) => {
            setSelectedPatient(patient);
            setIsModalOpen(false);
        }}
      />
    </>
  );
}