// client/src/pages/pharmacy/PrescriptionQueue.jsx

import { useState, useEffect } from 'react';
import { FileText, PenTool, Image as ImageIcon } from 'lucide-react'; // Added icons
import StatusBadge from '../../components/common/StatusBadge';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';
import PrescriptionDetailModal from '../../components/modals/PrescriptionDetailModal';

export default function PrescriptionQueue() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/prescriptions/queue');
      const enhancedData = response.data.map(p => ({
          ...p,
          patientName: p.patient.fullName,
      }));
      setPrescriptions(enhancedData);
    } catch (error) {
      toast.error("Failed to load prescription queue.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleCloseModal = (didUpdate) => {
    setSelectedPrescription(null);
    if (didUpdate) {
      fetchQueue();
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescription Queue</h1>
          <p className="text-gray-600 mt-1">Prescription management and dispensing</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pending Prescriptions</h2>
          <div className="space-y-4">
            {isLoading ? (
              <p>Loading prescriptions...</p>
            ) : prescriptions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>The prescription queue is empty.</p>
              </div>
            ) : (
              prescriptions.map((prescription) => {
                const isHandwritten = prescription.prescriptionType === 'handwritten';
                
                return (
                  <div 
                    key={prescription._id} 
                    onClick={() => setSelectedPrescription(prescription)}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        isHandwritten ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' : 'border-gray-200 hover:bg-purple-50 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-2">
                      <div>
                        <p className="font-medium text-gray-900">{prescription.patientName}</p>
                        <p className="text-sm text-gray-500">Prescription ID: {prescription._id}</p>
                      </div>
                      <StatusBadge status={prescription.status.toLowerCase().replace(/ /g, '-')} type="prescription" />
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                        {isHandwritten ? (
                            <div className="flex items-center text-orange-700 text-sm font-medium">
                                <ImageIcon size={16} className="mr-1" />
                                <span>Handwritten (Needs Digitization)</span>
                            </div>
                        ) : (
                            <div className="flex items-center text-gray-600 text-sm">
                                <PenTool size={16} className="mr-1" />
                                <span>{prescription.lineItems.length} medicine(s) prescribed</span>
                            </div>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {selectedPrescription && (
        <PrescriptionDetailModal 
          prescriptionId={selectedPrescription._id}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}