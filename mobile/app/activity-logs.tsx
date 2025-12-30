import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  description: string;
  user: { id: string; name: string; email: string; role: string };
  createdAt: string;
}

export default function ActivityLogsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ entityType: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    // Only CA can access this page
    if (user?.role !== 'CA') {
      Alert.alert('Access Denied', 'Only CA can view activity logs');
      router.back();
      return;
    }
    loadLogs();
  }, [isAuthenticated, user, filters]);

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
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

  const getActionColor = (actionType: string) => {
    const colors: Record<string, string> = {
      CREATE: '#10b981',
      UPDATE: '#3b82f6',
      DELETE: '#ef4444',
      APPROVE: '#a855f7',
      REJECT: '#f97316',
    };
    return colors[actionType] || '#6b7280';
  };

  const getActionIcon = (actionType: string) => {
    const icons: Record<string, string> = {
      CREATE: '➕',
      UPDATE: '✏️',
      DELETE: '🗑️',
      APPROVE: '✅',
      REJECT: '❌',
    };
    return icons[actionType] || '📋';
  };

  const getEntityIcon = (entityType: string) => {
    const icons: Record<string, string> = {
      User: '👤',
      Client: '🏢',
      Firm: '🏛️',
      Task: '📋',
      Invoice: '💰',
      Document: '📄',
      Approval: '✓',
    };
    return icons[entityType] || '📁';
  };

  if (!isAuthenticated || user?.role !== 'CA' || loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading activity logs...</Text>
      </SafeAreaView>
    );
  }

  const actionCounts = {
    CREATE: logs.filter(l => l.actionType === 'CREATE').length,
    UPDATE: logs.filter(l => l.actionType === 'UPDATE').length,
    DELETE: logs.filter(l => l.actionType === 'DELETE').length,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadLogs} colors={['#0ea5e9']} />}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Activity Logs</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          <View style={styles.statCard}><Text style={styles.statValue}>{logs.length}</Text><Text style={styles.statLabel}>Total</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#10b981' }]}>{actionCounts.CREATE}</Text><Text style={styles.statLabel}>Created</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#3b82f6' }]}>{actionCounts.UPDATE}</Text><Text style={styles.statLabel}>Updated</Text></View>
          <View style={styles.statCard}><Text style={[styles.statValue, { color: '#ef4444' }]}>{actionCounts.DELETE}</Text><Text style={styles.statLabel}>Deleted</Text></View>
        </ScrollView>

        {/* Filters */}
        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['', 'User', 'Client', 'Firm', 'Task', 'Invoice', 'Document'].map((entityType) => (
              <TouchableOpacity
                key={entityType}
                style={[styles.filterChip, filters.entityType === entityType && styles.filterChipActive]}
                onPress={() => setFilters({ entityType })}
              >
                <Text style={[styles.filterChipText, filters.entityType === entityType && styles.filterChipTextActive]}>
                  {entityType || 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.list}>
          {logs.map((log) => (
            <View key={log.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.actionBadge, { backgroundColor: getActionColor(log.actionType) }]}>
                  <Text style={styles.actionBadgeText}>{getActionIcon(log.actionType)} {log.actionType}</Text>
                </View>
                <View style={styles.entityBadge}>
                  <Text style={styles.entityBadgeText}>{getEntityIcon(log.entityType)} {log.entityType}</Text>
                </View>
              </View>
              <Text style={styles.description}>{log.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.userText}>👤 {log.user.name}</Text>
                <Text style={styles.dateText}>🕐 {format(new Date(log.createdAt), 'MMM dd, HH:mm')}</Text>
              </View>
            </View>
          ))}
          {logs.length === 0 && <Text style={styles.emptyText}>No activity logs found</Text>}
        </View>
      </ScrollView>
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
  statsContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  statCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginRight: 12, minWidth: 80, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  filters: { paddingHorizontal: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
  filterChipActive: { backgroundColor: '#0ea5e9' },
  filterChipText: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: 'white' },
  list: { padding: 16 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  actionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  actionBadgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  entityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f1f5f9' },
  entityBadgeText: { color: '#64748b', fontSize: 12, fontWeight: '500' },
  description: { fontSize: 14, color: '#0f172a', marginBottom: 12, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  userText: { fontSize: 12, color: '#64748b' },
  dateText: { fontSize: 12, color: '#94a3b8' },
  emptyText: { textAlign: 'center', color: '#94a3b8', marginTop: 32 },
});
