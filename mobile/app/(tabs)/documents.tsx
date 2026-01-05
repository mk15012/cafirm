import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Linking, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/lib/store';
import api, { getApiBaseUrl } from '@/lib/api';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';

interface Document {
  id: number;
  filename: string;
  originalName: string;
  fileName?: string;
  mimeType: string;
  size: number;
  fileSize?: number;
  description?: string;
  category?: string;
  documentType?: string;
  createdAt: string;
  firm?: { id: number; name: string; client: { name: string } };
}

interface Firm {
  id: number;
  name: string;
  client: { id: number; name: string };
}

export default function DocumentsTabScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [selectedFirmId, setSelectedFirmId] = useState<number | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('OTHER');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const isIndividual = user?.role === 'INDIVIDUAL';

  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments();
      loadFirms();
    }
  }, [isAuthenticated]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents');
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFirms = async () => {
    try {
      const response = await api.get('/firms');
      setFirms(response.data || []);
      // For INDIVIDUAL users, auto-select their first firm
      if (isIndividual && response.data?.length > 0) {
        setSelectedFirmId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load firms:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

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
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedFirmId) {
      Alert.alert('Error', 'Please select a file and firm');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || 'application/octet-stream',
      } as any);
      formData.append('firmId', selectedFirmId.toString());
      formData.append('documentType', selectedDocType);

      await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Document uploaded successfully!');
      setShowUploadModal(false);
      setSelectedFile(null);
      setSelectedDocType('OTHER');
      if (!isIndividual) {
        setSelectedFirmId(null);
      }
      loadDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const baseUrl = getApiBaseUrl();
      const downloadUrl = `${baseUrl}/documents/${doc.id}/download?token=${token}`;
      await Linking.openURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
    return '📄';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{isIndividual ? 'My Documents' : 'Documents'}</Text>
            <Text style={styles.headerSubtitle}>{filteredDocuments.length} files</Text>
          </View>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => setShowUploadModal(true)}
          >
            <Text style={styles.uploadButtonText}>+ Upload</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No Documents Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'Upload your first document to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyUploadButton}
                onPress={() => setShowUploadModal(true)}
              >
                <Text style={styles.emptyUploadButtonText}>+ Upload Document</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredDocuments.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.documentCard}
              onPress={() => handleDownload(doc)}
            >
              <View style={styles.fileIcon}>
                <Text style={styles.fileIconText}>{getFileIcon(doc.mimeType)}</Text>
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName} numberOfLines={1}>{doc.originalName}</Text>
                {!isIndividual && doc.firm && (
                  <Text style={styles.documentMeta}>
                    {doc.firm.client?.name} • {doc.firm.name}
                  </Text>
                )}
                <View style={styles.documentDetails}>
                  <Text style={styles.documentSize}>{formatFileSize(doc.size)}</Text>
                  <Text style={styles.documentDate}>
                    {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                  </Text>
                </View>
                {doc.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{doc.category}</Text>
                  </View>
                )}
              </View>
              <View style={styles.downloadButton}>
                <Text style={styles.downloadIcon}>⬇️</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Document</Text>
              <TouchableOpacity onPress={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
              }}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* File Picker */}
            <TouchableOpacity style={styles.filePickerButton} onPress={pickDocument}>
              <Text style={styles.filePickerIcon}>📁</Text>
              <Text style={styles.filePickerText}>
                {selectedFile ? selectedFile.name : 'Tap to select a file'}
              </Text>
            </TouchableOpacity>

            {selectedFile && (
              <Text style={styles.selectedFileInfo}>
                Size: {formatFileSize(selectedFile.size || 0)}
              </Text>
            )}

            {/* Firm Picker - Hidden for INDIVIDUAL users */}
            {!isIndividual && (
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Select Firm *</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedFirmId}
                    onValueChange={(value) => setSelectedFirmId(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select a firm..." value={null} />
                    {firms.map((firm) => (
                      <Picker.Item
                        key={firm.id}
                        label={`${firm.name} (${firm.client.name})`}
                        value={firm.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Document Type Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Document Type</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedDocType}
                  onValueChange={(value) => setSelectedDocType(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="ITR" value="ITR" />
                  <Picker.Item label="GST" value="GST" />
                  <Picker.Item label="TDS" value="TDS" />
                  <Picker.Item label="ROC" value="ROC" />
                  <Picker.Item label="Invoice" value="INVOICE" />
                  <Picker.Item label="Other" value="OTHER" />
                </Picker>
              </View>
            </View>

            {/* Upload Button */}
            <TouchableOpacity
              style={[
                styles.uploadSubmitButton,
                (!selectedFile || !selectedFirmId || uploading) && styles.uploadSubmitButtonDisabled
              ]}
              onPress={handleUpload}
              disabled={!selectedFile || !selectedFirmId || uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.uploadSubmitButtonText}>Upload Document</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0f172a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 16 },
  header: {
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  uploadButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  emptyUploadButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyUploadButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  documentCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileIconText: {
    fontSize: 24,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  documentMeta: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  documentDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  documentSize: { fontSize: 12, color: '#94a3b8' },
  documentDate: { fontSize: 12, color: '#94a3b8' },
  categoryBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadIcon: {
    fontSize: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#64748b',
    padding: 4,
  },
  filePickerButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  filePickerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  filePickerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  selectedFileInfo: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  uploadSubmitButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadSubmitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  uploadSubmitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
});



