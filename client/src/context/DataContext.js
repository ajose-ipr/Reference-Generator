import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({
    PARTICULARS: [],
    CLIENT_CODE: [],
    SITE_NAME: [],
    STATE_NAME: []
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  useEffect(() => {
    if (user) {
      fetchDropdownOptions();
      fetchEntries();
    } else {
      // Reset data when user logs out
      setEntries([]);
      setDropdownOptions({
        PARTICULARS: [],
        CLIENT_CODE: [],
        SITE_NAME: [],
        STATE_NAME: []
      });
      setPagination({
        currentPage: 1,
        totalPages: 1,
        total: 0
      });
    }
  }, [user]);

  const fetchEntries = async (page = 1, search = '', sortBy = 'SL_NO', sortOrder = 'desc') => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await axios.get('/api/entries', {
        params: { page, search, sortBy, sortOrder, limit: 20 },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.entries) {
        setEntries(response.data.entries);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          total: response.data.total
        });
      } else {
        setEntries(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      if (error.response?.status === 401) {
        // Token expired, handled by AuthContext
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownOptions = async () => {
    if (!user) return;
    try {
      const [particulars, clients, sites, states] = await Promise.all([
        axios.get('/api/dropdown-options/PARTICULARS', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/dropdown-options/CLIENT_CODE', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('/api/dropdown-options/SITE_NAME', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }), 
        axios.get('/api/dropdown-options/STATE_NAME', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      setDropdownOptions({
        PARTICULARS: particulars.data || [],
        CLIENT_CODE: clients.data || [],
        SITE_NAME: sites.data || [],
        STATE_NAME: states.data || [],
      });
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  };

  const createEntry = async (entryData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await axios.post('/api/entries', entryData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchEntries(); // Refresh the list
      return response.data;
    } catch (error) {
      console.error('Error creating entry:', error);
      throw error;
    }
  };

  const updateEntry = async (id, entryData) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await axios.put(`/api/entries/${id}`, entryData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchEntries(); // Refresh the list
      return response.data;
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await axios.delete(`/api/entries/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchEntries(); // Refresh the list
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };

  const addCustomOption = async (type, value) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      await axios.post('/api/dropdown-options', { type, value }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      await fetchDropdownOptions(); // Refresh dropdown options
    } catch (error) {
      console.error('Error adding custom option:', error);
      throw error;
    }
  };

  const exportData = async (format = 'csv', filters = {}) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const params = new URLSearchParams(filters).toString();
      const url = `/api/export/${format}?${params}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  };

  const getStats = async () => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await axios.get('/api/export/stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  };

  const value = {
    entries,
    dropdownOptions,
    loading,
    pagination,
    fetchEntries,
    fetchDropdownOptions,
    createEntry,
    updateEntry,
    deleteEntry,
    addCustomOption,
    exportData,
    getStats
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}