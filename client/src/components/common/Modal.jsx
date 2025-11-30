import React from 'react';
import { createPortal } from 'react-dom'; // 1. Import createPortal
import PropTypes from 'prop-types';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;

  // 2. This is the JSX for the modal's visual structure
  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // 3. Use the portal to render the modal directly inside the <body>
  return createPortal(modalContent, document.body);
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
};