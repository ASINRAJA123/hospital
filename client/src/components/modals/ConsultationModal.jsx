import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { X, Send, Pill, Trash2, Info, PlusCircle, Save, PenTool, Keyboard, Eraser } from 'lucide-react'; 
import apiClient from '../../services/api';
import { toast } from '../common/Toaster';
import PatientHistoryView from '../common/PatientHistoryView';

// --- HELPER COMPONENT: Whiteboard Canvas ---
const WhiteboardCanvas = ({ onSave, initialImage, isReadOnly }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const contextRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    canvas.style.width = `${canvas.offsetWidth}px`;
    canvas.style.height = `${canvas.offsetHeight}px`;

    const context = canvas.getContext("2d");
    context.scale(2, 2);
    context.lineCap = "round";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    contextRef.current = context;

    if (initialImage) {
        const img = new Image();
        img.src = initialImage;
        img.onload = () => {
            context.drawImage(img, 0, 0, canvas.offsetWidth, canvas.offsetHeight);
        };
    }
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    if (isReadOnly) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    if (onSave) onSave(canvasRef.current.toDataURL("image/png"));
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || isReadOnly) return;
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const clearCanvas = () => {
    if (isReadOnly) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (onSave) onSave(null);
  };

  return (
    <div className="flex flex-col space-y-2 h-full">
        {!isReadOnly && (
            <div className="flex justify-end">
                <button onClick={clearCanvas} className="text-sm text-red-600 flex items-center hover:underline bg-red-50 px-2 py-1 rounded">
                    <Eraser size={14} className="mr-1"/> Clear Board
                </button>
            </div>
        )}
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white cursor-crosshair h-96 w-full relative overflow-hidden">
            <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseUp={finishDrawing} onMouseMove={draw} onMouseLeave={finishDrawing} className="w-full h-full block"/>
            {!isReadOnly && !initialImage && (
                <div className="absolute top-2 left-2 text-xs text-gray-400 pointer-events-none select-none">Start writing here...</div>
            )}
        </div>
    </div>
  );
};

// --- DATA HELPERS ---
const createEmptyMedicine = () => ({
  medicine_name: '', dose: '', frequency: '', duration_days: 0, instructions: ''
});

const getInitialMedicines = (appointment) => {
  const existingItems = appointment.visit?.prescription?.lineItems || appointment.visit?.prescription?.line_items;
  
  if (existingItems && existingItems.length > 0) {
    return existingItems.map(item => ({
      medicine_name: item.medicineName || item.medicine_name || '', 
      dose: item.dose || '', 
      frequency: item.frequency || '',
      duration_days: item.durationDays || item.duration_days || 0, 
      instructions: item.instructions || '',
      status: item.status || 'Pending'
    }));
  }
  return Array.from({ length: 5 }, createEmptyMedicine);
};

