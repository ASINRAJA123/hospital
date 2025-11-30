import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Building } from 'lucide-react';
import apiClient from '../../services/api';
import { toast } from '../../components/common/Toaster';
import Modal from '../../components/common/Modal';
import AddHospitalForm from '../../components/Forms/AddHospitalForm';

export default function ManageHospitals() {
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHospitals = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/hospitals/');
      setHospitals(response.data);
    } catch (error) {
      toast.error("Failed to fetch hospitals.");
      setHospitals([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const handleHospitalAdded = () => {
    setIsModalOpen(false);
    fetchHospitals();
  };

  const handleDeleteHospital = async (hospital) => {
    if (window.confirm(`Are you sure you want to permanently delete "${hospital.name}" and all its associated data? This action cannot be undone.`)) {
      try {
        const response = await apiClient.delete(`/api/hospitals/${hospital.id}`);
        toast.success(response.data.msg);
        fetchHospitals();
      } catch (error) {
        toast.error(error.response?.data?.detail || "Failed to delete hospital.");
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <Building className="h-6 w-6 text-gray-700" />
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Hospitals</h1>
                <p className="text-gray-600 mt-1">Onboard new hospitals and their administrators.</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Hospital</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Hospital ID</th>
                <th scope="col" className="px-6 py-3">Hospital Name</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={3} className="text-center p-6 text-gray-500">Loading hospitals...</td></tr>
              ) : hospitals.length === 0 ? (
                <tr><td colSpan={3} className="text-center p-6 text-gray-500">No hospitals found. Click "Add New Hospital".</td></tr>
              ) : (
                hospitals.map(hospital => (
                  <tr key={hospital.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{hospital.id}</td>
                    <td className="px-6 py-4">{hospital.name}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteHospital(hospital)}
                        className="text-red-600 hover:text-red-800 font-medium flex items-center space-x-1"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Hospital & Admin">
        <AddHospitalForm onSubmit={handleHospitalAdded} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </>
  );
}