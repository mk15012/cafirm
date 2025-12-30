import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
// Note: Install expo-document-picker: npx expo install expo-document-picker
// import * as DocumentPicker from 'expo-document-picker';
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

export default function DocumentsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firms, setFirms] = useState<Array<{ id: string; name: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState('');
  const [selectedType, setSelectedType] = useState('OTHER');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    loadDocuments();
    loadFirms();
  }, [isAuthenticated]);

  const loadDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      console.error('Failed to load firms');
    }
  };

  const handleUpload = async () => {
    if (!selectedFirm) {
      Alert.alert('Error', 'Please select a firm');
      return;
    }

    // Note: For full file picker functionality, install: npx expo install expo-document-picker
    // For now, showing a message to use web interface for file uploads
    Alert.alert(
      'File Upload',
      'For full file upload functionality, please install expo-document-picker:\n\nnpx expo install expo-document-picker\n\nOr use the web interface for document uploads.',
      [{ text: 'OK' }]
    );
    
    // Uncomment when expo-document-picker is installed:
    /*
    try {
      const DocumentPicker = require('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({});
      if (result.type === 'cancel') return;

      const formData = new FormData();
      formData.append('file', {
        uri: result.uri,
        type: result.mimeType || 'application/octet-stream',
        name: result.name || 'document',
      } as any);
      formData.append('firmId', selectedFirm);
      formData.append('documentType', selectedType);

      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowForm(false);
      setSelectedFirm('');
      setSelectedType('OTHER');
      loadDocuments();
      Alert.alert('Success', 'Document uploaded successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload document');
    }
    */
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Confirm', 'Delete this document?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/documents/${id}`);
            loadDocuments();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to delete document');
          }
        },
      },
    ]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isAuthenticated || loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDocuments} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addButton}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Upload Document</Text>
          <Text style={styles.label}>Firm *</Text>
          <View style={styles.picker}>
            {firms.map((firm) => (
              <TouchableOpacity
                key={firm.id}
                style={[styles.pickerOption, selectedFirm === firm.id && styles.pickerOptionSelected]}
                onPress={() => setSelectedFirm(firm.id)}
              >
                <Text style={selectedFirm === firm.id ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  {firm.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Document Type *</Text>
          <View style={styles.picker}>
            {['ITR', 'GST', 'TDS', 'ROC', 'INVOICE', 'OTHER'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerOption, selectedType === type && styles.pickerOptionSelected]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={selectedType === type ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.submitButton} onPress={handleUpload}>
              <Text style={styles.submitButtonText}>Select & Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowForm(false);
                setSelectedFirm('');
                setSelectedType('OTHER');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.list}>
        {documents.map((doc) => (
          <View key={doc.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{doc.fileName}</Text>
              <View style={[styles.typeBadge, { backgroundColor: '#3b82f6' }]}>
                <Text style={styles.typeBadgeText}>{doc.documentType}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtext}>Firm: {doc.firm.name}</Text>
            <Text style={styles.cardSubtext}>Client: {doc.firm.client.name}</Text>
            {doc.task && <Text style={styles.cardSubtext}>Task: {doc.task.title}</Text>}
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Size: {formatFileSize(doc.fileSize)}</Text>
              <Text style={styles.cardFooterText}>Uploaded: {format(new Date(doc.createdAt), 'MMM dd')}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(doc.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {documents.length === 0 && <Text style={styles.emptyText}>No documents found</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    color: '#0284c7',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    color: '#0284c7',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
  },
  pickerOptionSelected: {
    backgroundColor: '#0284c7',
  },
  pickerOptionText: {
    color: '#6b7280',
    fontSize: 14,
  },
  pickerOptionTextSelected: {
    color: 'white',
    fontSize: 14,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#0284c7',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e5e5e5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    color: '#0284c7',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  cardSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  cardFooterText: {
    fontSize: 12,
    color: '#999',
  },
  cardActions: {
    marginTop: 12,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 32,
  },
});

