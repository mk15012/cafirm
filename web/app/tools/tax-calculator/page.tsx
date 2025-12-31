'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Calculator, TrendingUp, TrendingDown, IndianRupee, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

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

export default function TaxCalculatorPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    grossSalary: '',
    otherIncome: '',
    section80C: '',       // Max 1.5L (PPF, ELSS, LIC, etc.)
    section80D: '',       // Medical insurance
    section80E: '',       // Education loan interest
    section80G: '',       // Donations
    section80TTA: '',     // Savings interest (max 10K)
    hra: '',              // HRA exemption
    lta: '',              // LTA exemption
    homeLoanInterest: '', // Section 24(b) - max 2L
    nps80CCD: '',         // NPS - additional 50K
    otherDeductions: '',  // Any other deductions
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
    const otherIncome = parseAmount(formData.otherIncome);
    const totalGrossIncome = grossSalary + otherIncome;

    // OLD REGIME Deductions
    const section80C = Math.min(parseAmount(formData.section80C), 150000);
    const section80D = parseAmount(formData.section80D);
    const section80E = parseAmount(formData.section80E);
    const section80G = parseAmount(formData.section80G);
    const section80TTA = Math.min(parseAmount(formData.section80TTA), 10000);
    const hra = parseAmount(formData.hra);
    const lta = parseAmount(formData.lta);
    const homeLoanInterest = Math.min(parseAmount(formData.homeLoanInterest), 200000);
    const nps80CCD = Math.min(parseAmount(formData.nps80CCD), 50000);
    const otherDeductions = parseAmount(formData.otherDeductions);

    const totalOldDeductions = 
      STANDARD_DEDUCTION_OLD + 
      section80C + 
      section80D + 
      section80E + 
      section80G + 
      section80TTA + 
      hra + 
      lta + 
      homeLoanInterest + 
      nps80CCD + 
      otherDeductions;

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
      taxOld,
      taxNew,
      cessOld,
      cessNew,
      totalTaxOld,
      totalTaxNew,
      savings: Math.abs(savings),
      betterRegime,
    };
  }, [formData]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    // Remove non-numeric characters except for decimal
    const cleanValue = value.replace(/[^0-9.]/g, '');
    setFormData({ ...formData, [field]: cleanValue });
  };

  const resetForm = () => {
    setFormData({
      grossSalary: '',
      otherIncome: '',
      section80C: '',
      section80D: '',
      section80E: '',
      section80G: '',
      section80TTA: '',
      hra: '',
      lta: '',
      homeLoanInterest: '',
      nps80CCD: '',
      otherDeductions: '',
    });
  };

  return (
    <AppLayout title="Tax Regime Calculator">
      {/* Header */}
      <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tax Regime Calculator</h1>
              <p className="text-sm text-gray-500">FY 2024-25 (AY 2025-26) - Compare Old vs New Regime</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Income Section */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-primary-600" />
                Income Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gross Salary (Annual)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.grossSalary}
                      onChange={(e) => handleInputChange('grossSalary', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                      placeholder="12,00,000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Income</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.otherIncome}
                      onChange={(e) => handleInputChange('otherIncome', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Old Regime Deductions */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Deductions (Applicable in Old Regime Only)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section 80C <span className="text-gray-400">(max ₹1.5L)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.section80C}
                      onChange={(e) => handleInputChange('section80C', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="1,50,000"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">PPF, ELSS, LIC, NSC, etc.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section 80D <span className="text-gray-400">(Medical)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.section80D}
                      onChange={(e) => handleInputChange('section80D', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="25,000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HRA Exemption</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.hra}
                      onChange={(e) => handleInputChange('hra', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="1,00,000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Home Loan Interest <span className="text-gray-400">(max ₹2L)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.homeLoanInterest}
                      onChange={(e) => handleInputChange('homeLoanInterest', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="2,00,000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NPS 80CCD(1B) <span className="text-gray-400">(max ₹50K)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.nps80CCD}
                      onChange={(e) => handleInputChange('nps80CCD', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="50,000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LTA Exemption</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.lta}
                      onChange={(e) => handleInputChange('lta', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="30,000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section 80TTA <span className="text-gray-400">(max ₹10K)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.section80TTA}
                      onChange={(e) => handleInputChange('section80TTA', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="10,000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section 80E (Edu Loan)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.section80E}
                      onChange={(e) => handleInputChange('section80E', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section 80G (Donations)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                    <input
                      type="text"
                      value={formData.section80G}
                      onChange={(e) => handleInputChange('section80G', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Recommendation Card */}
            {calculations.totalGrossIncome > 0 && (
              <div className={`rounded-xl shadow-lg p-6 ${
                calculations.betterRegime === 'NEW' 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                  : calculations.betterRegime === 'OLD'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    : 'bg-gradient-to-br from-gray-500 to-gray-600'
              }`}>
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-2">
                    {calculations.betterRegime === 'NEW' ? (
                      <TrendingUp className="w-6 h-6" />
                    ) : (
                      <TrendingDown className="w-6 h-6" />
                    )}
                    <span className="text-lg font-semibold">Recommendation</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-2">
                    {calculations.betterRegime === 'EQUAL' ? 'Both Equal' : `${calculations.betterRegime} Regime`}
                  </h3>
                  {calculations.savings > 0 && (
                    <p className="text-white/90">
                      You save <span className="font-bold">{formatCurrency(calculations.savings)}</span> with {calculations.betterRegime} regime
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Old Regime Summary */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Old Regime</h3>
                {calculations.betterRegime === 'OLD' && (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Better
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gross Income</span>
                  <span className="font-medium">{formatCurrency(calculations.totalGrossIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Deductions</span>
                  <span className="font-medium text-green-600">- {formatCurrency(calculations.totalOldDeductions)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">Taxable Income</span>
                  <span className="font-medium">{formatCurrency(calculations.taxableIncomeOld)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(calculations.taxOld)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cess (4%)</span>
                  <span className="font-medium">{formatCurrency(calculations.cessOld)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span className="text-gray-900">Total Tax</span>
                  <span className="text-red-600">{formatCurrency(calculations.totalTaxOld)}</span>
                </div>
              </div>
            </div>

            {/* New Regime Summary */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">New Regime</h3>
                {calculations.betterRegime === 'NEW' && (
                  <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> Better
                  </span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gross Income</span>
                  <span className="font-medium">{formatCurrency(calculations.totalGrossIncome)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Standard Deduction</span>
                  <span className="font-medium text-green-600">- {formatCurrency(STANDARD_DEDUCTION_NEW)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-600">Taxable Income</span>
                  <span className="font-medium">{formatCurrency(calculations.taxableIncomeNew)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(calculations.taxNew)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cess (4%)</span>
                  <span className="font-medium">{formatCurrency(calculations.cessNew)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span className="text-gray-900">Total Tax</span>
                  <span className="text-red-600">{formatCurrency(calculations.totalTaxNew)}</span>
                </div>
              </div>
            </div>

            {/* Tax Slabs Reference */}
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
              <p className="font-medium mb-2">New Regime Slabs (FY 24-25):</p>
              <ul className="space-y-1">
                <li>₹0 - ₹3L: 0%</li>
                <li>₹3L - ₹7L: 5%</li>
                <li>₹7L - ₹10L: 10%</li>
                <li>₹10L - ₹12L: 15%</li>
                <li>₹12L - ₹15L: 20%</li>
                <li>Above ₹15L: 30%</li>
              </ul>
            </div>
          </div>
        </div>
    </AppLayout>
  );
}

