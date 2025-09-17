import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Building2, Sun, Moon } from 'lucide-react';

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dentalOffices, setDentalOffices] = useState([]);
  const [filteredOffices, setFilteredOffices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [luneSearchTerm, setLuneSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  const loadDentalOffices = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('https://enamel-backend.onrender.com/api/dental-offices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch dental offices');
      
      const result = await response.json();
      if (result.success) {
        setDentalOffices(result.data);
        setFilteredOffices(result.data);
      }
    } catch (error) {
      setMessage('Error loading dental offices. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchLuneBySerial = async () => {
    if (!luneSearchTerm.trim()) {
      setSearchResult(null);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/lune-machines/search/serial/${luneSearchTerm}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSearchResult(result.data);
          setMessage('');
        }
      } else if (response.status === 404) {
        setSearchResult(null);
        setMessage('Lune machine not found');
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      setSearchResult(null);
      setMessage('Error searching for lune machine');
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      loadDentalOffices();
    }
  }, [isAuthenticated, navigate, loadDentalOffices]);

  // Search functionality for dental offices
  useEffect(() => {
    const filtered = dentalOffices.filter(office =>
      office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.npi_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.town.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOffices(filtered);
  }, [searchTerm, dentalOffices]);


  return (
    <div className="p-6">
        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 mb-8">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors duration-200 ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          <button
            onClick={() => navigate('/create-office')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Dental Office</span>
          </button>
        </div>

        {/* Search Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Dental Office Search */}
          <div className={`p-6 rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Search Dental Offices</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder="Search by name, NPI, state, or town..."
              />
            </div>
          </div>

          {/* Lune Machine Search */}
          <div className={`p-6 rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Search Lune by Serial Number</h3>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={luneSearchTerm}
                  onChange={(e) => setLuneSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Enter serial number..."
                  onKeyPress={(e) => e.key === 'Enter' && searchLuneBySerial()}
                />
              </div>
              <button
                onClick={searchLuneBySerial}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Search
              </button>
            </div>
            
            {/* Search Result */}
            {searchResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Lune Found: {searchResult.serial_number}
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Office: {searchResult.office_name} ({searchResult.npi_id})
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Location: {searchResult.town}, {searchResult.state}
                </p>
                <button
                  onClick={() => navigate(`/lune/${searchResult.id}`)}
                  className="mt-2 text-blue-500 hover:text-blue-600 text-sm font-medium"
                >
                  View Details →
                </button>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className={`ml-3 text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Loading dental offices...
            </span>
          </div>
        )}

        {!loading && (
          <>
            {/* Dental Offices Grid */}
            <div className="mb-6">
              <h2 className={`text-2xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Dental Offices ({filteredOffices.length})</h2>
              
              {filteredOffices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOffices.map((office) => (
                    <div 
                      key={office.id} 
                      className={`rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105 ${
                        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                      }`}
                      onClick={() => navigate(`/office/${office.id}`)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-5 h-5 text-blue-500" />
                          <h3 className={`text-lg font-bold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{office.name}</h3>
                        </div>
                        {office.lune_count > 0 && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {office.lune_count} Lune{office.lune_count !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>NPI ID:</span>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{office.npi_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Location:</span>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{office.town}, {office.state}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Phone:</span>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{office.phone_number || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>Email:</span>
                          <span className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{office.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building2 className={`mx-auto h-12 w-12 ${
                    isDarkMode ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <div className={`text-lg mt-4 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>No dental offices found</div>
                  <p className={`text-sm mt-2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>Try adjusting your search criteria or add a new dental office</p>
                </div>
              )}
            </div>
          </>
        )}

        {message && (
          <div className={`text-center p-3 rounded-lg mt-6 ${
            message.includes('Error') || message.includes('not found') 
              ? 'bg-red-50 text-red-600 border border-red-200' 
              : 'bg-green-50 text-green-600 border border-green-200'
          }`}>
            {message}
          </div>
        )}
    </div>
  );
};

export default Dashboard;
