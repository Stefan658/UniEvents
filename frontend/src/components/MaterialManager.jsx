import React, { useState, useEffect } from 'react';
import { getEventMaterials, uploadMaterial, deleteMaterial } from '../api/materials';
import Loader from './Loader';
import ErrorMessage from './ErrorMessage';
import Button from './Button';
import InputField from './InputField';
import { FileText, Plus, Trash2, ExternalLink } from 'lucide-react';

const MaterialManager = ({ eventId }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Upload form state
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, [eventId]);

  const fetchMaterials = async () => {
    try {
      const data = await getEventMaterials(eventId);
      setMaterials(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileName || !fileUrl) return;
    setUploading(true);
    setError('');
    
    // Simple file type detection based on extension
    const extension = fileUrl.split('.').pop().toLowerCase();
    let fileType = 'application/octet-stream';
    if (['pdf'].includes(extension)) fileType = 'application/pdf';
    else if (['doc', 'docx'].includes(extension)) fileType = 'application/msword';
    else if (['zip', 'rar'].includes(extension)) fileType = 'application/zip';
    else if (['jpg', 'jpeg', 'png', 'svg'].includes(extension)) fileType = 'image/' + (extension === 'jpg' ? 'jpeg' : extension);

    try {
      await uploadMaterial({ 
        event_id: eventId, 
        file_name: fileName, 
        file_url: fileUrl,
        file_type: fileType
      });
      setFileName('');
      setFileUrl('');
      fetchMaterials();
    } catch (err) {
      setError(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    try {
      await deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      setError(err);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <ErrorMessage message={error} />

      {/* Upload Form */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Add New Material</h4>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <InputField
            label="File Name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="e.g. Course Slides"
            className="!mb-0"
            required
          />
          <InputField
            label="File URL"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://example.com/file.pdf"
            className="!mb-0"
            required
          />
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" isLoading={uploading} disabled={!fileName || !fileUrl}>
              <Plus className="w-4 h-4 mr-2" /> Add Material
            </Button>
          </div>
        </form>
      </div>

      {/* Materials List */}
      <div className="space-y-3">
        {materials.length === 0 ? (
          <div className="text-center py-8 text-gray-400 italic">No materials uploaded yet.</div>
        ) : (
          materials.map((mat) => (
            <div key={mat.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600 mr-4">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">{mat.file_name}</div>
                  <div className="text-xs text-gray-400 truncate max-w-xs">{mat.file_url}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a href={mat.file_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="!p-2 h-10 w-10">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <Button variant="danger" className="!p-2 h-10 w-10" onClick={() => handleDelete(mat.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MaterialManager;