// --- MAIN COMPONENT ---
export default function ConsultationModal({ appointment, onClose }) {
  const patient = appointment.patient;
  const isEditable = !appointment.visit?.prescription || appointment.visit.prescription.status === 'Created';
  
  const [visitData, setVisitData] = useState({ 
    subjective: '', objective: '', assessment: '', plan: '', private_note: '', next_visit_date: '' 
  });
  const [prescriptionMedicines, setPrescriptionMedicines] = useState(() => getInitialMedicines(appointment));
  const [rxMode, setRxMode] = useState('digital'); 
  const [whiteboardData, setWhiteboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('consultation');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (appointment) {
      setVisitData({
        subjective: appointment.visit?.subjective || '',
        objective: appointment.visit?.objective || '',
        assessment: appointment.visit?.assessment || '',
        plan: appointment.visit?.plan || '',
        private_note: appointment.visit?.authored_notes?.[0]?.content || '',
        next_visit_date: appointment.visit?.next_visit_date || ''
      });
      setPrescriptionMedicines(getInitialMedicines(appointment));

      if (appointment.visit?.prescription?.prescriptionType === 'handwritten') {
          setRxMode('handwritten');
          setWhiteboardData(appointment.visit.prescription.prescriptionImage);
      } else {
          setRxMode('digital');
      }
    }
  }, [appointment]);

  const addMedicineRow = () => setPrescriptionMedicines(prev => [...prev, createEmptyMedicine()]);
  const removeMedicine = (index) => setPrescriptionMedicines(prev => prev.filter((_, i) => i !== index));
  const handleMedicineChange = (index, field, value) => {
    setPrescriptionMedicines(prev => {
      const newMedicines = [...prev];
      newMedicines[index] = { ...newMedicines[index], [field]: value };
      return newMedicines;
    });
  };

  const handleSaveVisit = async () => {
    setIsSaving(true);
    try {
      const payload = {
        visit_details: { ...visitData, next_visit_date: visitData.next_visit_date || null },
        prescription_details: { type: rxMode }
      };

      if (rxMode === 'digital') {
          payload.prescription_details.line_items = prescriptionMedicines.filter(med => med.medicine_name.trim() !== '');
      } else {
          if (!whiteboardData) { toast.error("Whiteboard is empty."); setIsSaving(false); return; }
          payload.prescription_details.prescription_image = whiteboardData;
      }

      await apiClient.put(`/api/appointments/${appointment.id}/status/complete`, payload);
      toast.success(appointment.status === 'Completed' ? "Updated successfully." : "Consultation completed.");
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const getActionButton = () => {
    if (isSaving) return { text: "Saving...", color: "bg-gray-400 cursor-not-allowed", icon: <Send className="h-4 w-4 animate-pulse"/> };
    if (appointment.status === 'Completed') return { text: "Update Visit", color: "bg-blue-600 hover:bg-blue-700", icon: <Save className="h-4 w-4"/> };
    return { text: "Complete Visit", color: "bg-green-600 hover:bg-green-700", icon: <Send className="h-4 w-4"/> };
  };

  if (!patient) return null;
  const actionButton = getActionButton();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[95vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
            <div>
                <h2 className="text-xl font-semibold text-gray-900">{patient.full_name}</h2>
                <p className="text-sm text-gray-500">{patient.sex}, DOB: {patient.date_of_birth || 'N/A'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="px-6 flex space-x-8">
            <button onClick={() => setActiveTab('consultation')} className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'consultation' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Consultation</button>
            <button onClick={() => setActiveTab('history')} className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Patient History</button>
            <button onClick={() => setActiveTab('prescription')} className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'prescription' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Prescription</button>
          </nav>
        </div>

        {/* Read Only Warning */}
        {!isEditable && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center space-x-3">
            <Info className="h-5 w-5 text-yellow-600" />
            <p className="text-sm text-yellow-800 font-medium">This record is read-only because the prescription has been dispensed by the pharmacy.</p>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* --- TAB: CONSULTATION --- */}
          {activeTab === 'consultation' && (
            <div className="space-y-6">
              {/* SOAP Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                    <textarea disabled={!isEditable} rows={4} value={visitData.subjective} onChange={(e) => setVisitData(prev => ({ ...prev, subjective: e.target.value }))} className="w-full border rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies / History</label>
                    <textarea disabled={!isEditable} rows={4} value={visitData.objective} onChange={(e) => setVisitData(prev => ({ ...prev, objective: e.target.value }))} className="w-full border rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assessment (Diagnosis)</label>
                    <textarea disabled={!isEditable} rows={4} value={visitData.assessment} onChange={(e) => setVisitData(prev => ({ ...prev, assessment: e.target.value }))} className="w-full border rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500"/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan / Advice</label>
                    <textarea disabled={!isEditable} rows={4} value={visitData.plan} onChange={(e) => setVisitData(prev => ({ ...prev, plan: e.target.value }))} className="w-full border rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500"/>
                  </div>
              </div>
              
              {/* Notes & Date Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes (Internal)</label>
                    <textarea disabled={!isEditable} rows={3} value={visitData.private_note} onChange={(e) => setVisitData(prev => ({ ...prev, private_note: e.target.value }))} className="w-full border rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500" placeholder="Private notes for doctors only..."/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Next Visit</label>
                    <input type="date" disabled={!isEditable} value={visitData.next_visit_date} onChange={(e) => setVisitData(prev => ({...prev, next_visit_date: e.target.value}))} className="w-full border rounded-md p-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500"/>
                </div>
              </div>
            </div>
          )}

          {/* --- TAB: HISTORY --- */}
          {activeTab === 'history' && <PatientHistoryView patientId={patient.id} />}

          {/* --- TAB: PRESCRIPTION --- */}
          {activeTab === 'prescription' && (
             <div className="space-y-4 h-full flex flex-col">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Rx Medicines</h3>
                    <div className="bg-gray-100 p-1 rounded-lg flex space-x-1">
                        <button onClick={() => setRxMode('digital')} disabled={!isEditable && rxMode === 'handwritten'} className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${rxMode === 'digital' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <Keyboard size={16} /> <span>Digital Entry</span>
                        </button>
                        <button onClick={() => setRxMode('handwritten')} disabled={!isEditable && rxMode === 'digital'} className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${rxMode === 'handwritten' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            <PenTool size={16} /> <span>Whiteboard</span>
                        </button>
                    </div>
                </div>

                {/* Digital Entry Mode */}
                {rxMode === 'digital' && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="hidden md:grid grid-cols-12 gap-x-3 gap-y-2 mb-2 px-3">
                            <div className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Medicine Name</div>
                            <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Dose</div>
                            <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Freq</div>
                            <div className="col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wider">Days</div>
                            <div className="col-span-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Instructions</div>
                            <div className="col-span-1 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{isEditable ? 'Action' : 'Status'}</div>
                        </div>

                        <div className="space-y-3">
                            {prescriptionMedicines.map((med, index) => (
                                <div key={index} className="grid grid-cols-12 gap-x-3 gap-y-2 items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                    <div className="col-span-12 md:col-span-3"><input disabled={!isEditable} placeholder="Medicine Name" value={med.medicine_name} onChange={e => handleMedicineChange(index, 'medicine_name', e.target.value)} className="w-full border-b border-gray-200 p-1 focus:border-purple-500 focus:outline-none disabled:bg-transparent"/></div>
                                    <div className="col-span-6 md:col-span-2"><input disabled={!isEditable} placeholder="e.g. 500mg" value={med.dose} onChange={e => handleMedicineChange(index, 'dose', e.target.value)} className="w-full border-b border-gray-200 p-1 focus:border-purple-500 focus:outline-none disabled:bg-transparent"/></div>
                                    <div className="col-span-6 md:col-span-2"><input disabled={!isEditable} placeholder="e.g. 1-0-1" value={med.frequency} onChange={e => handleMedicineChange(index, 'frequency', e.target.value)} className="w-full border-b border-gray-200 p-1 focus:border-purple-500 focus:outline-none disabled:bg-transparent"/></div>
                                    <div className="col-span-6 md:col-span-1"><input disabled={!isEditable} placeholder="Days" type="number" value={med.duration_days} onChange={e => handleMedicineChange(index, 'duration_days', parseInt(e.target.value) || 0)} className="w-full border-b border-gray-200 p-1 focus:border-purple-500 focus:outline-none disabled:bg-transparent"/></div>
                                    <div className="col-span-12 md:col-span-3"><input disabled={!isEditable} placeholder="e.g. After food" value={med.instructions} onChange={e => handleMedicineChange(index, 'instructions', e.target.value)} className="w-full border-b border-gray-200 p-1 focus:border-purple-500 focus:outline-none disabled:bg-transparent"/></div>
                                    
                                    <div className="col-span-12 md:col-span-1 flex items-end justify-end md:justify-center">
                                        {isEditable ? (
                                            <button onClick={() => removeMedicine(index)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={16}/></button>
                                        ) : (
                                            /* Status Badge for Doctor View (Read Only) */
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                med.status === 'Given' ? 'bg-green-100 text-green-700' :
                                                med.status === 'Partial' ? 'bg-orange-100 text-orange-700' :
                                                med.status === 'Not Given' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-500'
                                            }`}>
                                                {med.status || 'Pending'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {isEditable && (
                            <div className="mt-4">
                                <button onClick={addMedicineRow} className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 rounded-lg transition-colors">
                                    <PlusCircle size={16} /><span>Add Medicine</span>
                                </button>
                            </div>
                        )}
                        {prescriptionMedicines.length === 0 && <p className="text-center text-gray-400 text-sm italic py-4">No medicines added.</p>}
                    </div>
                )}
                
                {/* Whiteboard Mode */}
                {rxMode === 'handwritten' && (
                    <div className="flex-1 min-h-[400px]">
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-2 flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                            <p className="text-sm text-blue-800">Use the whiteboard below to handwrite the prescription. The pharmacy will view this image and digitize the medicines.</p>
                        </div>
                        <WhiteboardCanvas onSave={setWhiteboardData} initialImage={whiteboardData} isReadOnly={!isEditable}/>
                    </div>
                )}
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
            {isEditable ? (
              <>
                <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                <button onClick={handleSaveVisit} disabled={isSaving} className={`flex items-center space-x-2 px-6 py-2 text-white rounded-lg font-medium shadow-sm transition-all ${actionButton.color}`}>
                    {actionButton.icon}<span>{actionButton.text}</span>
                </button>
              </>
            ) : (
              <button onClick={onClose} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors">Close View</button>
            )}
        </div>
      </div>
    </div>
  );
}

ConsultationModal.propTypes = {
  appointment: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};