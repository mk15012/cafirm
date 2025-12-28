'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';

interface Document {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  firm: {
    id: string;
    name: string;
    client: { id: string; name: string };
  };
  task?: { id: string; title: string };
  uploadedBy: { id: string; name: string };
  createdAt: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [firms, setFirms] = useState<Array<{ id: string; name: string }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ firmId: '', taskId: '', documentType: '' });
  const [formData, setFormData] = useState({
    firmId: '',
    taskId: '',
    documentType: 'OTHER',
    file: null as File | null,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadDocuments();
    loadFirms();
    loadTasks();
  }, [isAuthenticated, router, filters]);

  const loadDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.firmId) params.append('firmId', filters.firmId);
      if (filters.taskId) params.append('taskId', filters.taskId);
      if (filters.documentType) params.append('documentType', filters.documentType);
      const response = await api.get(`/documents?${params.toString()}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      console.error('Failed to load firms:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.firmId) {
      alert('Please select a file and firm');
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('file', formData.file);
      uploadData.append('firmId', formData.firmId);
      if (formData.taskId) uploadData.append('taskId', formData.taskId);
      uploadData.append('documentType', formData.documentType);

      await api.post('/documents', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setShowForm(false);
      setFormData({ firmId: '', taskId: '', documentType: 'OTHER', file: null });
      loadDocuments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload document');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to download document');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      loadDocuments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isAuthenticated || loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="text-primary-600 hover:text-primary-700">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Documents</h1>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            + Upload Document
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Firm</label>
              <select
                value={filters.firmId}
                onChange={(e) => setFilters({ ...filters, firmId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Firms</option>
                {firms.map((firm) => (
                  <option key={firm.id} value={firm.id}>
                    {firm.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Document Type</label>
              <select
                value={filters.documentType}
                onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">All Types</option>
                <option value="ITR">ITR</option>
                <option value="GST">GST</option>
                <option value="TDS">TDS</option>
                <option value="ROC">ROC</option>
                <option value="INVOICE">Invoice</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Firm *</label>
                  <select
                    required
                    value={formData.firmId}
                    onChange={(e) => setFormData({ ...formData, firmId: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select Firm</option>
                    {firms.map((firm) => (
                      <option key={firm.id} value={firm.id}>
                        {firm.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Task (Optional)</label>
                  <select
                    value={formData.taskId}
                    onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">No Task</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Document Type *</label>
                  <select
                    required
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="ITR">ITR</option>
                    <option value="GST">GST</option>
                    <option value="TDS">TDS</option>
                    <option value="ROC">ROC</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">File *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Firm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{doc.fileName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {doc.documentType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/firms/${doc.firm.id}`} className="text-primary-600 hover:underline">
                      {doc.firm.name}
                    </Link>
                    <p className="text-xs text-gray-500">{doc.firm.client.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.task ? (
                      <Link href={`/tasks/${doc.task.id}`} className="text-primary-600 hover:underline text-sm">
                        {doc.task.title}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatFileSize(doc.fileSize)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doc.uploadedBy.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {documents.length === 0 && (
            <div className="text-center py-8 text-gray-500">No documents found</div>
          )}
        </div>
      </main>
    </div>
  );
}

