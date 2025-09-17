import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Edit, Eye, EyeOff, Building2, Monitor, AlertTriangle } from 'lucide-react';

const AdminPanel = () => {
  const { isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('offices');
  const [dentalOffices, setDentalOffices] = useState([]);
  const [luneMachines, setLuneMachines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingOffice, setEditingOffice] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      loadData();
    }
  }, [isAuthenticated, navigate, showDeleted]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Load dental offices
      const officesResponse = await fetch(`/api/dental-offices?includeDeleted=${showDeleted}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (officesResponse.ok) {
        const officesResult = await officesResponse.json();
        if (officesResult.success) {
          setDentalOffices(officesResult.data);
        }
      }

      // Load lune machines
      const lunesResponse = await fetch(`/api/lune-machines?includeDeleted=${showDeleted}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (lunesResponse.ok) {
        const lunesResult = await lunesResponse.json();
        if (lunesResult.success) {
          setLuneMachines(lunesResult.data);
        }
      }

    } catch (error) {
      setMessage('Error loading data. Please try again.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOffice = async (officeId) => {
    if (!window.confirm('Are you sure you want to delete this dental office? This will also delete all associated lune machines.')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/dental-offices/${officeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessage('Dental office deleted successfully');
        loadData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to delete office');
      }
    } catch (error) {
      setMessage('Error deleting dental office');
      console.error('Error:', error);
    }
  };

  const handleDeleteLune = async (luneId) => {
    if (!window.confirm('Are you sure you want to delete this lune machine?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/lune-machines/${luneId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessage('Lune machine deleted successfully');
        loadData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to delete lune machine');
      }
    } catch (error) {
      setMessage('Error deleting lune machine');
      console.error('Error:', error);
    }
  };

  const handleUpdateOffice = async (officeData) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/dental-offices/${editingOffice.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(officeData)
      });

      if (response.ok) {
        setMessage('Dental office updated successfully');
        setEditingOffice(null);
        loadData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error('Failed to update office');
      }
    } catch (error) {
      setMessage('Error updating dental office');
      console.error('Error:', error);
    }
  };

  const filteredOffices = dentalOffices.filter(office =>
    office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.npi_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.town.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLunes = luneMachines.filter(lune =>
    lune.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lune.office_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className={`p-2 rounded-full transition-colors duration-200 ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className={`text-3xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Admin Panel</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                showDeleted 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-white hover:bg-gray-100 text-gray-700 border'
              }`}
            >
              {showDeleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showDeleted ? 'Hide Deleted' : 'Show Deleted'}</span>
            </button>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="text-yellow-800 font-semibold">Admin Access</h3>
              <p className="text-yellow-700 text-sm">
                You have administrative privileges. Use caution when modifying or deleting records.
                {showDeleted && ' You are currently viewing deleted records.'}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
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
              placeholder="Search offices or lune machines..."
            />
          </div>
        </div>

        {/* Tabs */}
        <div className={`rounded-lg shadow-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('offices')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'offices'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span>Dental Offices ({filteredOffices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('lunes')}
              className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'lunes'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Monitor className="w-5 h-5" />
              <span>Lune Machines ({filteredLunes.length})</span>
            </button>
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className={`ml-3 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Loading data...
                </span>
              </div>
            )}

            {!loading && activeTab === 'offices' && (
              <div>
                {filteredOffices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className={`w-full border rounded-lg ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Office Name</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>NPI ID</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Location</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Lunes</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Status</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
                        {filteredOffices.map((office) => (
                          <tr key={office.id} className={`${
                            office.is_deleted ? 'opacity-60' : ''
                          } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <td className={`px-4 py-3 text-sm font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {office.name}
                            </td>
                            <td className={`px-4 py-3 text-sm font-mono ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {office.npi_id}
                            </td>
                            <td className={`px-4 py-3 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {office.town}, {office.state}
                            </td>
                            <td className={`px-4 py-3 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {office.lune_count}
                            </td>
                            <td className={`px-4 py-3 text-sm`}>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                office.is_deleted 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {office.is_deleted ? 'Deleted' : 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => navigate(`/office/${office.id}`)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {!office.is_deleted && (
                                  <>
                                    <button
                                      onClick={() => setEditingOffice(office)}
                                      className="text-green-600 hover:text-green-800 p-1"
                                      title="Edit Office"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOffice(office.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Delete Office"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className={`mx-auto h-12 w-12 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <div className={`text-lg mt-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>No dental offices found</div>
                  </div>
                )}
              </div>
            )}

            {!loading && activeTab === 'lunes' && (
              <div>
                {filteredLunes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className={`w-full border rounded-lg ${
                      isDarkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}>
                      <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Serial Number</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Dental Office</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Purchase Date</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Status</th>
                          <th className={`px-4 py-3 text-left text-sm font-medium ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-gray-600' : 'divide-gray-200'}`}>
                        {filteredLunes.map((lune) => (
                          <tr key={lune.id} className={`${
                            lune.is_deleted ? 'opacity-60' : ''
                          } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <td className={`px-4 py-3 text-sm font-mono font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {lune.serial_number}
                            </td>
                            <td className={`px-4 py-3 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {lune.office_name}
                            </td>
                            <td className={`px-4 py-3 text-sm ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {new Date(lune.purchase_date).toLocaleDateString()}
                            </td>
                            <td className={`px-4 py-3 text-sm`}>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                lune.is_deleted 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {lune.is_deleted ? 'Deleted' : 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => navigate(`/lune/${lune.id}`)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {!lune.is_deleted && (
                                  <button
                                    onClick={() => handleDeleteLune(lune.id)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Delete Lune"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Monitor className={`mx-auto h-12 w-12 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <div className={`text-lg mt-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>No lune machines found</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit Office Modal */}
        {editingOffice && (
          <EditOfficeModal
            office={editingOffice}
            isDarkMode={isDarkMode}
            onSave={handleUpdateOffice}
            onCancel={() => setEditingOffice(null)}
          />
        )}

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

// Edit Office Modal Component
const EditOfficeModal = ({ office, isDarkMode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: office.name,
    state: office.state,
    town: office.town,
    address: office.address,
    phone_number: office.phone_number || '',
    email: office.email || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`max-w-2xl w-full mx-4 rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="p-6">
          <h2 className={`text-xl font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-800'
          }`}>Edit Dental Office</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Office Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Town</label>
                <input
                  type="text"
                  value={formData.town}
                  onChange={(e) => setFormData({...formData, town: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
