// API service for making HTTP requests to the backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://enamel-backend.onrender.com';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    console.log(`Making API request to: ${url}`);
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Dental Offices
  async getDentalOffices() {
    return this.request('/api/dental-offices');
  }

  async createDentalOffice(officeData) {
    return this.request('/api/dental-offices', {
      method: 'POST',
      body: officeData,
    });
  }

  async updateDentalOffice(id, officeData) {
    return this.request(`/api/dental-offices/${id}`, {
      method: 'PUT',
      body: officeData,
    });
  }

  async deleteDentalOffice(id) {
    return this.request(`/api/dental-offices/${id}`, {
      method: 'DELETE',
    });
  }

  // Machines
  async getMachines() {
    return this.request('/api/machines');
  }

  async createMachine(machineData) {
    return this.request('/api/machines', {
      method: 'POST',
      body: machineData,
    });
  }

  async updateMachine(id, machineData) {
    return this.request(`/api/machines/${id}`, {
      method: 'PUT',
      body: machineData,
    });
  }

  async deleteMachine(id) {
    return this.request(`/api/machines/${id}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
