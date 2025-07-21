import { useState } from 'react';
import { useData } from '../context/DataContext';

export default function EntryForm({ entry = null, onSuccess, onCancel }) {
  const { dropdownOptions, createEntry, updateEntry, addCustomOption } = useData();
  const [formData, setFormData] = useState({
    PARTICULARS: entry?.PARTICULARS || '',
    CLIENT_CODE: entry?.CLIENT_CODE || '',
    CAPACITY_MW: entry?.CAPACITY_MW || '',
    SITE_NAME: entry?.SITE_NAME || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.PARTICULARS) {
      newErrors.PARTICULARS = 'Particulars is required';
    }
    
    if (!formData.CLIENT_CODE) {
      newErrors.CLIENT_CODE = 'Client Code is required';
    } else if (formData.CLIENT_CODE.length !== 4) {
      newErrors.CLIENT_CODE = 'Client Code must be exactly 4 characters';
    }
    
    if (!formData.CAPACITY_MW) {
      newErrors.CAPACITY_MW = 'Capacity is required';
    } else if (formData.CAPACITY_MW <= 0) {
      newErrors.CAPACITY_MW = 'Capacity must be positive';
    }
    
    if (!formData.SITE_NAME) {
      newErrors.SITE_NAME = 'Site Name is required';
    } else if (formData.SITE_NAME.length !== 4) {
      newErrors.SITE_NAME = 'Site Name must be exactly 4 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (entry) {
        await updateEntry(entry._id, formData);
      } else {
        await createEntry(formData);
      }
      
      // Reset form if creating new entry
      if (!entry) {
        setFormData({
          PARTICULARS: '',
          CLIENT_CODE: '',
          CAPACITY_MW: '',
          SITE_NAME: ''
        });
      }
      
      onSuccess?.();
    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.error || 'An error occurred' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomOption = async (type, value) => {
    if (value && value.length > 0) {
      const existingOptions = dropdownOptions[type] || [];
      const exists = existingOptions.find(opt => 
        opt.value.toUpperCase() === value.toUpperCase()
      );
      
      if (!exists) {
        try {
          await addCustomOption(type, value);
        } catch (error) {
          console.error('Error adding custom option:', error);
        }
      }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>{entry ? 'Edit Entry' : 'Create New Entry'}</h5>
      </div>
      <div className="card-body">
        {errors.submit && (
          <div className="alert alert-danger">{errors.submit}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Particulars *</label>
                <select
                  className={`form-select ${errors.PARTICULARS ? 'is-invalid' : ''}`}
                  value={formData.PARTICULARS}
                  onChange={(e) => setFormData({...formData, PARTICULARS: e.target.value})}
                  required
                >
                  <option value="">Select...</option>
                  {dropdownOptions.PARTICULARS?.map(opt => (
                    <option key={opt._id} value={opt.value}>
                      {opt.value} {opt.isCustom && '(Custom)'}
                    </option>
                  ))}
                </select>
                {errors.PARTICULARS && (
                  <div className="invalid-feedback">{errors.PARTICULARS}</div>
                )}
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Client Code (4 chars) *</label>
                <input
                  type="text"
                  className={`form-control ${errors.CLIENT_CODE ? 'is-invalid' : ''}`}
                  value={formData.CLIENT_CODE}
                  onChange={(e) => setFormData({...formData, CLIENT_CODE: e.target.value.toUpperCase()})}
                  onBlur={(e) => handleCustomOption('CLIENT_CODE', e.target.value)}
                  maxLength="4"
                  required
                />
                {errors.CLIENT_CODE && (
                  <div className="invalid-feedback">{errors.CLIENT_CODE}</div>
                )}
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Capacity (MW) *</label>
                <input
                  type="number"
                  className={`form-control ${errors.CAPACITY_MW ? 'is-invalid' : ''}`}
                  value={formData.CAPACITY_MW}
                  onChange={(e) => setFormData({...formData, CAPACITY_MW: parseFloat(e.target.value)})}
                  min="0.1"
                  step="0.1"
                  required
                />
                {errors.CAPACITY_MW && (
                  <div className="invalid-feedback">{errors.CAPACITY_MW}</div>
                )}
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Site Name (4 chars) *</label>
                <input
                  type="text"
                  className={`form-control ${errors.SITE_NAME ? 'is-invalid' : ''}`}
                  value={formData.SITE_NAME}
                  onChange={(e) => setFormData({...formData, SITE_NAME: e.target.value.toUpperCase()})}
                  onBlur={(e) => handleCustomOption('SITE_NAME', e.target.value)}
                  maxLength="4"
                  required
                />
                {errors.SITE_NAME && (
                  <div className="invalid-feedback">{errors.SITE_NAME}</div>
                )}
              </div>
            </div>
          </div>
          
          <div className="d-flex gap-2">
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              {loading ? 'Processing...' : (entry ? 'Update Entry' : 'Generate Reference')}
            </button>
            {onCancel && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}