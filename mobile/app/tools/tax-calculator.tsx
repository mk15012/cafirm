import { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// FY 2024-25 (AY 2025-26) Tax Slabs
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250001, max: 500000, rate: 5 },
  { min: 500001, max: 1000000, rate: 20 },
  { min: 1000001, max: Infinity, rate: 30 },
];

const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300001, max: 700000, rate: 5 },
  { min: 700001, max: 1000000, rate: 10 },
  { min: 1000001, max: 1200000, rate: 15 },
  { min: 1200001, max: 1500000, rate: 20 },
  { min: 1500001, max: Infinity, rate: 30 },
];

const STANDARD_DEDUCTION_NEW = 75000;
const STANDARD_DEDUCTION_OLD = 50000;
const REBATE_LIMIT_OLD = 500000;
const REBATE_LIMIT_NEW = 700000;
const REBATE_AMOUNT = 12500;
const REBATE_AMOUNT_NEW = 25000;

export default function TaxCalculatorScreen() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    grossSalary: '',
    section80C: '',
    section80D: '',
    hra: '',
    homeLoanInterest: '',
    nps80CCD: '',
  });

  const parseAmount = (value: string): number => {
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const formatCurrency = (amount: number): string => {
    return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const calculations = useMemo(() => {
    const grossSalary = parseAmount(formData.grossSalary);
    const totalGrossIncome = grossSalary;

    // OLD REGIME Deductions
    const section80C = Math.min(parseAmount(formData.section80C), 150000);
    const section80D = parseAmount(formData.section80D);
    const hra = parseAmount(formData.hra);
    const homeLoanInterest = Math.min(parseAmount(formData.homeLoanInterest), 200000);
    const nps80CCD = Math.min(parseAmount(formData.nps80CCD), 50000);

    const totalOldDeductions = 
      STANDARD_DEDUCTION_OLD + 
      section80C + 
      section80D + 
      hra + 
      homeLoanInterest + 
      nps80CCD;

    // Calculate taxable income
    const taxableIncomeOld = Math.max(0, totalGrossIncome - totalOldDeductions);
    const taxableIncomeNew = Math.max(0, totalGrossIncome - STANDARD_DEDUCTION_NEW);

    // Calculate tax for Old Regime
    let taxOld = 0;
    for (const slab of OLD_REGIME_SLABS) {
      if (taxableIncomeOld > slab.min) {
        const taxableInSlab = Math.min(taxableIncomeOld, slab.max) - slab.min;
        taxOld += (taxableInSlab * slab.rate) / 100;
      }
    }
    
    // Apply rebate u/s 87A for old regime
    if (taxableIncomeOld <= REBATE_LIMIT_OLD) {
      taxOld = Math.max(0, taxOld - REBATE_AMOUNT);
    }

    // Calculate tax for New Regime
    let taxNew = 0;
    for (const slab of NEW_REGIME_SLABS) {
      if (taxableIncomeNew > slab.min) {
        const taxableInSlab = Math.min(taxableIncomeNew, slab.max) - slab.min;
        taxNew += (taxableInSlab * slab.rate) / 100;
      }
    }
    
    // Apply rebate u/s 87A for new regime
    if (taxableIncomeNew <= REBATE_LIMIT_NEW) {
      taxNew = Math.max(0, taxNew - REBATE_AMOUNT_NEW);
    }

    // Add 4% Health & Education Cess
    const cessOld = taxOld * 0.04;
    const cessNew = taxNew * 0.04;
    const totalTaxOld = taxOld + cessOld;
    const totalTaxNew = taxNew + cessNew;

    // Determine better regime
    const savings = totalTaxOld - totalTaxNew;
    const betterRegime = savings > 0 ? 'NEW' : savings < 0 ? 'OLD' : 'EQUAL';

    return {
      totalGrossIncome,
      totalOldDeductions,
      taxableIncomeOld,
      taxableIncomeNew,
      totalTaxOld,
      totalTaxNew,
      savings: Math.abs(savings),
      betterRegime,
    };
  }, [formData]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, [field]: cleanValue });
  };

  const resetForm = () => {
    setFormData({
      grossSalary: '',
      section80C: '',
      section80D: '',
      hra: '',
      homeLoanInterest: '',
      nps80CCD: '',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                onPress={() => router.canGoBack() ? router.back() : router.replace('/dashboard')}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>🧮 Tax Calculator</Text>
            <Text style={styles.headerSubtitle}>FY 2024-25 • Compare Old vs New Regime</Text>
          </View>

          {/* Recommendation Banner */}
          {calculations.totalGrossIncome > 0 && (
            <View style={[
              styles.recommendationBanner,
              { backgroundColor: calculations.betterRegime === 'NEW' ? '#059669' : calculations.betterRegime === 'OLD' ? '#3b82f6' : '#6b7280' }
            ]}>
              <Text style={styles.recommendationLabel}>Recommended</Text>
              <Text style={styles.recommendationValue}>
                {calculations.betterRegime === 'EQUAL' ? 'Both Equal' : `${calculations.betterRegime} Regime`}
              </Text>
              {calculations.savings > 0 && (
                <Text style={styles.savingsText}>
                  Save {formatCurrency(calculations.savings)}
                </Text>
              )}
            </View>
          )}

          {/* Income Input */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>💰 Annual Income</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gross Salary</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={formData.grossSalary}
                  onChangeText={(v) => handleInputChange('grossSalary', v)}
                  placeholder="12,00,000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Deductions (Old Regime) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Deductions (Old Regime)</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Section 80C (max ₹1.5L)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={formData.section80C}
                  onChangeText={(v) => handleInputChange('section80C', v)}
                  placeholder="1,50,000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Section 80D (Medical)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={formData.section80D}
                  onChangeText={(v) => handleInputChange('section80D', v)}
                  placeholder="25,000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HRA Exemption</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={formData.hra}
                  onChangeText={(v) => handleInputChange('hra', v)}
                  placeholder="1,00,000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Home Loan Interest (max ₹2L)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={formData.homeLoanInterest}
                  onChangeText={(v) => handleInputChange('homeLoanInterest', v)}
                  placeholder="2,00,000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NPS 80CCD(1B) (max ₹50K)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencyPrefix}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nps80CCD}
                  onChangeText={(v) => handleInputChange('nps80CCD', v)}
                  placeholder="50,000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          <View style={styles.resultsContainer}>
            {/* Old Regime */}
            <View style={[styles.resultCard, calculations.betterRegime === 'OLD' && styles.resultCardHighlight]}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Old Regime</Text>
                {calculations.betterRegime === 'OLD' && (
                  <View style={styles.betterBadge}>
                    <Text style={styles.betterBadgeText}>Better</Text>
                  </View>
                )}
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Gross Income</Text>
                <Text style={styles.resultValue}>{formatCurrency(calculations.totalGrossIncome)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Deductions</Text>
                <Text style={[styles.resultValue, styles.greenText]}>- {formatCurrency(calculations.totalOldDeductions)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Taxable Income</Text>
                <Text style={styles.resultValue}>{formatCurrency(calculations.taxableIncomeOld)}</Text>
              </View>
              <View style={[styles.resultRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Tax</Text>
                <Text style={styles.totalValue}>{formatCurrency(calculations.totalTaxOld)}</Text>
              </View>
            </View>

            {/* New Regime */}
            <View style={[styles.resultCard, calculations.betterRegime === 'NEW' && styles.resultCardHighlight]}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>New Regime</Text>
                {calculations.betterRegime === 'NEW' && (
                  <View style={styles.betterBadge}>
                    <Text style={styles.betterBadgeText}>Better</Text>
                  </View>
                )}
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Gross Income</Text>
                <Text style={styles.resultValue}>{formatCurrency(calculations.totalGrossIncome)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Std. Deduction</Text>
                <Text style={[styles.resultValue, styles.greenText]}>- {formatCurrency(STANDARD_DEDUCTION_NEW)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Taxable Income</Text>
                <Text style={styles.resultValue}>{formatCurrency(calculations.taxableIncomeNew)}</Text>
              </View>
              <View style={[styles.resultRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Tax</Text>
                <Text style={styles.totalValue}>{formatCurrency(calculations.totalTaxNew)}</Text>
              </View>
            </View>
          </View>

          {/* Tax Slabs Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>New Regime Slabs (FY 24-25)</Text>
            <Text style={styles.infoText}>₹0 - ₹3L: 0%</Text>
            <Text style={styles.infoText}>₹3L - ₹7L: 5%</Text>
            <Text style={styles.infoText}>₹7L - ₹10L: 10%</Text>
            <Text style={styles.infoText}>₹10L - ₹12L: 15%</Text>
            <Text style={styles.infoText}>₹12L - ₹15L: 20%</Text>
            <Text style={styles.infoText}>Above ₹15L: 30%</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  header: {
    backgroundColor: '#059669',
    padding: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  recommendationBanner: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  recommendationLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recommendationValue: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginTop: 4,
  },
  savingsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  currencyPrefix: {
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#64748b',
  },
  input: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
    fontSize: 16,
    color: '#0f172a',
  },
  resetButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  resultCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultCardHighlight: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  betterBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  betterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  greenText: {
    color: '#16a34a',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
  },
  infoCard: {
    backgroundColor: '#f1f5f9',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
});

