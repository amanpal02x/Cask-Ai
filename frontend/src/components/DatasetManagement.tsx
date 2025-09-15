import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  Download, 
  Info, 
  AlertCircle, 
  CheckCircle,
  FileText,
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  ExternalLink,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface DatasetInfo {
  id: string;
  name: string;
  source: string;
  description: string;
  version: string;
  sampleCount: number;
  accuracy: number;
  lastUpdated: string;
  size: string;
  format: string;
  exercises: string[];
  contributors: string[];
  license: string;
  downloadUrl?: string;
  documentationUrl?: string;
}

interface CustomDataset {
  id: string;
  name: string;
  description: string;
  file: File;
  exerciseType: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  progress: number;
  createdAt: string;
}

const DatasetManagement: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [customDatasets, setCustomDatasets] = useState<CustomDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'custom'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    exerciseType: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      // Mock data - in real implementation, this would come from API
      const mockDatasets: DatasetInfo[] = [
        {
          id: '1',
          name: 'CaskAI Exercise Dataset v2.1',
          source: 'CaskAI Research Team',
          description: 'Comprehensive dataset of exercise form analysis with pose landmarks and form validation data.',
          version: '2.1.0',
          sampleCount: 15420,
          accuracy: 94.2,
          lastUpdated: '2024-01-15',
          size: '2.3 GB',
          format: 'JSON + Images',
          exercises: ['Squat', 'Push-up', 'Plank', 'Lunge', 'Burpee'],
          contributors: ['Dr. Sarah Johnson', 'Prof. Michael Chen', 'AI Research Lab'],
          license: 'MIT',
          downloadUrl: 'https://github.com/caskai/datasets',
          documentationUrl: 'https://docs.caskai.com/datasets'
        },
        {
          id: '2',
          name: 'PoseNet Exercise Validation Dataset',
          source: 'Google Research',
          description: 'High-quality pose estimation data for exercise form validation.',
          version: '1.8.2',
          sampleCount: 8750,
          accuracy: 91.5,
          lastUpdated: '2023-12-20',
          size: '1.8 GB',
          format: 'TensorFlow',
          exercises: ['Squat', 'Push-up', 'Plank'],
          contributors: ['Google AI Team'],
          license: 'Apache 2.0',
          downloadUrl: 'https://github.com/google/mediapipe',
          documentationUrl: 'https://mediapipe.dev/'
        },
        {
          id: '3',
          name: 'Fitness Form Analysis Dataset',
          source: 'OpenAI Research',
          description: 'Multi-modal dataset combining pose landmarks with exercise form analysis.',
          version: '3.0.1',
          sampleCount: 22100,
          accuracy: 96.8,
          lastUpdated: '2024-02-01',
          size: '3.1 GB',
          format: 'JSON + Video',
          exercises: ['Squat', 'Push-up', 'Plank', 'Lunge', 'Burpee', 'Mountain Climber'],
          contributors: ['OpenAI Research Team'],
          license: 'MIT',
          downloadUrl: 'https://github.com/openai/datasets',
          documentationUrl: 'https://openai.com/research'
        }
      ];

      setDatasets(mockDatasets);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name || !uploadForm.exerciseType) {
      return;
    }

    const newDataset: CustomDataset = {
      id: Date.now().toString(),
      name: uploadForm.name,
      description: uploadForm.description,
      file: uploadForm.file,
      exerciseType: uploadForm.exerciseType,
      status: 'uploading',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    setCustomDatasets(prev => [...prev, newDataset]);
    setShowUploadModal(false);
    setUploadForm({ name: '', description: '', exerciseType: '', file: null });

    // Simulate upload progress
    const interval = setInterval(() => {
      setCustomDatasets(prev => 
        prev.map(ds => 
          ds.id === newDataset.id 
            ? { ...ds, progress: Math.min(ds.progress + 10, 100) }
            : ds
        )
      );
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      setCustomDatasets(prev => 
        prev.map(ds => 
          ds.id === newDataset.id 
            ? { ...ds, status: 'processing', progress: 100 }
            : ds
        )
      );
    }, 5000);

    setTimeout(() => {
      setCustomDatasets(prev => 
        prev.map(ds => 
          ds.id === newDataset.id 
            ? { ...ds, status: 'ready' }
            : ds
        )
      );
    }, 8000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-50 border-green-200';
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'uploading': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <BarChart3 className="h-4 w-4" />;
      case 'uploading': return <Upload className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Dataset Management</h3>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Dataset
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dataset Overview
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload Custom Data
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'custom'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Datasets
          </button>
        </div>

        {/* Dataset Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Dataset Sources</h4>
              <p className="text-sm text-blue-700 mb-3">
                Our exercise form analysis is powered by multiple high-quality datasets from leading research institutions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-600">
                <div>
                  <strong>Total Samples:</strong> {datasets.reduce((sum, ds) => sum + ds.sampleCount, 0).toLocaleString()}
                </div>
                <div>
                  <strong>Average Accuracy:</strong> {Math.round(datasets.reduce((sum, ds) => sum + ds.accuracy, 0) / datasets.length)}%
                </div>
                <div>
                  <strong>Exercise Types:</strong> {new Set(datasets.flatMap(ds => ds.exercises)).size}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {datasets.map((dataset) => (
                <div key={dataset.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{dataset.name}</h4>
                      <p className="text-sm text-gray-600">{dataset.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {dataset.accuracy}% accuracy
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary-600">{dataset.sampleCount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Samples</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{dataset.version}</div>
                      <div className="text-xs text-gray-500">Version</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{dataset.size}</div>
                      <div className="text-xs text-gray-500">Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{dataset.exercises.length}</div>
                      <div className="text-xs text-gray-500">Exercises</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Source: {dataset.source}</span>
                      <span>License: {dataset.license}</span>
                      <span>Updated: {new Date(dataset.lastUpdated).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {dataset.downloadUrl && (
                        <a
                          href={dataset.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </a>
                      )}
                      {dataset.documentationUrl && (
                        <a
                          href={dataset.documentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Docs
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Custom Data Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-2">Upload Your Own Dataset</h4>
              <p className="text-sm text-green-700 mb-3">
                Contribute to improving our exercise form analysis by uploading your own dataset.
              </p>
              <div className="text-xs text-green-600">
                <strong>Supported formats:</strong> JSON, CSV, Images (JPG, PNG), Videos (MP4, MOV)
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Upload Dataset</h3>
              <p className="mt-1 text-sm text-gray-500">
                Drag and drop your dataset files here, or click to browse
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Dataset Requirements</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Include pose landmark coordinates (x, y, z, visibility)
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Provide exercise labels and form quality scores
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Include metadata (exercise type, difficulty, duration)
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  Ensure data quality and consistency
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* My Datasets Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            {customDatasets.length === 0 ? (
              <div className="text-center py-8">
                <Database className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No custom datasets</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload your first dataset to get started
                </p>
              </div>
            ) : (
              customDatasets.map((dataset) => (
                <div key={dataset.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{dataset.name}</h4>
                      <p className="text-sm text-gray-600">{dataset.description}</p>
                    </div>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(dataset.status)}`}>
                      {getStatusIcon(dataset.status)}
                      <span className="ml-1 capitalize">{dataset.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary-600">{dataset.exerciseType}</div>
                      <div className="text-xs text-gray-500">Exercise Type</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{dataset.file.size.toLocaleString()} bytes</div>
                      <div className="text-xs text-gray-500">File Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{dataset.progress}%</div>
                      <div className="text-xs text-gray-500">Progress</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{new Date(dataset.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">Uploaded</div>
                    </div>
                  </div>

                  {dataset.status === 'uploading' && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${dataset.progress}%` }}
                      ></div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>File: {dataset.file.name}</span>
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Upload Dataset</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dataset Name
                    </label>
                    <input
                      type="text"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter dataset name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Describe your dataset"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exercise Type
                    </label>
                    <select
                      value={uploadForm.exerciseType}
                      onChange={(e) => setUploadForm({ ...uploadForm, exerciseType: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select exercise type</option>
                      <option value="squat">Squat</option>
                      <option value="pushup">Push-up</option>
                      <option value="plank">Plank</option>
                      <option value="lunge">Lunge</option>
                      <option value="burpee">Burpee</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dataset File
                    </label>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".json,.csv,.jpg,.jpeg,.png,.mp4,.mov"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowUploadModal(false)}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={!uploadForm.name || !uploadForm.exerciseType || !uploadForm.file}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Upload Dataset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetManagement;
