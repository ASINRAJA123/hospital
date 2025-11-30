import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Smartphone } from 'lucide-react';

// Define a much smaller breakpoint, e.g., for very small phones or landscape mode issues
const MOBILE_BREAKPOINT = 360; 

export default function DeviceCompatibilityCheck({ children }) {
  const [isCompatible, setIsCompatible] = useState(window.innerWidth >= MOBILE_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsCompatible(window.innerWidth >= MOBILE_BREAKPOINT);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isCompatible) {
    return (
      <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-[9999] p-4">
        <div className="text-center p-4 sm:p-6 md:p-8 max-w-xs sm:max-w-sm mx-auto">
          <Smartphone className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-purple-500 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">Screen Too Small</h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            For a better experience, please rotate your device to landscape or use a slightly larger screen.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

DeviceCompatibilityCheck.propTypes = {
  children: PropTypes.node.isRequired,
};