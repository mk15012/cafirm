import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';
import * as DocumentPicker from 'expo-document-picker';

interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  firm: { id: number; name: string; client: { name: string } };
  uploadedBy: { name: string };
}

interface Client {
  id: number;
  name: string;
}

interface Firm {
  id: number;
  name: string;
  clientId: number;
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedFirm, setSelectedFirm] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments();
      loadClients();
      loadFirms();
    }
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

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Failed to load clients', error);
    }
  };

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data);
    } catch (error) {
      console.error('Failed to load firms', error);
    }
  };

  const filteredFirms = selectedClient
    ? firms.filter((f) => f.clientId === selectedClient)
    : firms;

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!selectedFirm || !selectedFile) {
      Alert.alert('Error', 'Please select a firm and a file');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('firmId', String(selectedFirm));
      formData.append('file', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'application/octet-stream',
        name: selectedFile.name,
      } as any);

      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Document uploaded successfully');
      setShowModal(false);
      setSelectedClient(null);
      setSelectedFirm(null);
      setSelectedFile(null);
      loadDocuments();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    return '📁';
  };

  if (!isAuthenticated || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDocuments} colors={['#0ea5e9']} />}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Documents</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
            <Text style={styles.addButtonText}>+ Upload</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {documents.map((doc) => (
            <View key={doc.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.fileIcon}>{getFileIcon(doc.type)}</Text>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{doc.name}</Text>
                  <Text style={styles.cardSubtext}>{doc.firm.client.name} • {doc.firm.name}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.fileSize}>{formatFileSize(doc.size)}</Text>
                    <Text style={styles.uploadDate}>{format(new Date(doc.createdAt), 'MMM dd, yyyy')}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
          {documents.length === 0 && <Text style={styles.emptyText}>No documents found</Text>}
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Document</Text>

            {/* Client Picker */}
            <Text style={styles.label}>Client (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              <TouchableOpacity
                style={[styles.pickerItem, !selectedClient && styles.pickerItemActive]}
                onPress={() => { setSelectedClient(null); setSelectedFirm(null); }}
              >
                <Text style={[styles.pickerText, !selectedClient && styles.pickerTextActive]}>All</Text>
              </TouchableOpacity>
              {clients.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pickerItem, selectedClient === c.id && styles.pickerItemActive]}
                  onPress={() => { setSelectedClient(c.id); setSelectedFirm(null); }}
                >
                  <Text style={[styles.pickerText, selectedClient === c.id && styles.pickerTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Firm Picker */}
            <Text style={styles.label}>Firm *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {filteredFirms.length === 0 ? (
                <Text style={styles.noDataText}>No firms available</Text>
              ) : (
                filteredFirms.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.pickerItem, selectedFirm === f.id && styles.pickerItemActive]}
                    onPress={() => setSelectedFirm(f.id)}
                  >
                    <Text style={[styles.pickerText, selectedFirm === f.id && styles.pickerTextActive]}>{f.name}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* File Picker */}
            <Text style={styles.label}>File *</Text>
            <TouchableOpacity style={styles.filePickerButton} onPress={pickDocument}>
              <Text style={styles.filePickerText}>
                {selectedFile ? `📄 ${selectedFile.name}` : '📁 Tap to select file'}
              </Text>
            </TouchableOpacity>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowModal(false);
                  setSelectedClient(null);
                  setSelectedFirm(null);
                  setSelectedFile(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
                onPress={handleUpload}
                disabled={uploading}
              >
                <Text style={styles.uploadButtonText}>{uploading ? 'Uploading...' : 'Upload'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  container: { flex: 1 },
  header: { backgroundColor: '#0f172a', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { color: '#0ea5e9', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  addButton: { backgroundColor: '#0ea5e9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
  list: { padding: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  fileIcon: { fontSize: 32, marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  cardSubtext: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  fileSize: { fontSize: 12, color: '#94a3b8' },
  uploadDate: { fontSize: 12, color: '#94a3b8' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 32 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  pickerScroll: { flexGrow: 0, marginBottom: 8 },
  pickerItem: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  pickerItemActive: { backgroundColor: '#0ea5e9' },
  pickerText: { color: '#64748b', fontSize: 14 },
  pickerTextActive: { color: '#ffffff', fontWeight: '600' },
  noDataText: { color: '#94a3b8', fontSize: 14, paddingVertical: 10 },
  filePickerButton: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  filePickerText: { color: '#64748b', fontSize: 14, textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 },
  cancelButton: { flex: 1, backgroundColor: '#f1f5f9', padding: 14, borderRadius: 10, alignItems: 'center' },
  cancelButtonText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  uploadButton: { flex: 1, backgroundColor: '#0ea5e9', padding: 14, borderRadius: 10, alignItems: 'center' },
  uploadButtonDisabled: { backgroundColor: '#94a3b8' },
  uploadButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
