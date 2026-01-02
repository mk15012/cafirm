import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api, { getApiBaseUrl } from '@/lib/api';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Firm {
  id: number;
  name: string;
  panNumber?: string;
  gstNumber?: string;
  entityType?: string;
  client?: { name: string };
  _count?: {
    tasks: number;
  };
}

interface Document {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  category?: string;
  createdAt: string;
  firm?: { name: string; client: { name: string } };
}

// This component shows Firms for CA/Team users and Documents for Individual users
export default function FirmsOrDocsTabScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isIndividual = user?.role === 'INDIVIDUAL';

  if (isIndividual) {
    return <DocumentsView />;
  }

  return <FirmsView />;
}

// Firms view for CA/Team users
function FirmsView() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadFirms();
    }
  }, [isAuthenticated]);

  const loadFirms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/firms');
      setFirms(response.data || []);
    } catch (error) {
      console.error('Failed to load firms:', error);
      setFirms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFirms();
  };

  const filteredFirms = firms.filter(firm =>
    firm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    firm.panNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading firms...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Firms</Text>
        <Text style={styles.headerSubtitle}>{filteredFirms.length} firms</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search firms by name or PAN..."
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
        {filteredFirms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏛️</Text>
            <Text style={styles.emptyTitle}>No Firms Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'Add your first firm to get started'}
            </Text>
          </View>
        ) : (
          filteredFirms.map((firm) => (
            <TouchableOpacity
              key={firm.id}
              style={styles.firmCard}
              onPress={() => router.push(`/firms/${firm.id}`)}
            >
              <View style={styles.firmHeader}>
                <View style={styles.firmAvatar}>
                  <Text style={styles.firmInitial}>{firm.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.firmInfo}>
                  <Text style={styles.firmName}>{firm.name}</Text>
                  {firm.client && (
                    <Text style={styles.firmClient}>📍 {firm.client.name}</Text>
                  )}
                </View>
              </View>
              <View style={styles.firmDetails}>
                {firm.panNumber && (
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailLabel}>PAN</Text>
                    <Text style={styles.detailValue}>{firm.panNumber}</Text>
                  </View>
                )}
                {firm.entityType && (
                  <View style={[styles.entityBadge, { backgroundColor: getEntityColor(firm.entityType) }]}>
                    <Text style={styles.entityText}>{firm.entityType}</Text>
                  </View>
                )}
              </View>
              {firm._count && (
                <View style={styles.tasksBadge}>
                  <Text style={styles.tasksCount}>{firm._count.tasks}</Text>
                  <Text style={styles.tasksLabel}>Tasks</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Documents view for Individual users
function DocumentsView() {
  const { user, isAuthenticated } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadDocuments();
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

  const onRefresh = () => {
    setRefreshing(true);
    loadDocuments();
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
        <Text style={styles.headerTitle}>My Documents</Text>
        <Text style={styles.headerSubtitle}>{filteredDocuments.length} files</Text>
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
              {searchQuery ? 'Try a different search term' : 'Your documents will appear here'}
            </Text>
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
    </SafeAreaView>
  );
}

function getEntityColor(entityType: string): string {
  const colors: Record<string, string> = {
    'PROPRIETORSHIP': '#3b82f6',
    'PARTNERSHIP': '#8b5cf6',
    'LLP': '#06b6d4',
    'PRIVATE_LIMITED': '#10b981',
    'PUBLIC_LIMITED': '#f59e0b',
    'INDIVIDUAL': '#ec4899',
    'HUF': '#6366f1',
    'TRUST': '#14b8a6',
  };
  return colors[entityType] || '#64748b';
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
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
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
  // Firm Card Styles
  firmCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  firmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  firmAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#06b6d4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  firmInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  firmInfo: {
    flex: 1,
  },
  firmName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  firmClient: { fontSize: 13, color: '#64748b' },
  firmDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  detailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  entityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  entityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  tasksBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tasksCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  tasksLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  // Document Card Styles
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
});

