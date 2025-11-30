import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import apiClient from '../../services/api';
import { toast } from './Toaster';
import { Calendar, FileText, Clock, Pill, Image as ImageIcon, AlertCircle } from 'lucide-react';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function PatientHistoryView({ patientId }) {
  const [patientHistory, setPatientHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!patientId) return;
      setHistoryLoading(true);
      try {
        const response = await apiClient.get(`/api/patients/${patientId}/appointment-history`);
        setPatientHistory(response.data);
      } catch (error) {
        toast.error("Could not load patient history.");
        setPatientHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [patientId]);

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-4">Visit History</h3>
      {historyLoading ? (
        <p className="text-gray-500">Loading history...</p>
      ) : patientHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p>No previous completed visits found for this patient.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {patientHistory.map(pastAppointment => {
            const visit = pastAppointment.visit;
            if (!visit) return null;

            const privateNoteContent = (visit.notes && visit.notes.length > 0) ? visit.notes[0].content : (visit.authored_notes?.[0]?.content);
            const prescription = visit.prescription;
            const prescriptionLines = prescription?.lineItems || prescription?.line_items;
            const isHandwritten = prescription?.prescriptionType === 'handwritten';
            const hasDigitizedItems = prescriptionLines && prescriptionLines.length > 0;
            const prescriptionImage = prescription?.prescriptionImage;

            return (
              <div key={visit._id || pastAppointment._id} className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="font-bold text-gray-900">{formatDate(pastAppointment.appointmentTime)}</span>
                      <span className="text-gray-400 mx-1">|</span>
                      <span className="text-sm text-gray-600">Dr. {pastAppointment.doctor.fullName}</span>
                  </div>
                  {visit.nextVisitDate && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 border border-blue-200 rounded-full">
                      <Clock className="h-3 w-3 text-blue-700" />
                      <p className="text-xs font-bold text-blue-800">Next Visit: {formatDate(visit.nextVisitDate)}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-5">
                    {/* Clinical Data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div className="border-l-2 border-purple-200 pl-3"><p className="font-bold text-gray-500 text-xs uppercase mb-1">Chief Complaint</p><p className="text-gray-900 font-medium whitespace-pre-wrap">{visit.subjective || 'N/A'}</p></div>
                        <div className="border-l-2 border-purple-200 pl-3"><p className="font-bold text-gray-500 text-xs uppercase mb-1">Allergies / History</p><p className="text-gray-900 font-medium whitespace-pre-wrap">{visit.objective || 'N/A'}</p></div>
                        <div className="border-l-2 border-purple-200 pl-3"><p className="font-bold text-gray-500 text-xs uppercase mb-1">Assessment (Diagnosis)</p><p className="text-gray-900 font-medium whitespace-pre-wrap">{visit.assessment || 'N/A'}</p></div>
                        <div className="border-l-2 border-purple-200 pl-3"><p className="font-bold text-gray-500 text-xs uppercase mb-1">Plan / Advice</p><p className="text-gray-900 font-medium whitespace-pre-wrap">{visit.plan || 'N/A'}</p></div>
                    </div>
                    {privateNoteContent && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                        <FileText className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div><p className="font-bold text-yellow-800 text-xs uppercase mb-1">Clinical Notes (Internal)</p><p className="text-sm text-yellow-900 whitespace-pre-wrap">{privateNoteContent}</p></div>
                    </div>
                    )}
                    
                    {/* Prescription Section */}
                    {isHandwritten && !hasDigitizedItems && prescriptionImage ? (
                        <div className="border rounded-lg overflow-hidden bg-slate-50">
                             <div className="bg-slate-100 px-4 py-2 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-slate-700" /><h5 className="font-bold text-slate-900 text-sm">Handwritten Prescription</h5></div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"><AlertCircle size={12}/> Pending Pharmacy Update</span>
                            </div>
                            <div className="p-4 flex justify-center"><img src={prescriptionImage} alt="Whiteboard Prescription" className="max-h-64 border rounded shadow-sm bg-white object-contain"/></div>
                        </div>
                    ) : hasDigitizedItems ? (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-purple-50 px-4 py-2 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2"><Pill className="h-4 w-4 text-purple-700" /><h5 className="font-bold text-purple-900 text-sm">Medications Prescribed</h5></div>
                                {isHandwritten && <span className="text-xs text-purple-600 italic">(Digitized)</span>}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Medicine</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Dose</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Freq</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Days</th>
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Instructions</th>
                                            {/* 👇 NEW COLUMN */}
                                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Dispense Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {prescriptionLines.map((med, idx) => (
                                            <tr key={med._id || idx} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-sm font-semibold text-gray-900">{med.medicineName || med.medicine_name}</td>
                                                <td className="px-4 py-2 text-sm text-gray-600">{med.dose}</td>
                                                <td className="px-4 py-2 text-sm text-gray-600">{med.frequency}</td>
                                                <td className="px-4 py-2 text-sm text-gray-600">{med.durationDays || med.duration_days}</td>
                                                <td className="px-4 py-2 text-sm text-gray-600 italic">{med.instructions || '-'}</td>
                                                {/* 👇 STATUS BADGE */}
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                        med.status === 'Given' ? 'bg-green-100 text-green-800' :
                                                        med.status === 'Partial' ? 'bg-orange-100 text-orange-800' :
                                                        med.status === 'Not Given' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        {med.status || 'Pending'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="border-t pt-3 mt-2 text-sm text-gray-400 italic flex items-center gap-2"><Pill className="h-3 w-3" /> No medications prescribed.</div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

PatientHistoryView.propTypes = {
  patientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};