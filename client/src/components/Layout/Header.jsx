import { useState } from 'react';
import PropTypes from 'prop-types';
import { Bell, Search, User, ChevronDown, LogOut, Building2, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PatientSearchModal from '../common/PatientSearchModal';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const getRoleLabel = (roleType) => {
    if (!roleType) return '';
    return roleType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <>
<header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-between sticky top-0 shrink-0">          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
          {/* Hamburger Menu Icon for mobile */}
          <button 
            onClick={onMenuClick} 
            className="md:hidden p-1.5 sm:p-2 text-gray-500 hover:text-gray-800 transition-colors rounded-md hover:bg-gray-100"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 min-w-0">
            <Building2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-purple-600 flex-shrink-0" />
            <div className='hidden sm:block min-w-0'>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">HealthCare HMS</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {user?.hospital ? user.hospital.name : 'System Management'}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar - Hidden on mobile, compact on tablet, full on desktop */}
        <div className="flex-1 max-w-md lg:max-w-lg xl:max-w-xl mx-2 sm:mx-4 md:mx-6 hidden lg:block">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full text-left pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-md sm:rounded-lg text-sm sm:text-base text-gray-500 hover:border-purple-500 transition-colors relative"
          >
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
            <span className="truncate">Search for patient...</span>
          </button>
        </div>

        {/* Profile and Notifications */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
          {/* Mobile search button */}
          <button 
            onClick={() => setShowSearchModal(true)} 
            className="lg:hidden p-1.5 sm:p-2 text-gray-500 hover:text-gray-800 transition-colors rounded-md hover:bg-gray-100"
          >
             <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          {/* Notifications */}
          <button className="relative p-1.5 sm:p-2 text-gray-400 hover:text-gray-500 transition-colors rounded-md hover:bg-gray-100">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center text-[10px] sm:text-xs">3</span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)} 
              className="flex items-center space-x-1 sm:space-x-2 text-sm hover:bg-gray-50 rounded-md p-1 sm:p-1.5 transition-colors"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <div className='hidden md:block text-left min-w-0'>
                <span className="font-medium text-gray-800 text-xs sm:text-sm truncate block max-w-24 lg:max-w-32 xl:max-w-none">{user?.full_name}</span>
                <p className='text-xs text-gray-500 truncate max-w-24 lg:max-w-32 xl:max-w-none'>{getRoleLabel(user?.role)}</p>
              </div>
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 hidden md:block flex-shrink-0" />
            </button>
            
            {showProfileDropdown && (
              <div 
                className="absolute right-0 top-full mt-1 sm:mt-2 w-44 sm:w-48 md:w-52 bg-white rounded-md sm:rounded-lg shadow-lg border z-50" 
                onMouseLeave={() => setShowProfileDropdown(false)}
              >
                <div className="py-1">
                  <div className="px-3 sm:px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button 
                    onClick={logout} 
                    className="w-full text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 px-3 sm:px-4 py-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <PatientSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </>
  );
}

Header.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};