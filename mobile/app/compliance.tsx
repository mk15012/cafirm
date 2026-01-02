import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { format, addMonths, subMonths } from 'date-fns';

interface ComplianceItem {
  code: string;
  name: string;
  category: string;
  dueDate: string;
  frequency: string;
  firmId: number;
  firmName: string;
  clientName: string;
  daysUntilDue?: number;
}

interface CalendarData {
  year: number;
  month: number;
  items: ComplianceItem[];
  groupedByDate: Record<string, ComplianceItem[]>;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  GST: { bg: '#dbeafe', text: '#1d4ed8' },
  TDS: { bg: '#f3e8ff', text: '#7c3aed' },
  ITR: { bg: '#dcfce7', text: '#15803d' },
  AUDIT: { bg: '#fef3c7', text: '#b45309' },
  TAX: { bg: '#fee2e2', text: '#dc2626' },
  ROC: { bg: '#cffafe', text: '#0891b2' },
};

export default function ComplianceScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<ComplianceItem[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState<'upcoming' | 'calendar'>('upcoming');

  const isCA = user?.role === 'CA';

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    if (!isCA) {
      router.canGoBack() ? router.back() : router.replace('/dashboard');
      return;
    }
    loadData();
  }, [isAuthenticated, isCA, currentDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const [calendarRes, upcomingRes] = await Promise.all([
        api.get(`/compliance/calendar?year=${year}&month=${month}`),
        api.get('/compliance/upcoming'),
      ]);
      
      setCalendarData(calendarRes.data);
      setUpcomingDeadlines(upcomingRes.data || []);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const goToPrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysColor = (days: number | undefined) => {
    if (!days && days !== 0) return { bg: '#f1f5f9', text: '#64748b' };
    if (days <= 3) return { bg: '#fee2e2', text: '#dc2626' };
    if (days <= 7) return { bg: '#fef3c7', text: '#b45309' };
    return { bg: '#f1f5f9', text: '#64748b' };
  };

  const getDaysLabel = (days: number | undefined) => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: Array<{ day: number | null; date: string | null; items: ComplianceItem[] }> = [];
    
    // Empty cells for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, date: null, items: [] });
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const items = calendarData?.groupedByDate[date] || [];
      days.push({ day, date, items });
    }
    
    return days;
  };

  const isToday = (date: string | null) => {
    if (!date) return false;
    return date === format(new Date(), 'yyyy-MM-dd');
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Loading compliance calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compliance</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, activeView === 'upcoming' && styles.toggleButtonActive]}
          onPress={() => setActiveView('upcoming')}
        >
          <Text style={[styles.toggleText, activeView === 'upcoming' && styles.toggleTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, activeView === 'calendar' && styles.toggleButtonActive]}
          onPress={() => setActiveView('calendar')}
        >
          <Text style={[styles.toggleText, activeView === 'calendar' && styles.toggleTextActive]}>
            Calendar
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />}
      >
        {activeView === 'upcoming' ? (
          <>
            {/* Upcoming Deadlines View */}
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>⏰</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Upcoming Deadlines</Text>
                <Text style={styles.infoText}>
                  Track all compliance deadlines for your firms
                </Text>
              </View>
            </View>

            {upcomingDeadlines.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>No Upcoming Deadlines</Text>
                <Text style={styles.emptyText}>
                  Configure compliance settings for your firms to see deadlines here.
                </Text>
              </View>
            ) : (
              <View style={styles.deadlinesList}>
                {upcomingDeadlines.map((item, index) => {
                  const daysColor = getDaysColor(item.daysUntilDue);
                  const categoryColor = CATEGORY_COLORS[item.category] || { bg: '#f1f5f9', text: '#64748b' };
                  
                  return (
                    <View key={index} style={[styles.deadlineCard, { borderLeftColor: categoryColor.text }]}>
                      <View style={styles.deadlineHeader}>
                        <View style={[styles.categoryBadge, { backgroundColor: categoryColor.bg }]}>
                          <Text style={[styles.categoryBadgeText, { color: categoryColor.text }]}>
                            {item.category}
                          </Text>
                        </View>
                        <View style={[styles.daysBadge, { backgroundColor: daysColor.bg }]}>
                          <Text style={[styles.daysBadgeText, { color: daysColor.text }]}>
                            {getDaysLabel(item.daysUntilDue)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.deadlineName}>{item.name}</Text>
                      <Text style={styles.deadlineCode}>{item.code}</Text>
                      <View style={styles.deadlineFooter}>
                        <Text style={styles.deadlineClient}>🏢 {item.clientName}</Text>
                        <Text style={styles.deadlineFirm}>→ {item.firmName}</Text>
                      </View>
                      <Text style={styles.deadlineDate}>
                        📅 Due: {format(new Date(item.dueDate), 'MMM dd, yyyy')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Calendar View */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
                <Text style={styles.navButtonText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goToToday}>
                <Text style={styles.monthTitle}>
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                <Text style={styles.navButtonText}>→</Text>
              </TouchableOpacity>
            </View>

            {/* Day Headers */}
            <View style={styles.dayHeaders}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <View key={index} style={styles.dayHeader}>
                  <Text style={styles.dayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((cell, index) => (
                <View
                  key={index}
                  style={[
                    styles.calendarCell,
                    isToday(cell.date) && styles.calendarCellToday,
                  ]}
                >
                  {cell.day && (
                    <>
                      <Text style={[
                        styles.calendarDay,
                        isToday(cell.date) && styles.calendarDayToday,
                      ]}>
                        {cell.day}
                      </Text>
                      {cell.items.length > 0 && (
                        <View style={styles.calendarDots}>
                          {cell.items.slice(0, 3).map((item, idx) => {
                            const color = CATEGORY_COLORS[item.category]?.text || '#64748b';
                            return (
                              <View
                                key={idx}
                                style={[styles.calendarDot, { backgroundColor: color }]}
                              />
                            );
                          })}
                        </View>
                      )}
                      {cell.items.length > 3 && (
                        <Text style={styles.moreText}>+{cell.items.length - 3}</Text>
                      )}
                    </>
                  )}
                </View>
              ))}
            </View>

            {/* Month's Deadlines List */}
            {calendarData?.items && calendarData.items.length > 0 && (
              <View style={styles.monthDeadlines}>
                <Text style={styles.monthDeadlinesTitle}>
                  📋 Deadlines in {MONTHS[currentDate.getMonth()]}
                </Text>
                {calendarData.items.map((item, index) => {
                  const categoryColor = CATEGORY_COLORS[item.category] || { bg: '#f1f5f9', text: '#64748b' };
                  return (
                    <View key={index} style={styles.monthDeadlineItem}>
                      <View style={[styles.categoryDot, { backgroundColor: categoryColor.text }]} />
                      <View style={styles.monthDeadlineContent}>
                        <Text style={styles.monthDeadlineDate}>
                          {format(new Date(item.dueDate), 'MMM dd')}
                        </Text>
                        <Text style={styles.monthDeadlineName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.monthDeadlineFirm} numberOfLines={1}>
                          {item.firmName}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {calendarData?.items.length === 0 && (
              <View style={styles.noMonthDeadlines}>
                <Text style={styles.noMonthDeadlinesText}>
                  No deadlines in {MONTHS[currentDate.getMonth()]}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Categories:</Text>
          <View style={styles.legendItems}>
            {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
              <View key={category} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.text }]} />
                <Text style={styles.legendText}>{category}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#64748b' },
  
  header: { 
    backgroundColor: '#0f172a', 
    padding: 16, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  backButton: { color: '#0ea5e9', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  
  toggleContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#e2e8f0', 
    margin: 16, 
    borderRadius: 12, 
    padding: 4 
  },
  toggleButton: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: 'center', 
    borderRadius: 8 
  },
  toggleButtonActive: { backgroundColor: '#ffffff' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  toggleTextActive: { color: '#0ea5e9' },
  
  content: { flex: 1 },
  
  infoCard: { 
    backgroundColor: '#ffffff', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoIcon: { fontSize: 32, marginRight: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  infoText: { fontSize: 13, color: '#64748b' },
  
  emptyContainer: { 
    backgroundColor: '#ffffff', 
    margin: 16, 
    padding: 32, 
    borderRadius: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  
  deadlinesList: { paddingHorizontal: 16 },
  deadlineCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deadlineHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  categoryBadgeText: { fontSize: 11, fontWeight: '700' },
  daysBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  daysBadgeText: { fontSize: 11, fontWeight: '700' },
  deadlineName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  deadlineCode: { fontSize: 12, color: '#64748b', marginBottom: 8 },
  deadlineFooter: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  deadlineClient: { fontSize: 12, color: '#64748b' },
  deadlineFirm: { fontSize: 12, color: '#64748b' },
  deadlineDate: { fontSize: 12, color: '#94a3b8' },
  
  // Calendar styles
  calendarHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  navButton: { padding: 8 },
  navButtonText: { fontSize: 20, color: '#0ea5e9', fontWeight: '600' },
  monthTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  
  dayHeaders: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    marginBottom: 8 
  },
  dayHeader: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 8 
  },
  dayHeaderText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  
  calendarGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 16 
  },
  calendarCell: { 
    width: '14.28%', 
    aspectRatio: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 4,
  },
  calendarCellToday: { 
    backgroundColor: '#dbeafe', 
    borderRadius: 8 
  },
  calendarDay: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  calendarDayToday: { color: '#0ea5e9', fontWeight: '700' },
  calendarDots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  calendarDot: { width: 4, height: 4, borderRadius: 2 },
  moreText: { fontSize: 8, color: '#94a3b8', marginTop: 1 },
  
  monthDeadlines: { 
    backgroundColor: '#ffffff', 
    margin: 16, 
    padding: 16, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthDeadlinesTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  monthDeadlineItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  monthDeadlineContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthDeadlineDate: { fontSize: 12, fontWeight: '600', color: '#64748b', width: 50 },
  monthDeadlineName: { fontSize: 13, color: '#0f172a', flex: 1 },
  monthDeadlineFirm: { fontSize: 11, color: '#94a3b8', maxWidth: 80 },
  
  noMonthDeadlines: { 
    backgroundColor: '#f8fafc', 
    margin: 16, 
    padding: 24, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  noMonthDeadlinesText: { fontSize: 14, color: '#64748b' },
  
  legend: { 
    backgroundColor: '#ffffff', 
    marginHorizontal: 16, 
    padding: 12, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  legendTitle: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  legendItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 11, color: '#64748b' },
});

