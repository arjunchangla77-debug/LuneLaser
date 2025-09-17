import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = ({ children, pageTitle }) => {
  const { isDarkMode } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Get page title based on current route if not provided
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/create-office') return 'Add New Dental Office';
    if (path.startsWith('/office/')) return 'Dental Office Details';
    if (path.startsWith('/lune/')) return 'Lune Machine Details';
    if (path.startsWith('/add-lune/')) return 'Add New Lune Machine';
    if (path === '/admin') return 'Admin Panel';
    if (path === '/offices') return 'Dental Offices';
    if (path === '/lunes') return 'Lune Machines';
    if (path === '/invoices') return 'Invoices';
    if (path === '/analytics') return 'Analytics';
    if (path === '/activity-log') return 'Activity Log';
    if (path === '/reports') return 'Reports';
    if (path === '/profile') return 'Profile';
    return 'EnamelPure';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      {/* Colored Banner with Page Title - Full Width */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className={`transition-all duration-300 px-6 py-4 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}>
          <h1 className="text-white text-2xl font-bold">
            {getPageTitle()}
          </h1>
        </div>
      </div>
      
      <main className={`transition-all duration-300 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
