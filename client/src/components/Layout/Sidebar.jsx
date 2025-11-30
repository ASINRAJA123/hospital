import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { X, Home, Users, FileText, Settings, Stethoscope, ShoppingBag, Shield, UserCheck, ClipboardList, Building, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const allSidebarItems = [
    { icon: Building, label: 'Manage Hospitals', path: '/super/hospitals', roles: ['super_admin'] },
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard', roles: ['admin'] },
    { icon: Users, label: 'Manage Doctors', path: '/admin/manage-doctors', roles: ['admin'] },
    { icon: Users, label: 'Manage Nurses', path: '/admin/manage-nurses', roles: ['admin'] },
    { icon: ShoppingBag, label: 'Medical Shops', path: '/admin/manage-shops', roles: ['admin'] },
    { icon: Shield, label: 'Audit Logs', path: '/admin/audit', roles: ['admin'] },
    { icon: Settings, label: 'Settings', path: '/admin/settings', roles: ['admin'] },
    { icon: Home, label: 'Dashboard', path: '/doctor/dashboard', roles: ['doctor'] },
    { icon: Users, label: 'Manage Patients', path: '/doctor/patients', roles: ['doctor'] },
    { icon: UserCheck, label: 'Manage Nurses', path: '/doctor/manage-nurses', roles: ['doctor'] },
    { icon: ShoppingBag, label: 'Medical Shops', path: '/doctor/manage-shops', roles: ['doctor'] },
    { icon: Download, label: 'Export Records', path: '/export-records', roles: ['doctor', 'nurse'] },
    { icon: Home, label: 'Dashboard', path: '/nurse/dashboard', roles: ['nurse'] },
    { icon: ClipboardList, label: 'All Patients Log', path: '/nurse/all-patients', roles: ['nurse'] },
    { icon: Home, label: 'Dashboard', path: '/pharmacy/dashboard', roles: ['medical_shop'] },
    { icon: FileText, label: 'Prescription Queue', path: '/pharmacy/queue', roles: ['medical_shop'] },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { currentRole } = useAuth();

  const visibleItems = allSidebarItems.filter(item => 
    currentRole && item.roles.includes(currentRole)
  );
  
 const sidebarClasses = `
  fixed md:relative inset-y-0 left-0
  bg-white border-r border-gray-200
  w-56 sm:w-60 md:w-64 h-screen z-40
  transform transition-transform duration-300 ease-in-out
  ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  md:translate-x-0 shrink-0
  flex flex-col
`;


  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <aside className={sidebarClasses}>
        {/* Mobile header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b md:hidden bg-white">
          <h2 className="font-bold text-base sm:text-lg text-gray-900">Menu</h2>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)} // Close sidebar on link click
              end={item.path.endsWith('/dashboard')} 
              className={({ isActive }) =>
                `w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer section for larger screens - sticky to bottom */}
        <div className="hidden md:block mt-auto p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">HealthCare HMS</p>
            <p className="text-xs text-gray-400 mt-1">v2.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
};