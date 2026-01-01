import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface Plan {
  code: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  clientLimit: number;
  userLimit: number;
  features: string[];
}

interface SubscriptionData {
  subscription: {
    plan: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string | null;
  };
  usage: {
    clients: { used: number; limit: number };
    users: { used: number; limit: number };
  };
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isCA = user?.role === 'CA';

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    if (!isCA) {
      if (Platform.OS === 'web') {
        window.alert('Access Denied: Only CA can access subscription settings');
      } else {
        Alert.alert('Access Denied', 'Only CA can access subscription settings');
      }
      router.canGoBack() ? router.back() : router.replace('/dashboard');
      return;
    }
    loadData();
  }, [isAuthenticated, isCA]);

  const loadData = async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get('/subscription/my'),
        api.get('/subscription/plans'),
      ]);
      setSubscription(subRes.data);
      setPlans(plansRes.data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpgrade = () => {
    const message = 'To upgrade your subscription plan, please visit the web app.\n\nGo to: Settings → Subscription';
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('Upgrade Plan', message, [{ text: 'OK' }]);
    }
  };

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  const getPlanIcon = (planCode: string) => {
    const icons: Record<string, string> = {
      FREE: '⚡',
      BASIC: '🏢',
      PROFESSIONAL: '👑',
      ENTERPRISE: '🚀',
    };
    return icons[planCode] || '📦';
  };

  const getPlanColor = (planCode: string) => {
    const colors: Record<string, string> = {
      FREE: '#64748b',
      BASIC: '#0ea5e9',
      PROFESSIONAL: '#7c3aed',
      ENTERPRISE: '#f59e0b',
    };
    return colors[planCode] || '#64748b';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={['#0ea5e9']} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Subscription</Text>
          <View style={{ width: 60 }} />
        </View>

        {subscription && (
          <>
            {/* Current Plan Card */}
            <View style={[styles.currentPlanCard, { borderColor: getPlanColor(subscription.subscription.plan) }]}>
              <View style={styles.planHeader}>
                <Text style={styles.planIcon}>{getPlanIcon(subscription.subscription.plan)}</Text>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{subscription.subscription.planName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: subscription.subscription.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7' }]}>
                    <Text style={[styles.statusText, { color: subscription.subscription.status === 'ACTIVE' ? '#16a34a' : '#d97706' }]}>
                      {subscription.subscription.status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Usage Stats */}
              <View style={styles.usageSection}>
                <Text style={styles.usageTitle}>Usage</Text>
                
                <View style={styles.usageItem}>
                  <View style={styles.usageHeader}>
                    <Text style={styles.usageLabel}>👥 Clients</Text>
                    <Text style={styles.usageValue}>
                      {subscription.usage.clients.used} / {subscription.usage.clients.limit === -1 ? '∞' : subscription.usage.clients.limit}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: subscription.usage.clients.limit === -1 ? '10%' : 
                            `${Math.min((subscription.usage.clients.used / subscription.usage.clients.limit) * 100, 100)}%`,
                          backgroundColor: subscription.usage.clients.limit !== -1 && 
                            subscription.usage.clients.used >= subscription.usage.clients.limit ? '#ef4444' : '#0ea5e9'
                        }
                      ]} 
                    />
                  </View>
                </View>

                <View style={styles.usageItem}>
                  <View style={styles.usageHeader}>
                    <Text style={styles.usageLabel}>👤 Team Members</Text>
                    <Text style={styles.usageValue}>
                      {subscription.usage.users.used} / {subscription.usage.users.limit === -1 ? '∞' : subscription.usage.users.limit}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: subscription.usage.users.limit === -1 ? '10%' : 
                            `${Math.min((subscription.usage.users.used / subscription.usage.users.limit) * 100, 100)}%`,
                          backgroundColor: subscription.usage.users.limit !== -1 && 
                            subscription.usage.users.used >= subscription.usage.users.limit ? '#ef4444' : '#10b981'
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Available Plans */}
            <Text style={styles.sectionTitle}>Available Plans</Text>
            
            {plans.map((plan) => (
              <View 
                key={plan.code} 
                style={[
                  styles.planCard,
                  subscription.subscription.plan === plan.code && styles.currentPlanHighlight,
                  { borderLeftColor: getPlanColor(plan.code) }
                ]}
              >
                <View style={styles.planCardHeader}>
                  <Text style={styles.planCardIcon}>{getPlanIcon(plan.code)}</Text>
                  <View style={styles.planCardInfo}>
                    <Text style={styles.planCardName}>{plan.name}</Text>
                    <Text style={styles.planCardPrice}>
                      {plan.monthlyPrice === 0 ? 'Free' : `${formatCurrency(plan.monthlyPrice)}/mo`}
                    </Text>
                  </View>
                  {subscription.subscription.plan === plan.code && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>

                <View style={styles.planLimits}>
                  <Text style={styles.limitItem}>
                    👥 {plan.clientLimit === -1 ? 'Unlimited' : plan.clientLimit} Clients
                  </Text>
                  <Text style={styles.limitItem}>
                    👤 {plan.userLimit === -1 ? 'Unlimited' : plan.userLimit} Users
                  </Text>
                </View>

                {subscription.subscription.plan !== plan.code && plan.code !== 'FREE' && (
                  <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                    <Text style={styles.upgradeButtonText}>Upgrade →</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
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

  currentPlanCard: { 
    backgroundColor: 'white', 
    margin: 16, 
    borderRadius: 16, 
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  planIcon: { fontSize: 40, marginRight: 16 },
  planInfo: { flex: 1 },
  planName: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },

  usageSection: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  usageTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 12 },
  usageItem: { marginBottom: 16 },
  usageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  usageLabel: { fontSize: 14, color: '#374151' },
  usageValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  progressBar: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },

  planCard: { 
    backgroundColor: 'white', 
    marginHorizontal: 16, 
    marginBottom: 12, 
    borderRadius: 12, 
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentPlanHighlight: { backgroundColor: '#f0f9ff' },
  planCardHeader: { flexDirection: 'row', alignItems: 'center' },
  planCardIcon: { fontSize: 28, marginRight: 12 },
  planCardInfo: { flex: 1 },
  planCardName: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  planCardPrice: { fontSize: 14, color: '#64748b' },
  currentBadge: { backgroundColor: '#0ea5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  currentBadgeText: { color: 'white', fontSize: 12, fontWeight: '600' },

  planLimits: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  limitItem: { fontSize: 13, color: '#64748b' },

  upgradeButton: { backgroundColor: '#7c3aed', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  upgradeButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
});

