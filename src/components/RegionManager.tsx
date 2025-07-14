import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MapPin, Eye, EyeOff, AlertTriangle, Wifi, WifiOff, CheckCircle, Database } from 'lucide-react';
import { Region } from '../types/region';
import { useRegions } from '../hooks/useRegions';
import { getRegionStats } from '../utils/seedRegions';

export const RegionManager: React.FC = () => {
  const { regions, loading, error, addRegion, updateRegion, deleteRegion } = useRegions();
  const [showForm, setShowForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    active: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [regionStats, setRegionStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    names: string[];
  } | null>(null);

  // Load region statistics on component mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getRegionStats();
        setRegionStats(stats);
      } catch (err) {
        console.error('Failed to load region stats:', err);
      }
    };

    if (!loading && !error) {
      loadStats();
    }
  }, [loading, error, regions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      if (editingRegion) {
        await updateRegion(editingRegion.id!, formData);
      } else {
        await addRegion(formData);
      }
      
      resetForm();
    } catch (error: any) {
      console.error('Error saving region:', error);
      setFormError(error.message || 'Failed to save region');
    }
  };

  const handleEdit = (region: Region) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      active: region.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone and may affect existing campaigns.`)) {
      try {
        await deleteRegion(id);
      } catch (error) {
        console.error('Error deleting region:', error);
        // Error handling is done in the hook
      }
    }
  };

  const handleToggleActive = async (region: Region) => {
    try {
      await updateRegion(region.id!, { active: !region.active });
    } catch (error) {
      console.error('Error toggling region status:', error);
      // Error handling is done in the hook
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      active: true,
    });
    setEditingRegion(null);
    setShowForm(false);
    setFormError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading regions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Region Management</h2>
          <p className="text-gray-600 mt-1">Manage geographic regions for campaign targeting</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Database Connection Status */}
          <div className="flex items-center gap-2">
            {error ? (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Offline</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Region
          </button>
        </div>
      </div>

      {/* Database Error Alert */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">
                Database Connection Issue
              </h3>
              <p className="text-sm text-yellow-700">
                {error}. Showing demo data. Changes will not be saved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Region Statistics */}
      {regionStats && !error && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                📍 Region Collection Initialized
              </h3>
              <p className="text-sm text-green-700">
                {regionStats.total} regions loaded ({regionStats.active} active, {regionStats.inactive} inactive)
              </p>
              {regionStats.names.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Available: {regionStats.names.join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Region List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {regions.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">No regions found</p>
            <p className="text-sm text-gray-500">
              {error 
                ? 'Database connection issue - using demo data'
                : 'Create your first region to get started'
              }
            </p>
            {!error && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
                <div className="flex items-center gap-2 text-blue-800">
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-medium">Auto-Seeding Available</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  The system will automatically populate with standard Italian regions when you add your first region.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {regions.map((region) => (
                  <tr key={region.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{region.name}</div>
                          <div className="text-sm text-gray-500">ID: {region.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(region)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          region.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {region.active ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {region.createdAt ? new Date(region.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(region)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(region.id!, region.name)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Region Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingRegion ? 'Edit Region' : 'Add New Region'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Lombardia, Toscana, National"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Geographic region for campaign targeting
                </p>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleChange}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Inactive regions won't appear in campaign forms
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingRegion ? 'Update Region' : 'Add Region'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};