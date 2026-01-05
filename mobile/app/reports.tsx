import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';

const { width } = Dimensions.get('window');

interface RevenueData {
  summary: {
    totalRevenue: number;
    paidRevenue: number;
    pendingRevenue: number;
    currentMonthRevenue: number;
    monthlyGrowth: number;
    invoiceCount: number;
    paidCount: number;
  };
  monthlyData: Array<{
    month: string;
    total: number;
    paid: number;
    pending: number;
  }>;
}

interface TaskData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  statusDistribution: Array<{ status: string; count: number }>;
  priorityDistribution: Array<{ priority: string; count: number }>;
  monthlyData: Array<{ month: string; created: number; completed: number }>;
}

interface ClientData {
  summary: {
    totalClients: number;
    totalFirms: number;
    activeClients: number;
    avgFirmsPerClient: number;
  };
  monthlyGrowth: Array<{ month: string; newClients: number; total: number }>;
  topClients: Array<{
    id: number;
    name: string;
    firms: number;
    totalRevenue: number;
    paidRevenue: number;
    tasks: number;
  }>;
}

export default function ReportsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'revenue' | 'tasks' | 'clients'>('revenue');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const isCA = user?.role === 'CA';

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    if (!isCA) {
      if (Platform.OS === 'web') {
        window.alert('Access Denied: Only CA can access reports');
      } else {
        Alert.alert('Access Denied', 'Only CA can access reports');
      }
      router.canGoBack() ? router.back() : router.replace('/dashboard');
      return;
    }
    loadData();
  }, [isAuthenticated, isCA, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [revRes, taskRes, clientRes] = await Promise.all([
        api.get(`/analytics/revenue?year=${selectedYear}`),
        api.get(`/analytics/tasks?year=${selectedYear}`),
        api.get(`/analytics/clients?year=${selectedYear}`),
      ]);
      setRevenueData(revRes.data);
      setTaskData(taskRes.data);
      setClientData(clientRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) {
      return '₹0';
    }
    if (amount >= 100000) {
      return '₹' + (amount / 100000).toFixed(1) + 'L';
    } else if (amount >= 1000) {
      return '₹' + (amount / 1000).toFixed(1) + 'K';
    }
    return '₹' + amount.toLocaleString('en-IN');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#fbbf24',
      IN_PROGRESS: '#3b82f6',
      AWAITING_APPROVAL: '#a855f7',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: '#ef4444',
      MEDIUM: '#f59e0b',
      LOW: '#10b981',
    };
    return colors[priority] || '#6b7280';
  };

  // Format month string (handles "2026-01", "January", "Jan", etc.)
  const formatMonth = (monthStr: string): string => {
    if (!monthStr) return '';
    
    // If it's a date format like "2026-01" or "2026-01-01"
    if (monthStr.includes('-')) {
      try {
        // Pad to full date if needed
        const dateStr = monthStr.length <= 7 ? `${monthStr}-01` : monthStr;
        return format(parseISO(dateStr), 'MMM');
      } catch {
        return monthStr.slice(0, 3);
      }
    }
    
    // If it's already a month name, just take first 3 chars
    return monthStr.slice(0, 3);
  };

  const years = [2024, 2025, 2026];

  if (loading && !revenueData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reports</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Year Selector */}
      <View style={styles.yearSelector}>
        {years.map((year) => (
          <TouchableOpacity
            key={year}
            style={[styles.yearButton, selectedYear === year && styles.yearButtonActive]}
            onPress={() => setSelectedYear(year)}
          >
            <Text style={[styles.yearButtonText, selectedYear === year && styles.yearButtonTextActive]}>
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'revenue' && styles.tabActive]}
          onPress={() => setActiveTab('revenue')}
        >
          <Text style={[styles.tabText, activeTab === 'revenue' && styles.tabTextActive]}>💰 Revenue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tasks' && styles.tabActive]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.tabTextActive]}>📋 Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'clients' && styles.tabActive]}
          onPress={() => setActiveTab('clients')}
        >
          <Text style={[styles.tabText, activeTab === 'clients' && styles.tabTextActive]}>👥 Clients</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={['#0ea5e9']} />}
      >
        {/* Revenue Tab */}
        {activeTab === 'revenue' && revenueData && (
          <View style={styles.tabContent}>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#ecfdf5' }]}>
                <Text style={styles.statIcon}>💵</Text>
                <Text style={styles.statValue}>{formatCurrency(revenueData.summary?.totalRevenue || 0)}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#f0f9ff' }]}>
                <Text style={styles.statIcon}>📈</Text>
                <Text style={styles.statValue}>{formatCurrency(revenueData.summary?.currentMonthRevenue || 0)}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={styles.statValue}>{formatCurrency(revenueData.summary?.paidRevenue || 0)}</Text>
                <Text style={styles.statLabel}>Paid Revenue</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.statIcon}>⏳</Text>
                <Text style={styles.statValue}>{formatCurrency(revenueData.summary?.pendingRevenue || 0)}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {/* Monthly Revenue Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Revenue</Text>
              <View style={styles.barChart}>
                {(() => {
                  // For current year, show months up to current month; for past years show last 6 months
                  const allData = revenueData.monthlyData || [];
                  const currentMonth = new Date().getMonth(); // 0-11
                  const isCurrentYear = selectedYear === new Date().getFullYear();
                  
                  let data;
                  if (isCurrentYear) {
                    // Show first N months up to current month (at least 6 or current month + 1)
                    const monthsToShow = Math.max(currentMonth + 1, 6);
                    data = allData.slice(0, monthsToShow).slice(-6);
                  } else {
                    // For past years, show last 6 months
                    data = allData.slice(-6);
                  }
                  
                  const maxTotal = Math.max(...data.map(m => m.total || 0), 1);
                  return data.map((item, index) => {
                    const barHeight = Math.max(((item.total || 0) / maxTotal) * 100, 5);
                    return (
                      <View key={index} style={styles.barContainer}>
                        <View style={[styles.bar, { height: barHeight, backgroundColor: '#0ea5e9' }]} />
                        <Text style={styles.barLabel}>{formatMonth(item.month || '')}</Text>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          </View>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && taskData && (
          <View style={styles.tabContent}>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#f0f9ff' }]}>
                <Text style={styles.statIcon}>📋</Text>
                <Text style={styles.statValue}>{taskData.summary?.totalTasks || 0}</Text>
                <Text style={styles.statLabel}>Total Tasks</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#ecfdf5' }]}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={styles.statValue}>{taskData.summary?.completionRate || 0}%</Text>
                <Text style={styles.statLabel}>Completion</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#fef2f2' }]}>
                <Text style={styles.statIcon}>⚠️</Text>
                <Text style={styles.statValue}>{taskData.summary?.overdueTasks || 0}</Text>
                <Text style={styles.statLabel}>Overdue</Text>
              </View>
            </View>

            {/* Status Breakdown */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>By Status</Text>
              {(taskData.statusDistribution || []).map((item, index) => (
                <View key={index} style={styles.horizontalBar}>
                  <View style={styles.horizontalBarLabel}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={styles.horizontalBarText}>{(item.status || '').replace('_', ' ')}</Text>
                  </View>
                  <View style={styles.horizontalBarTrack}>
                    <View 
                      style={[
                        styles.horizontalBarFill, 
                        { 
                          width: `${((item.count || 0) / (taskData.summary?.totalTasks || 1)) * 100}%`,
                          backgroundColor: getStatusColor(item.status)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.horizontalBarValue}>{item.count || 0}</Text>
                </View>
              ))}
            </View>

            {/* Priority Breakdown */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>By Priority</Text>
              {(taskData.priorityDistribution || []).map((item, index) => (
                <View key={index} style={styles.horizontalBar}>
                  <View style={styles.horizontalBarLabel}>
                    <View style={[styles.statusDot, { backgroundColor: getPriorityColor(item.priority) }]} />
                    <Text style={styles.horizontalBarText}>{item.priority || ''}</Text>
                  </View>
                  <View style={styles.horizontalBarTrack}>
                    <View 
                      style={[
                        styles.horizontalBarFill, 
                        { 
                          width: `${((item.count || 0) / (taskData.summary?.totalTasks || 1)) * 100}%`,
                          backgroundColor: getPriorityColor(item.priority)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.horizontalBarValue}>{item.count || 0}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && clientData && (
          <View style={styles.tabContent}>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: '#f0f9ff' }]}>
                <Text style={styles.statIcon}>👥</Text>
                <Text style={styles.statValue}>{clientData.summary?.totalClients || 0}</Text>
                <Text style={styles.statLabel}>Total Clients</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#ecfdf5' }]}>
                <Text style={styles.statIcon}>✅</Text>
                <Text style={styles.statValue}>{clientData.summary?.activeClients || 0}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: '#ede9fe' }]}>
                <Text style={styles.statIcon}>🏢</Text>
                <Text style={styles.statValue}>{clientData.summary?.totalFirms || 0}</Text>
                <Text style={styles.statLabel}>Firms</Text>
              </View>
            </View>

            {/* Client Growth Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Client Growth</Text>
              <View style={styles.barChart}>
                {(() => {
                  // For current year, show months up to current month; for past years show last 6 months
                  const allData = clientData.monthlyGrowth || [];
                  const currentMonth = new Date().getMonth(); // 0-11
                  const isCurrentYear = selectedYear === new Date().getFullYear();
                  
                  let data;
                  if (isCurrentYear) {
                    const monthsToShow = Math.max(currentMonth + 1, 6);
                    data = allData.slice(0, monthsToShow).slice(-6);
                  } else {
                    data = allData.slice(-6);
                  }
                  
                  const maxCount = Math.max(...data.map(m => m.total || 0), 1);
                  return data.map((item, index) => {
                    const barHeight = Math.max(((item.total || 0) / maxCount) * 100, 5);
                    return (
                      <View key={index} style={styles.barContainer}>
                        <View style={[styles.bar, { height: barHeight, backgroundColor: '#10b981' }]} />
                        <Text style={styles.barLabel}>{formatMonth(item.month || '')}</Text>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>

            {/* Top Clients by Revenue */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Top Clients by Revenue</Text>
              {(clientData.topClients || []).slice(0, 5).map((item, index) => (
                <View key={index} style={styles.clientRow}>
                  <View style={styles.clientRank}>
                    <Text style={styles.clientRankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.clientName} numberOfLines={1}>{item.name || 'Unknown'}</Text>
                  <Text style={styles.clientRevenue}>{formatCurrency(item.totalRevenue)}</Text>
                </View>
              ))}
              {(clientData.topClients || []).length === 0 && (
                <Text style={styles.emptyText}>No revenue data available</Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
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

  yearSelector: { flexDirection: 'row', justifyContent: 'center', padding: 12, gap: 8 },
  yearButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  yearButtonActive: { backgroundColor: '#0ea5e9' },
  yearButtonText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  yearButtonTextActive: { color: 'white' },

  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  tabActive: { backgroundColor: '#0f172a' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#64748b' },
  tabTextActive: { color: 'white' },

  tabContent: { padding: 16 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { 
    width: (width - 56) / 2, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center',
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },

  chartCard: { 
    backgroundColor: 'white', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 16 },

  barChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120, paddingHorizontal: 8 },
  barContainer: { alignItems: 'center', justifyContent: 'flex-end', height: '100%', paddingHorizontal: 4 },
  bar: { width: 28, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#64748b', marginTop: 8 },

  horizontalBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  horizontalBarLabel: { flexDirection: 'row', alignItems: 'center', width: 100 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  horizontalBarText: { fontSize: 12, color: '#374151' },
  horizontalBarTrack: { flex: 1, height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, marginHorizontal: 8 },
  horizontalBarFill: { height: '100%', borderRadius: 4 },
  horizontalBarValue: { width: 30, fontSize: 12, fontWeight: '600', color: '#0f172a', textAlign: 'right' },

  clientRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  clientRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  clientRankText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  clientName: { flex: 1, fontSize: 14, color: '#374151' },
  clientRevenue: { fontSize: 14, fontWeight: '600', color: '#0ea5e9' },

  emptyText: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20 },
});

