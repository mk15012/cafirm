'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  IndianRupee,
  FileText,
  Calendar
} from 'lucide-react';

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
  staffPerformance: Array<{ name: string; assigned: number; completed: number }>;
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

// Generate available years (current year and 4 previous years)
const getAvailableYears = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
};

export default function ReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'revenue' | 'tasks' | 'clients'>('revenue');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);

  const availableYears = getAvailableYears();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'CA') {
      // Reset cached data when year changes
      setRevenueData(null);
      setTaskData(null);
      setClientData(null);
      loadData();
    }
  }, [isAuthenticated, user, activeTab, selectedYear]);

  const loadData = async () => {
    setLoading(true);
    try {
      const yearParam = `?year=${selectedYear}`;
      if (activeTab === 'revenue') {
        const res = await api.get(`/analytics/revenue${yearParam}`);
        setRevenueData(res.data);
      } else if (activeTab === 'tasks') {
        const res = await api.get(`/analytics/tasks${yearParam}`);
        setTaskData(res.data);
      } else if (activeTab === 'clients') {
        const res = await api.get(`/analytics/clients${yearParam}`);
        setClientData(res.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  if (user?.role !== 'CA') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">Access Restricted</h2>
            <p className="text-gray-500 mt-2">Only CA can view reports and analytics</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            Reports & Analytics
          </h1>
          <p className="text-gray-500 mt-1">Track your business performance</p>
        </div>

        {/* Tabs and Year Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-gray-200 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'revenue'
                  ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <IndianRupee className="w-4 h-4 inline-block mr-1" />
            Revenue
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 inline-block mr-1" />
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'clients'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-1" />
            Clients
          </button>
          </div>
          
          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white cursor-pointer"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Revenue Tab */}
            {activeTab === 'revenue' && revenueData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Revenue (12M)</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(revenueData.summary.totalRevenue)}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <IndianRupee className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">This Month</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(revenueData.summary.currentMonthRevenue)}
                        </p>
                        <div className={`flex items-center gap-1 mt-1 text-sm ${
                          revenueData.summary.monthlyGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {revenueData.summary.monthlyGrowth >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {Math.abs(revenueData.summary.monthlyGrowth)}% vs last month
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Paid Revenue</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">
                          {formatCurrency(revenueData.summary.paidRevenue)}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {revenueData.summary.paidCount} invoices
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Pending Revenue</p>
                        <p className="text-2xl font-bold text-orange-600 mt-1">
                          {formatCurrency(revenueData.summary.pendingRevenue)}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {revenueData.summary.invoiceCount - revenueData.summary.paidCount} invoices
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Revenue Trend</h3>
                  <div className="h-72 flex items-end gap-2 px-2">
                    {revenueData.monthlyData.map((month) => {
                      const maxTotal = Math.max(...revenueData.monthlyData.map(m => m.total), 1);
                      const paidHeight = maxTotal > 0 ? (month.paid / maxTotal) * 100 : 0;
                      const pendingHeight = maxTotal > 0 ? ((month.total - month.paid) / maxTotal) * 100 : 0;
                      const [year, monthNum] = month.month.split('-');
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-IN', { month: 'short' });
                      
                      return (
                        <div key={month.month} className="flex-1 flex flex-col items-center min-w-[50px]">
                          <div className="w-full flex flex-col items-center" style={{ height: '180px' }}>
                            <div className="flex-1 w-full flex items-end justify-center gap-1 px-1">
                              <div 
                                className="w-5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all hover:from-emerald-700 hover:to-emerald-500 cursor-pointer shadow-sm"
                                style={{ height: `${Math.max(paidHeight, 4)}%` }}
                                title={`${monthName} ${year} - Paid: ${formatCurrency(month.paid)}`}
                              />
                              <div 
                                className="w-5 bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-sm transition-all hover:from-orange-600 hover:to-orange-400 cursor-pointer shadow-sm"
                                style={{ height: `${Math.max(pendingHeight, 4)}%` }}
                                title={`${monthName} ${year} - Pending: ${formatCurrency(month.total - month.paid)}`}
                              />
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <span className="text-xs font-medium text-gray-700">{monthName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded" />
                      <span className="text-sm font-medium text-gray-600">Paid</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-t from-orange-500 to-orange-300 rounded" />
                      <span className="text-sm font-medium text-gray-600">Pending</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && taskData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{taskData.summary.totalTasks}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{taskData.summary.completedTasks}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{taskData.summary.pendingTasks}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Overdue</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{taskData.summary.overdueTasks}</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-2xl font-bold text-primary-600 mt-1">{taskData.summary.completionRate}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Status Distribution */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
                    <div className="space-y-3">
                      {taskData.statusDistribution.map((item) => {
                        const total = taskData.summary.totalTasks;
                        const percentage = total > 0 ? (item.count / total) * 100 : 0;
                        const colors: Record<string, string> = {
                          PENDING: 'bg-gray-400',
                          IN_PROGRESS: 'bg-blue-500',
                          AWAITING_APPROVAL: 'bg-yellow-500',
                          COMPLETED: 'bg-emerald-500',
                          CANCELLED: 'bg-red-400',
                        };
                        return (
                          <div key={item.status}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">{item.status.replace('_', ' ')}</span>
                              <span className="font-medium">{item.count}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${colors[item.status] || 'bg-gray-400'} rounded-full`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Staff Performance */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance</h3>
                    {taskData.staffPerformance.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No staff data available</p>
                    ) : (
                      <div className="space-y-3">
                        {taskData.staffPerformance.map((staff, idx) => {
                          const completionRate = staff.assigned > 0 
                            ? Math.round((staff.completed / staff.assigned) * 100) 
                            : 0;
                          return (
                            <div key={idx} className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-600">
                                  {staff.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium text-gray-900">{staff.name}</span>
                                  <span className="text-gray-500">
                                    {staff.completed}/{staff.assigned} ({completionRate}%)
                                  </span>
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className="h-full bg-primary-500 rounded-full"
                                    style={{ width: `${completionRate}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Monthly Task Trend */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Task Trend</h3>
                  <div className="h-56 flex items-end gap-2 px-2">
                    {taskData.monthlyData.map((month) => {
                      const maxCreated = Math.max(...taskData.monthlyData.map(m => Math.max(m.created, m.completed)), 1);
                      const createdHeight = maxCreated > 0 ? (month.created / maxCreated) * 100 : 0;
                      const completedHeight = maxCreated > 0 ? (month.completed / maxCreated) * 100 : 0;
                      const [year, monthNum] = month.month.split('-');
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-IN', { month: 'short' });
                      
                      return (
                        <div key={month.month} className="flex-1 flex flex-col items-center min-w-[50px]">
                          <div className="w-full flex flex-col items-center" style={{ height: '160px' }}>
                            <div className="flex-1 w-full flex items-end justify-center gap-1 px-1">
                              <div 
                                className="w-5 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm cursor-pointer hover:from-blue-700 hover:to-blue-500 transition-all shadow-sm"
                                style={{ height: `${Math.max(createdHeight, 4)}%` }}
                                title={`${monthName} ${year} - Created: ${month.created}`}
                              />
                              <div 
                                className="w-5 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm cursor-pointer hover:from-emerald-700 hover:to-emerald-500 transition-all shadow-sm"
                                style={{ height: `${Math.max(completedHeight, 4)}%` }}
                                title={`${monthName} ${year} - Completed: ${month.completed}`}
                              />
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <span className="text-xs font-medium text-gray-700">{monthName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-t from-blue-600 to-blue-400 rounded" />
                      <span className="text-sm font-medium text-gray-600">Created</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded" />
                      <span className="text-sm font-medium text-gray-600">Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clients Tab */}
            {activeTab === 'clients' && clientData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Clients</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{clientData.summary.totalClients}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Firms</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{clientData.summary.totalFirms}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Active Clients</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{clientData.summary.activeClients}</p>
                      </div>
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Avg Firms/Client</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{clientData.summary.avgFirmsPerClient}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Client Growth */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Client Growth</h3>
                    <div className="h-56 flex items-end gap-2 px-2">
                      {clientData.monthlyGrowth.map((month) => {
                        const maxTotal = Math.max(...clientData.monthlyGrowth.map(m => m.total), 1);
                        const height = maxTotal > 0 ? (month.total / maxTotal) * 100 : 0;
                        const [year, monthNum] = month.month.split('-');
                        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-IN', { month: 'short' });
                        
                        return (
                          <div key={month.month} className="flex-1 flex flex-col items-center min-w-[40px]">
                            <div className="w-full flex flex-col items-center" style={{ height: '160px' }}>
                              <div className="flex-1 w-full flex items-end justify-center px-1">
                                <div 
                                  className="w-6 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-sm hover:from-primary-700 hover:to-primary-500 transition-colors cursor-pointer shadow-sm"
                                  style={{ height: `${Math.max(height, 4)}%` }}
                                  title={`${monthName} ${year}: Total ${month.total} (New: ${month.newClients})`}
                                />
                              </div>
                            </div>
                            <div className="mt-2 text-center">
                              <span className="text-xs font-medium text-gray-700">{monthName}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Clients by Revenue */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients by Revenue</h3>
                    {clientData.topClients.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No client data available</p>
                    ) : (
                      <div className="space-y-3">
                        {clientData.topClients.slice(0, 5).map((client, idx) => (
                          <div key={client.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{idx + 1}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-900">{client.name}</span>
                                <span className="font-semibold text-emerald-600">
                                  {formatCurrency(client.totalRevenue)}
                                </span>
                              </div>
                              <div className="flex gap-4 text-xs text-gray-500 mt-0.5">
                                <span>{client.firms} firms</span>
                                <span>{client.tasks} tasks</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

