import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  resource: 'clients' | 'users' | 'credentials';
  currentUsage: number;
  limit: number;
  currentPlan: string;
}

const resourceLabels: Record<string, string> = {
  clients: 'clients',
  users: 'team members',
  credentials: 'stored credentials',
};

const nextPlanSuggestions: Record<string, { name: string; features: string[] }> = {
  FREE: {
    name: 'Basic',
    features: ['150 clients', 'Approval workflows', 'Priority support'],
  },
  BASIC: {
    name: 'Professional',
    features: ['500 clients', 'Advanced analytics', 'Custom branding'],
  },
  PROFESSIONAL: {
    name: 'Enterprise',
    features: ['Unlimited clients', 'Dedicated support', 'API access'],
  },
};

export default function UpgradeModal({
  visible,
  onClose,
  resource,
  currentUsage,
  limit,
  currentPlan,
}: UpgradeModalProps) {
  const resourceLabel = resourceLabels[resource] || resource;
  const nextPlan = nextPlanSuggestions[currentPlan] || nextPlanSuggestions.FREE;

  const handleUpgrade = () => {
    // Open web app for upgrade
    const message = 'To upgrade your subscription plan, please visit the web app.\n\nGo to: Settings → Subscription';
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      // Could open a web link here
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with gradient */}
          <LinearGradient
            colors={['#f97316', '#ea580c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.crownIcon}>
              <Text style={styles.crownEmoji}>👑</Text>
            </View>
            
            <Text style={styles.headerTitle}>Upgrade Required</Text>
            <Text style={styles.headerSubtitle}>You've reached your plan limit</Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* Limit Info */}
            <View style={styles.limitBox}>
              <Text style={styles.limitIcon}>⚡</Text>
              <View style={styles.limitInfo}>
                <Text style={styles.limitTitle}>
                  {resourceLabel.charAt(0).toUpperCase() + resourceLabel.slice(1)} Limit Reached
                </Text>
                <Text style={styles.limitText}>
                  You're using {currentUsage} of {limit} {resourceLabel}
                </Text>
              </View>
            </View>

            {/* Upgrade Benefits */}
            <Text style={styles.upgradeTitle}>Upgrade to {nextPlan.name} to get:</Text>
            
            {nextPlan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}

            {/* Buttons */}
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.upgradeButtonGradient}
              >
                <Text style={styles.upgradeButtonText}>View Plans & Upgrade</Text>
                <Text style={styles.upgradeButtonArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.laterButton} onPress={onClose}>
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>

            {/* Current Plan */}
            <Text style={styles.currentPlan}>Current plan: {currentPlan}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  crownIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  crownEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 20,
  },
  limitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  limitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  limitInfo: {
    flex: 1,
  },
  limitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 2,
  },
  limitText: {
    fontSize: 12,
    color: '#dc2626',
  },
  upgradeTitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureCheck: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 10,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: '#1f2937',
  },
  upgradeButton: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  upgradeButtonArrow: {
    color: '#ffffff',
    fontSize: 18,
    marginLeft: 8,
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  laterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  currentPlan: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});

