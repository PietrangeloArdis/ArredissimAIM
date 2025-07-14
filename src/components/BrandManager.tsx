import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Building2, Eye, EyeOff, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Brand } from '../types/brand';
import { useBrands } from '../hooks/useBrands';
import { useChannels } from '../hooks/useChannels';

export const BrandManager: React.FC = () => {
  const { brands, loading, error, addBrand, updateBrand, deleteBrand } = useBrands();
  const { getActiveChannels } = useChannels();
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    channels: [] as string[],
    active: true,
  });

  const availableChannels = getActiveChannels();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id!, formData);
      } else {
        await addBrand(formData);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving brand:', error);
      // Error handling is done in the hook
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      channels: [...brand.channels],
      active: brand.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      try {
        await deleteBrand(id);
      } catch (error) {
        console.error('Error deleting brand:', error);
        // Error handling is done in the hook
      }
    }
  };

  const handleToggleActive = async (brand: Brand) => {
    try {
      await updateBrand(brand.id!, { active: !brand.active });
    } catch (error) {
      console.error('Error toggling brand status:', error);
      // Error handling is done in the hook
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      channels: [],
      active: true,
    });
    setEditingBrand(null);
    setShowForm(false);
  };

  const handleChannelToggle = (channelName: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channelName)
        ? prev.channels.filter(c => c !== channelName)
        : [...prev.channels, channelName]
    }));
  };

  const getChannelColor = (channelName: string) => {
    const channel = availableChannels.find(c => c.name === channelName);
    if (channel?.color) {
      return {
        backgroundColor: channel.color + '20', // 20% opacity
        color: channel.color,
        borderColor: channel.color + '40', // 40% opacity
      };
    }
    return {
      backgroundColor: '#f3f4f6',
      color: '#6b7280',
      borderColor: '#d1d5db',
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading brands...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Brand Management</h2>
          <p className="text-gray-600 mt-1">Manage brands and their associated channels</p>
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
            Add Brand
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

      {/* Brand List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {brands.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">No brands found</p>
            <p className="text-sm text-gray-500">Create your first brand to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channels</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                          <div className="text-sm text-gray-500">ID: {brand.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {brand.channels.map((channelName) => {
                          const channelStyle = getChannelColor(channelName);
                          return (
                            <span
                              key={channelName}
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border"
                              style={channelStyle}
                            >
                              {channelName}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(brand)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          brand.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {brand.active ? (
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
                      {brand.createdAt ? new Date(brand.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(brand)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(brand.id!)}
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

      {/* Brand Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingBrand ? 'Edit Brand' : 'Add New Brand'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., FC, ILMI, ArredissimA"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Channels
                  {availableChannels.length === 0 && (
                    <span className="text-xs text-red-500 ml-1">(No active channels available)</span>
                  )}
                </label>
                {availableChannels.length === 0 ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      No active channels are available. Please add channels first in Channel Management.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableChannels.map((channel) => {
                      const channelStyle = getChannelColor(channel.name);
                      return (
                        <label
                          key={channel.id}
                          className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.channels.includes(channel.name)}
                            onChange={() => handleChannelToggle(channel.name)}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span 
                            className="text-sm font-medium px-2 py-1 rounded"
                            style={{
                              backgroundColor: channelStyle.backgroundColor,
                              color: channelStyle.color,
                            }}
                          >
                            {channel.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {formData.channels.length === 0 && availableChannels.length > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    Please select at least one channel
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Inactive brands won't appear in campaign forms
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={formData.channels.length === 0 || availableChannels.length === 0}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 inline mr-2" />
                  {editingBrand ? 'Update Brand' : 'Add Brand'}
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