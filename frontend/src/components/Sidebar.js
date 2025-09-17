import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Menu, 
  X, 
  Home, 
  Building2, 
  Monitor, 
  FileText, 
  Settings, 
  User, 
  Plus,
  BarChart3,
  History,
  Download,
  LogOut
} from 'lucide-react';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { logout } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      description: 'Overview & Search'
    },
    {
      id: 'offices',
      label: 'Dental Offices',
      icon: Building2,
      path: '/offices',
      description: 'Manage Offices'
    },
    {
      id: 'lunes',
      label: 'Lune Machines',
      icon: Monitor,
      path: '/lunes',
      description: 'Machine Management'
    },
    {
      id: 'invoices',
      label: 'Invoices',
      icon: FileText,
      path: '/invoices',
      description: 'Billing & Payments'
    }
  ];

  const actionItems = [
    {
      id: 'create-office',
      label: 'Add Office',
      icon: Plus,
      path: '/create-office',
      description: 'Create New Office'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
      description: 'Usage Statistics'
    },
    {
      id: 'history',
      label: 'Activity Log',
      icon: History,
      path: '/activity-log',
      description: 'Recent Actions'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: Download,
      path: '/reports',
      description: 'Export Data'
    }
  ];

  const userItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      path: '/profile',
      description: 'Account Settings'
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: Settings,
      path: '/admin',
      description: 'System Management'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const NavItem = ({ item, isActive }) => (
    <button
      onClick={() => handleNavigation(item.path)}
      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
        isActive
          ? isDarkMode 
            ? 'bg-blue-600 text-white' 
            : 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
          : isDarkMode
            ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
            : 'text-gray-700 hover:bg-gray-100'
      }`}
      title={isCollapsed ? item.label : ''}
    >
      <item.icon className={`w-5 h-5 flex-shrink-0 ${
        isActive ? 'text-current' : 'text-gray-500 group-hover:text-current'
      }`} />
      {!isCollapsed && (
        <div className="flex-1 text-left">
          <div className="font-medium text-sm">{item.label}</div>
          {item.description && (
            <div className={`text-xs ${
              isActive 
                ? 'text-current opacity-80' 
                : isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {item.description}
            </div>
          )}
        </div>
      )}
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full z-50 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      } shadow-lg`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EP</span>
              </div>
              <div>
                <h1 className={`font-bold text-lg ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  EnamelPure
                </h1>
                <p className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Dental Management
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          
          {/* Main Navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Main
              </h3>
            )}
            {navigationItems.map((item) => (
              <NavItem 
                key={item.id} 
                item={item} 
                isActive={isActive(item.path)} 
              />
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-1">
            {!isCollapsed && (
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Actions
              </h3>
            )}
            {actionItems.map((item) => (
              <NavItem 
                key={item.id} 
                item={item} 
                isActive={isActive(item.path)} 
              />
            ))}
          </div>

          {/* User Section */}
          <div className="space-y-1">
            {!isCollapsed && (
              <h3 className={`px-3 text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Account
              </h3>
            )}
            {userItems.map((item) => (
              <NavItem 
                key={item.id} 
                item={item} 
                isActive={isActive(item.path)} 
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                : 'text-red-600 hover:bg-red-50'
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <div className="font-medium text-sm">Logout</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Sign out of account
                </div>
              </div>
            )}
          </button>
        </div>
      </div>

    </>
  );
};

export default Sidebar;
