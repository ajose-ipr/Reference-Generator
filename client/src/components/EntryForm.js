import { useState } from 'react';
import { useData } from '../context/DataContext';

export default function EntryForm({ entry = null, onSuccess, onCancel }) {
  const { dropdownOptions, createEntry, updateEntry, addCustomOption } = useData();
  const [formData, setFormData] = useState({
    PARTICULARS: entry?.PARTICULARS || '',
    CLIENT_CODE: entry?.CLIENT_CODE || '',
    CAPACITY_MW: entry?.CAPACITY_MW || '',
    SITE_NAME: entry?.SITE_NAME || '',
    STATE_NAME: entry?.STATE_NAME || ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [showCustomParticulars, setShowCustomParticulars] = useState(false);
  const [customParticulars, setCustomParticulars] = useState('');

  const [showCustomClients, setShowCustomClients] = useState(false);
  const [customClients, setCustomClients] = useState('');

  const [showCustomSites, setShowCustomSites] = useState(false);
  const [customSites, setCustomSites] = useState('');

  const [showCustomStates, setShowCustomStates] = useState(false);
  const [customStates, setCustomStates] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.PARTICULARS) {
      newErrors.PARTICULARS = 'Particulars is required';
    }
    
    if (!formData.CLIENT_CODE) {
      newErrors.CLIENT_CODE = 'Client Code is required';
    } else if (formData.CLIENT_CODE.length < 2 || formData.CLIENT_CODE.length > 4) {
      newErrors.CLIENT_CODE = 'Client Code must be between 2-4 characters';
    }

    const capacityValue = parseFloat(formData.CAPACITY_MW);
    if (!formData.CAPACITY_MW) {
      newErrors.CAPACITY_MW = 'Capacity is required';
    } else if (isNaN(capacityValue) || capacityValue <= 0)  {
      newErrors.CAPACITY_MW = 'Capacity must be a positive number';
    }

    if (!formData.STATE_NAME) {
      newErrors.STATE_NAME = 'State Name is required';
    } else if (formData.STATE_NAME.length < 2 || formData.STATE_NAME.length > 4) {
      newErrors.STATE_NAME = 'State Name must be between 2-4 characters';
    }
    
    if (!formData.SITE_NAME) {
      newErrors.SITE_NAME = 'Site Name is required';
    } else if (formData.SITE_NAME.length < 2 || formData.SITE_NAME.length > 4) {
      newErrors.SITE_NAME = 'Site Name must be between 2-4 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {

      if (showCustomParticulars && customParticulars.trim()) {
        await handleCustomOption('PARTICULARS', customParticulars.trim());
      }
      if (showCustomClients && customClients.trim()) {
        await handleCustomOption('CLIENT_CODE', customClients.trim());
      }
      if (showCustomSites && customSites.trim()) {  
        await handleCustomOption('SITE_NAME', customSites.trim());
      }
      if (showCustomStates && customStates.trim()) {
        await handleCustomOption('STATE_NAME', customStates.trim());
      }

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
          SITE_NAME: '',
          STATE_NAME: ''
        });
        setCustomParticulars('');
        setCustomClients('');
        setCustomSites('');
        setCustomStates('');

        setShowCustomParticulars(false);
        setShowCustomClients(false);
        setShowCustomSites(false);
        setShowCustomStates(false);
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
                  value={showCustomParticulars ? 'OTHERS' : formData.PARTICULARS}
                  onChange={(e) => {
                    const isOther = e.target.value === 'OTHERS';
                    setShowCustomParticulars(isOther);
                    if (!isOther) {
                      setFormData({...formData, PARTICULARS: e.target.value});
                      setCustomParticulars('');
                    } else {
                      setFormData({...formData, PARTICULARS: customParticulars});
                    }
                  }}
                  required
                >
                  <option value="">Select...</option>
                  {dropdownOptions.PARTICULARS?.filter(opt => !opt.value.includes('(Custom)')).map(opt => (
                    <option key={opt._id} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                  <option value="OTHERS">OTHERS (Custom)</option>
                </select>
                {showCustomParticulars && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className={`form-control ${errors.PARTICULARS ? 'is-invalid' : ''}`}
                      value={customParticulars}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setCustomParticulars(val);
                        setFormData({ ...formData, PARTICULARS: val });
                      }}
                      placeholder="Enter custom particulars"
                      required
                    />
                  </div>
                )}
                {errors.PARTICULARS && (
                  <div className="invalid-feedback">{errors.PARTICULARS}</div>
                )}
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Client Code *</label>
                <select
                  className={`form-select ${errors.CLIENT_CODE ? 'is-invalid' : ''}`}
                  value={showCustomClients ? 'OTHERS' : formData.CLIENT_CODE}
                  onChange={(e) => {
                    const isOther = e.target.value === 'OTHERS';
                    setShowCustomClients(isOther);
                    if (!isOther) {
                      setFormData({...formData, CLIENT_CODE: e.target.value});
                      setCustomClients('');
                    } else {
                      setFormData({...formData, CLIENT_CODE: customClients});
                    }
                  }}
                  required
                >
                  <option value="">Select...</option>
                  {dropdownOptions.CLIENT_CODE?.filter(opt => !opt.value.includes('(Custom)')).map(opt => (
                    <option key={opt._id} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                  <option value="OTHERS">OTHERS (Custom)</option>
                </select>
                {showCustomClients && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className={`form-control ${errors.CLIENT_CODE ? 'is-invalid' : ''}`}
                      value={customClients}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setCustomClients(val);
                        setFormData({...formData, CLIENT_CODE: val});
                      }}
                      placeholder="Enter custom client code"
                      required
                    />
                  </div>
                )}
                {errors.CLIENT_CODE && (
                  <div className="invalid-feedback">{errors.CLIENT_CODE}</div>
                )}
              </div>
            </div>
            
            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Capacity (MW) *</label>
                <input
                  type="text"
                  className={`form-control ${errors.CAPACITY_MW ? 'is-invalid' : ''}`}
                  value={formData.CAPACITY_MW}
                  onChange={(e) => setFormData({ ...formData, CAPACITY_MW: e.target.value })}
                  required
                />
                {errors.CAPACITY_MW && (
                  <div className="invalid-feedback">{errors.CAPACITY_MW}</div>
                )}
              </div>
            </div>

            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">State Name *</label>
                <select
                  className={`form-select ${errors.STATE_NAME ? 'is-invalid' : ''}`}
                  value={showCustomStates ? 'OTHERS' : formData.STATE_NAME}
                  onChange={(e) => {
                    const isOther = e.target.value === 'OTHERS';
                    setShowCustomStates(isOther);
                    if (!isOther) {
                      setFormData({...formData, STATE_NAME: e.target.value});
                      setCustomStates('');
                    } else {
                      setFormData({...formData, STATE_NAME: customStates});
                    }
                  }}
                  required
                >
                  <option value="">Select...</option>
                  {dropdownOptions.STATE_NAME?.filter(opt => !opt.value.includes('(Custom)')).map(opt => (
                    <option key={opt._id} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                  <option value="OTHERS">OTHERS (Custom)</option>
                </select>
                {showCustomStates && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className={`form-control ${errors.STATE_NAME ? 'is-invalid' : ''}`}
                      value={customStates}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setCustomStates(val);
                        setFormData({ ...formData, STATE_NAME: val });
                      }}
                      placeholder="Enter custom state name"
                      required
                    />
                  </div>
                )}
                {errors.STATE_NAME && (
                  <div className="invalid-feedback">{errors.STATE_NAME}</div>
                )}
              </div>
            </div>

            <div className="col-md-3">
              <div className="mb-3">
                <label className="form-label">Site Name *</label>
                <select
                  className={`form-select ${errors.SITE_NAME ? 'is-invalid' : ''}`}
                  value={showCustomSites ? 'OTHERS' : formData.SITE_NAME}
                  onChange={(e) => {
                    const isOther = e.target.value === 'OTHERS';
                    setShowCustomSites(isOther);
                    if (!isOther) {
                      setFormData({...formData, SITE_NAME: e.target.value});
                      setCustomSites('');
                    } else {
                      setFormData({...formData, SITE_NAME: customSites});
                    }
                  }}
                  required
                >
                  <option value="">Select...</option>
                  {dropdownOptions.SITE_NAME?.filter(opt => !opt.value.includes('(Custom)')).map(opt => (
                    <option key={opt._id} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                  <option value="OTHERS">OTHERS (Custom)</option>
                </select>
                {showCustomSites && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className={`form-control ${errors.SITE_NAME ? 'is-invalid' : ''}`}
                      value={customSites}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setCustomSites(val);
                        setFormData({ ...formData, SITE_NAME: val });
                      }}
                      placeholder="Enter custom site name"
                      required
                    />
                  </div>
                )}
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