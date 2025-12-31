'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, Clock, Building2, FileText } from 'lucide-react';

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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GST: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  TDS: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  ITR: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  AUDIT: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  TAX: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  ROC: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
};

export default function ComplianceCalendarPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<ComplianceItem[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      loadCalendar();
      loadUpcoming();
    }
  }, [isAuthenticated, isLoading, router, currentYear, currentMonth]);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/compliance/calendar?year=${currentYear}&month=${currentMonth}`);
      setCalendarData(response.data);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcoming = async () => {
    try {
      const response = await api.get('/compliance/upcoming');
      setUpcomingDeadlines(response.data);
    } catch (error) {
      console.error('Failed to load upcoming:', error);
    }
  };

  const goToPrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(new Date().getFullYear());
    setCurrentMonth(new Date().getMonth() + 1);
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0 = Sunday

    const days = [];
    
    // Empty cells for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, date: null });
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const items = calendarData?.groupedByDate[date] || [];
      days.push({ day, date, items });
    }
    
    return days;
  };

  const isToday = (date: string | null) => {
    if (!date) return false;
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  if (isLoading || loading) {
    return (
      <AppLayout title="Compliance Calendar">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading calendar...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <AppLayout title="Compliance Calendar">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-3">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Compliance Calendar</h1>
                  <p className="text-sm text-gray-500">Track all compliance deadlines</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  Today
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                    {MONTHS[currentMonth - 1]} {currentYear}
                  </span>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-sm font-semibold text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((cell, index) => (
                <div
                  key={index}
                  className={`min-h-[120px] border-b border-r border-gray-100 p-2 ${
                    cell.day ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                  } ${isToday(cell.date) ? 'bg-primary-50' : ''} ${
                    selectedDate === cell.date ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => cell.date && setSelectedDate(cell.date === selectedDate ? null : cell.date)}
                >
                  {cell.day && (
                    <>
                      <div className={`text-sm font-medium mb-1 ${
                        isToday(cell.date) ? 'text-primary-600' : 'text-gray-900'
                      }`}>
                        {cell.day}
                      </div>
                      <div className="space-y-1">
                        {cell.items?.slice(0, 3).map((item, idx) => (
                          <div
                            key={idx}
                            className={`text-xs px-1.5 py-0.5 rounded truncate ${
                              CATEGORY_COLORS[item.category]?.bg || 'bg-gray-100'
                            } ${CATEGORY_COLORS[item.category]?.text || 'text-gray-700'}`}
                            title={`${item.name} - ${item.clientName}`}
                          >
                            {item.code}
                          </div>
                        ))}
                        {cell.items && cell.items.length > 3 && (
                          <div className="text-xs text-gray-500 px-1">
                            +{cell.items.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && calendarData?.groupedByDate[selectedDate] && (
            <div className="mt-6 bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Deadlines for {new Date(selectedDate).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="space-y-3">
                {calendarData.groupedByDate[selectedDate].map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      CATEGORY_COLORS[item.category]?.border || 'border-gray-200'
                    } ${CATEGORY_COLORS[item.category]?.bg || 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        CATEGORY_COLORS[item.category]?.bg || 'bg-gray-100'
                      }`}>
                        <FileText className={`w-5 h-5 ${CATEGORY_COLORS[item.category]?.text || 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.clientName} → {item.firmName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        CATEGORY_COLORS[item.category]?.bg || 'bg-gray-100'
                      } ${CATEGORY_COLORS[item.category]?.text || 'text-gray-700'}`}>
                        {item.category}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{item.frequency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 bg-white rounded-xl shadow-md border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-600">Categories:</span>
              {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
                <div key={category} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${colors.bg} ${colors.border} border`}></div>
                  <span className="text-sm text-gray-600">{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Upcoming Deadlines */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
            </div>
            
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No upcoming deadlines</p>
                <p className="text-xs text-gray-400 mt-1">Configure compliance for your firms to see deadlines</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {upcomingDeadlines.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      item.daysUntilDue && item.daysUntilDue <= 3 
                        ? 'border-red-200 bg-red-50' 
                        : item.daysUntilDue && item.daysUntilDue <= 7
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.firmName}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        item.daysUntilDue && item.daysUntilDue <= 3 
                          ? 'bg-red-100 text-red-700' 
                          : item.daysUntilDue && item.daysUntilDue <= 7
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.daysUntilDue === 0 ? 'Today' : 
                         item.daysUntilDue === 1 ? 'Tomorrow' : 
                         `${item.daysUntilDue} days`}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <Building2 className="w-3 h-3" />
                      {item.clientName}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                To add deadlines, configure compliance settings for each firm
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

