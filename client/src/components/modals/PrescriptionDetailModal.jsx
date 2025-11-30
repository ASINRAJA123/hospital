import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, CheckCircle, AlertTriangle, Pill, PlusCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';

const createEmptyMedicine = () => ({ medicine_name: '', dose: '', frequency: '', duration_days: 7, instructions: '', status: 'Given' });

export default function PrescriptionDetailModal({ prescriptionId, onClose }) {
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState(false);
  const [medicineInputs, setMedicineInputs] = useState([]);
  const [needsDigitization, setNeedsDigitization] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await apiClient.get(`/api/prescriptions/${prescriptionId}`);
        const data = response.data;
        setPrescription(data);
        
        // If Handwritten/Empty OR if we want to enable editing statuses for digital scripts
        if ((data.prescriptionType === 'handwritten' && (!data.lineItems || data.lineItems.length === 0))) {
            setNeedsDigitization(true);
            setMedicineInputs([createEmptyMedicine()]);
        } else {
            // Enable editing status for existing items too
            setNeedsDigitization(true); 
            setMedicineInputs(data.lineItems.map(item => ({
                medicine_name: item.medicineName,
                dose: item.dose,
                frequency: item.frequency,
                duration_days: item.durationDays,
                instructions: item.instructions,
                status: item.status || 'Given'
            })));
        }
      } catch (error) { toast.error("Failed to load details."); onClose(false); } finally { setLoading(false); }
    };
    fetchDetails();
  }, [prescriptionId, onClose]);

  const addMedicineRow = () => setMedicineInputs(prev => [...prev, createEmptyMedicine()]);
  const removeMedicine = (index) => setMedicineInputs(prev => prev.filter((_, i) => i !== index));
  const handleMedicineChange = (index, field, value) => {
    setMedicineInputs(prev => {
      const newMeds = [...prev];
      newMeds[index] = { ...newMeds[index], [field]: value };
      return newMeds;
    });
  };

  const handleDispense = async () => {
    if (medicineInputs.length === 0 || !medicineInputs.some(m => m.medicine_name.trim() !== '')) {
        toast.error("Please ensure there is at least one medicine listed.");
        return;
    }
    setDispensing(true);
    try {
      const payload = {
          status: 'Dispensed',
          line_items: medicineInputs.filter(m => m.medicine_name.trim() !== '')
      };
      await apiClient.put(`/api/prescriptions/${prescriptionId}/dispense`, payload);
      toast.success("Prescription dispensed successfully.");
      onClose(true);
    } catch (error) { toast.error(error.response?.data?.message || "Failed to dispense."); } finally { setDispensing(false); }
  };

  if (!prescription && loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div><h2 className="text-lg font-bold text-gray-900">Dispense Prescription</h2><p className="text-sm text-gray-500">Patient: {prescription?.patient?.fullName}</p></div>
          <button onClick={() => onClose(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="flex items-center gap-3 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
             <div className="font-semibold">Prescribed by: Dr. {prescription?.doctor?.fullName}</div>
             <div>Date: {new Date(prescription?.createdAt).toLocaleDateString()}</div>
          </div>

          {prescription?.prescriptionType === 'handwritten' && (
              <div className="border-2 border-orange-200 rounded-lg overflow-hidden bg-orange-50">
                  <div className="bg-orange-100 px-4 py-2 border-b border-orange-200 flex items-center gap-2"><ImageIcon className="h-4 w-4 text-orange-700" /><h3 className="font-bold text-orange-800 text-sm">Doctor's Whiteboard Note</h3></div>
                  <div className="p-4 flex justify-center bg-white min-h-[200px]">{prescription.prescriptionImage ? (<img src={prescription.prescriptionImage} alt="Doctor Note" className="max-h-96 object-contain border rounded shadow-sm"/>) : (<p className="text-gray-400 italic">No image data found.</p>)}</div>
              </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3"><Pill className="h-5 w-5 text-purple-600" /><h3 className="font-bold text-gray-800">Medicines Entry & Status</h3></div>
            <div className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 flex items-start gap-2"><AlertTriangle className="h-5 w-5 flex-shrink-0" /><div><strong>Verify Medicines:</strong> Review/Enter medicines and select the dispense status for each item.</div></div>

                <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-bold text-gray-500 uppercase">
                    <div className="col-span-3">Medicine</div><div className="col-span-2">Dose</div><div className="col-span-1">Freq</div><div className="col-span-1">Days</div><div className="col-span-2">Instr.</div><div className="col-span-2">Status</div><div className="col-span-1"></div>
                </div>

                <div className="space-y-2">
                    {medicineInputs.map((med, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded border">
                            <div className="col-span-12 md:col-span-3"><input placeholder="Name" value={med.medicine_name} onChange={e => handleMedicineChange(index, 'medicine_name', e.target.value)} className="w-full p-1 border rounded text-sm"/></div>
                            <div className="col-span-6 md:col-span-2"><input placeholder="Dose" value={med.dose} onChange={e => handleMedicineChange(index, 'dose', e.target.value)} className="w-full p-1 border rounded text-sm"/></div>
                            <div className="col-span-6 md:col-span-1"><input placeholder="Freq" value={med.frequency} onChange={e => handleMedicineChange(index, 'frequency', e.target.value)} className="w-full p-1 border rounded text-sm"/></div>
                            <div className="col-span-6 md:col-span-1"><input type="number" placeholder="Days" value={med.duration_days} onChange={e => handleMedicineChange(index, 'duration_days', e.target.value)} className="w-full p-1 border rounded text-sm"/></div>
                            <div className="col-span-12 md:col-span-2"><input placeholder="Instr." value={med.instructions} onChange={e => handleMedicineChange(index, 'instructions', e.target.value)} className="w-full p-1 border rounded text-sm"/></div>
                            
                            {/* 👇 STATUS DROPDOWN */}
                            <div className="col-span-12 md:col-span-2">
                                <select value={med.status} onChange={e => handleMedicineChange(index, 'status', e.target.value)} className={`w-full p-1 border rounded text-sm font-bold ${med.status === 'Given' ? 'text-green-700 bg-green-50' : med.status === 'Partial' ? 'text-orange-700 bg-orange-50' : 'text-red-700 bg-red-50'}`}>
                                    <option value="Given">Given</option><option value="Partial">Partial</option><option value="Not Given">Not Given</option>
                                </select>
                            </div>
                            <div className="col-span-12 md:col-span-1 flex justify-center"><button onClick={() => removeMedicine(index)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button></div>
                        </div>
                    ))}
                </div>
                <button onClick={addMedicineRow} className="mt-3 flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 font-medium"><PlusCircle size={16} /> Add Row</button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button onClick={() => onClose(false)} className="px-4 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-100">Cancel</button>
          <button onClick={handleDispense} disabled={dispensing} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">{dispensing ? <span>Saving...</span> : <><CheckCircle size={18} /><span>Confirm & Dispense</span></>}</button>
        </div>
      </div>
    </div>
  );
}

PrescriptionDetailModal.propTypes = {
  prescriptionId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};