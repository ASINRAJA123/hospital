import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col h-screen">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

AppLayout.propTypes = {
  children: PropTypes.node,
};