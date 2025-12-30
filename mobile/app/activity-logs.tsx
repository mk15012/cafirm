import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

interface ActivityLog {
  id: number;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

export default function ActivityLogsScreen() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    userId: '',
    entityType: '',
  });
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/auth/login');
        return;
      }
      if (user?.role !== 'CA') {
        Alert.alert('Access Denied', 'Only CA can access activity logs');
        router.replace('/dashboard');
        return;
      }
      loadLogs();
      loadUsers();
    }
  }, [isAuthenticated, isLoading, user, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.entityType) params.append('entityType', filters.entityType);
      const response = await api.get(`/activity-logs?${params.toString()}`);
      setLogs(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load activity logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      CREATE: '#10b981',
      UPDATE: '#3b82f6',
      DELETE: '#ef4444',
      APPROVE: '#a855f7',
      REJECT: '#f59e0b',
    };
    return colors[actionType] || '#6b7280';
  };

  const clearFilters = () => {
    setFilters({ userId: '', entityType: '' });
  };

  const hasActiveFilters = filters.userId || filters.entityType;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Activity Logs</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Loading activity logs...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Activity Logs</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Text style={styles.filterButton}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>User:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, !filters.userId && styles.filterChipActive]}
                onPress={() => setFilters({ ...filters, userId: '' })}
              >
                <Text style={[styles.filterChipText, !filters.userId && styles.filterChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {users.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[styles.filterChip, filters.userId === u.id.toString() && styles.filterChipActive]}
                  onPress={() => setFilters({ ...filters, userId: u.id.toString() })}
                >
                  <Text style={[styles.filterChipText, filters.userId === u.id.toString() && styles.filterChipTextActive]}>
                    {u.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Entity Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, !filters.entityType && styles.filterChipActive]}
                onPress={() => setFilters({ ...filters, entityType: '' })}
              >
                <Text style={[styles.filterChipText, !filters.entityType && styles.filterChipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              {['User', 'Client', 'Firm', 'Task', 'Invoice', 'Document', 'Approval'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, filters.entityType === type && styles.filterChipActive]}
                  onPress={() => setFilters({ ...filters, entityType: type })}
                >
                  <Text style={[styles.filterChipText, filters.entityType === type && styles.filterChipTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {hasActiveFilters && (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadLogs} />}
      >
        {logs.map((log) => (
          <View key={log.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.actionBadge, { backgroundColor: getActionColor(log.actionType) + '20' }]}>
                <Text style={[styles.actionBadgeText, { color: getActionColor(log.actionType) }]}>
                  {log.actionType}
                </Text>
              </View>
              <Text style={styles.entityType}>{log.entityType}</Text>
            </View>
            <Text style={styles.description}>{log.description}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.userName}>{log.user.name}</Text>
              <Text style={styles.timestamp}>
                {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
              </Text>
            </View>
          </View>
        ))}
        {logs.length === 0 && (
          <Text style={styles.emptyText}>No activity logs found</Text>
        )}
      </ScrollView>
    </View>
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
  filterButton: {
    color: '#0284c7',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0284c7',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: 'white',
  },
  clearFiltersButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  entityType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  description: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 32,
    fontSize: 16,
  },
});

