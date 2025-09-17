import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Monitor, Calendar, Search, BarChart3, Clock, MousePointer } from 'lucide-react';

const LuneDetail = () => {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [lune, setLune] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      loadLuneData();
    }
  }, [isAuthenticated, navigate, id]);

  const loadLuneData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Load lune details
      const luneResponse = await fetch(`/api/lune-machines/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!luneResponse.ok) {
        throw new Error('Lune machine not found');
      }

      const luneResult = await luneResponse.json();
      if (luneResult.success) {
        setLune(luneResult.data);
      }

      // Load available months
      const monthsResponse = await fetch(`/api/lune-machines/${id}/months`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (monthsResponse.ok) {
        const monthsResult = await monthsResponse.json();
        if (monthsResult.success) {
          setAvailableMonths(monthsResult.data);
          // Auto-select the most recent month
          if (monthsResult.data.length > 0) {
            const recent = monthsResult.data[0];
            setSelectedMonth(`${recent.year}-${recent.month.toString().padStart(2, '0')}`);
            loadMonthlyStats(recent.year, recent.month);
          }
        }
      }

    } catch (error) {
      setMessage('Error loading lune data. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyStats = async (year, month) => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/lune-machines/${id}/stats/${year}/${month}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMonthlyStats(result.data);
        }
      }
    } catch (error) {
      setMessage('Error loading monthly stats');
      console.error('Error:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleMonthChange = (monthYear) => {
    setSelectedMonth(monthYear);
    const [year, month] = monthYear.split('-');
    loadMonthlyStats(parseInt(year), parseInt(month));
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const filteredDetails = monthlyStats?.details?.filter(detail => {
    if (!searchTerm) return true;
    return (
      detail.button_number.toString().includes(searchTerm) ||
      new Date(detail.start_time).toLocaleDateString().includes(searchTerm) ||
      new Date(detail.start_time).toLocaleTimeString().includes(searchTerm)
    );
  }) || [];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className={`ml-3 text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Loading lune details...
        </span>
      </div>
    );
  }

  if (!lune) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Lune machine not found
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/office/${lune.dental_office_id}`)}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Lune {lune.serial_number}</h1>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>{lune.office_name} • {lune.town}, {lune.state}</p>
            </div>
          </div>
        </div>

        {/* Lune Information */}
        <div className={`rounded-lg shadow-lg p-6 mb-8 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 flex items-center space-x-2 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>
            <Monitor className="w-5 h-5" />
            <span>Machine Information</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Serial Number</label>
              <p className={`text-lg font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {lune.serial_number}
              </p>
            </div>
            <div>
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Purchase Date</label>
              <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {new Date(lune.purchase_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className={`block text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Dental Office</label>
              <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {lune.office_name}
              </p>
            </div>
          </div>
        </div>

        {/* Month Selection */}
        <div className={`rounded-lg shadow-lg p-6 mb-8 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold flex items-center space-x-2 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              <Calendar className="w-5 h-5" />
              <span>Usage Statistics</span>
            </h2>
            
            {availableMonths.length > 0 && (
              <select
                value={selectedMonth || ''}
                onChange={(e) => handleMonthChange(e.target.value)}
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {availableMonths.map((month) => (
                  <option key={`${month.year}-${month.month}`} value={`${month.year}-${month.month.toString().padStart(2, '0')}`}>
                    {new Date(month.year, month.month - 1).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    })} ({month.usage_count} records)
                  </option>
                ))}
              </select>
            )}
          </div>

          {statsLoading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className={`ml-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Loading statistics...
              </span>
            </div>
          )}

          {!statsLoading && monthlyStats && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
                {monthlyStats.summary.map((buttonStat) => (
                  <div key={buttonStat.button_number} className={`p-4 rounded-lg border ${
                    isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        PB{buttonStat.button_number}
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-center space-x-1">
                          <MousePointer className="w-3 h-3 text-blue-500" />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {buttonStat.press_count} presses
                          </span>
                        </div>
                        <div className="flex items-center justify-center space-x-1">
                          <Clock className="w-3 h-3 text-green-500" />
                          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {formatDuration(buttonStat.total_duration_seconds)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Usage Log */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold flex items-center space-x-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    <BarChart3 className="w-5 h-5" />
                    <span>Detailed Usage Log ({monthlyStats.details.length} records)</span>
                  </h3>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Search by button, date, or time..."
                    />
                  </div>
                </div>

                {filteredDetails.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className={`w-full border rounded-lg ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Button</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Date</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Start Time</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>End Time</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Duration</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
                        {filteredDetails.map((detail, index) => (
                          <tr key={index} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                            <td className={`px-4 py-3 text-sm font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              PB{detail.button_number}
                            </td>
                            <td className={`px-4 py-3 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {new Date(detail.start_time).toLocaleDateString()}
                            </td>
                            <td className={`px-4 py-3 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {new Date(detail.start_time).toLocaleTimeString()}
                            </td>
                            <td className={`px-4 py-3 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {new Date(detail.end_time).toLocaleTimeString()}
                            </td>
                            <td className={`px-4 py-3 text-sm font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatDuration(detail.duration_seconds)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className={`mx-auto h-12 w-12 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <div className={`text-lg mt-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>No usage records found</div>
                    <p className={`text-sm mt-2 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {searchTerm ? 'Try adjusting your search criteria' : 'No button presses recorded for this month'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {!statsLoading && !monthlyStats && availableMonths.length === 0 && (
            <div className="text-center py-12">
              <Calendar className={`mx-auto h-12 w-12 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <div className={`text-lg mt-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>No usage data available</div>
              <p className={`text-sm mt-2 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>This lune machine hasn't recorded any button presses yet</p>
            </div>
          )}
        </div>

        {message && (
          <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-600 border border-red-200' 
              : 'bg-green-50 text-green-600 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default LuneDetail;
