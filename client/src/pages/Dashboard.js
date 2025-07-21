import { useState } from 'react';
import Navigation from '../components/Navigation';
import EntryForm from '../components/EntryForm';
import { useData } from '../context/DataContext';

export default function Dashboard() {
  const { entries, exportData } = useData();
  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  const handleExport = (format) => {
    exportData(format);
  };

  // Calculate statistics
  const stats = {
    total: entries.length,
    totalCapacity: entries.reduce((sum, entry) => sum + entry.CAPACITY_MW, 0),
    averageCapacity: entries.length > 0 ? 
      entries.reduce((sum, entry) => sum + entry.CAPACITY_MW, 0) / entries.length : 0,
    byParticulars: entries.reduce((acc, entry) => {
      acc[entry.PARTICULARS] = (acc[entry.PARTICULARS] || 0) + 1;
      return acc;
    }, {}),
    byClient: entries.reduce((acc, entry) => {
      acc[entry.CLIENT_CODE] = (acc[entry.CLIENT_CODE] || 0) + 1;
      return acc;
    }, {}),
    thisMonth: entries.filter(e => {
      const entryDate = new Date(e.CREATED_AT);
      const now = new Date();
      return entryDate.getMonth() === now.getMonth() && 
             entryDate.getFullYear() === now.getFullYear();
    }).length
  };

  return (
    <>
      <Navigation />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Dashboard</h1>
          <div className="btn-group">
            <button 
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Hide Form' : 'Create New Entry'}
            </button>
            <button 
              className="btn btn-outline-success"
              onClick={() => handleExport('csv')}
            >
              Export CSV
            </button>
            <button 
              className="btn btn-outline-info"
              onClick={() => handleExport('json')}
            >
              Export JSON
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mb-4">
            <EntryForm 
              onSuccess={handleFormSuccess}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Statistics Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Total Entries</h5>
                <h2 className="text-primary">{stats.total}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Total Capacity</h5>
                <h2 className="text-success">{stats.totalCapacity.toFixed(1)} MW</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Average Capacity</h5>
                <h2 className="text-info">{stats.averageCapacity.toFixed(1)} MW</h2>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">This Month</h5>
                <h2 className="text-warning">{stats.thisMonth}</h2>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="row">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>Entries by Particulars</h5>
              </div>
              <div className="card-body">
                {Object.keys(stats.byParticulars).length === 0 ? (
                  <p className="text-muted">No data available</p>
                ) : (
                  <div className="list-group">
                    {Object.entries(stats.byParticulars)
                      .sort(([,a], [,b]) => b - a)
                      .map(([particular, count]) => (
                        <div key={particular} className="list-group-item d-flex justify-content-between align-items-center">
                          <span className="badge bg-secondary">{particular}</span>
                          <span>
                            <span className="badge bg-primary rounded-pill">{count}</span>
                            <small className="text-muted ms-2">
                              ({((count / stats.total) * 100).toFixed(1)}%)
                            </small>
                          </span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h5>Entries by Client</h5>
              </div>
              <div className="card-body">
                {Object.keys(stats.byClient).length === 0 ? (
                  <p className="text-muted">No data available</p>
                ) : (
                  <div className="list-group">
                    {Object.entries(stats.byClient)
                      .sort(([,a], [,b]) => b - a)
                      .map(([client, count]) => (
                        <div key={client} className="list-group-item d-flex justify-content-between align-items-center">
                          <span className="badge bg-primary">{client}</span>
                          <span>
                            <span className="badge bg-success rounded-pill">{count}</span>
                            <small className="text-muted ms-2">
                              ({((count / stats.total) * 100).toFixed(1)}%)
                            </small>
                          </span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5>Recent Activity</h5>
              </div>
              <div className="card-body">
                {entries.length === 0 ? (
                  <p className="text-muted">No recent activity</p>
                ) : (
                  <div className="list-group">
                    {entries.slice(0, 10).map(entry => (
                      <div key={entry._id} className="list-group-item">
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">
                            <code className="small">{entry.REFERENCE_CODE}</code>
                          </h6>
                          <small>{new Date(entry.CREATED_AT).toLocaleString()}</small>
                        </div>
                        <p className="mb-1">
                          <span className="badge bg-secondary me-1">{entry.PARTICULARS}</span>
                          <span className="badge bg-primary me-1">{entry.CLIENT_CODE}</span>
                          <span className="badge bg-success me-1">{entry.CAPACITY_MW}MW</span>
                          <span className="badge bg-info">{entry.SITE_NAME}</span>
                        </p>
                        <small>
                          Created by: <strong>{entry.CREATED_BY}</strong>
                          {entry.MODIFIED_BY && (
                            <span className="text-muted">
                              • Last modified by: <strong>{entry.MODIFIED_BY}</strong>
                            </span>
                          )}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}