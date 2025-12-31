// Compliance Rules Engine for CA Firm Pro
// All amounts in rupees

export interface ComplianceThresholds {
  GST_GOODS: number;
  GST_SERVICES: number;
  GST_SPECIAL_STATES: number;
  GST_MONTHLY_THRESHOLD: number;
  TAX_AUDIT_BUSINESS: number;
  TAX_AUDIT_BUSINESS_DIGITAL: number;
  TAX_AUDIT_PROFESSION: number;
  ADVANCE_TAX_LIABILITY: number;
}

export const THRESHOLDS: ComplianceThresholds = {
  GST_GOODS: 4000000,           // ₹40 Lakhs
  GST_SERVICES: 2000000,        // ₹20 Lakhs
  GST_SPECIAL_STATES: 1000000,  // ₹10 Lakhs (NE states, J&K, etc.)
  GST_MONTHLY_THRESHOLD: 50000000, // ₹5 Crore (above this = monthly filing)
  TAX_AUDIT_BUSINESS: 10000000,    // ₹1 Crore
  TAX_AUDIT_BUSINESS_DIGITAL: 100000000, // ₹10 Crore (95% digital payments)
  TAX_AUDIT_PROFESSION: 5000000,   // ₹50 Lakhs
  ADVANCE_TAX_LIABILITY: 10000,    // ₹10,000
};

// Special category states for GST (lower threshold)
export const SPECIAL_CATEGORY_STATES = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura',
  'Himachal Pradesh',
  'Uttarakhand',
  'Jammu and Kashmir',
  'Ladakh',
];

// Entity types
export const ENTITY_TYPES = [
  { code: 'INDIVIDUAL', name: 'Individual', itrType: 'ITR1' },
  { code: 'PROPRIETORSHIP', name: 'Proprietorship', itrType: 'ITR3' },
  { code: 'PARTNERSHIP', name: 'Partnership Firm', itrType: 'ITR5' },
  { code: 'LLP', name: 'Limited Liability Partnership (LLP)', itrType: 'ITR5', hasROC: true },
  { code: 'PRIVATE_LIMITED', name: 'Private Limited Company', itrType: 'ITR6', hasROC: true },
  { code: 'PUBLIC_LIMITED', name: 'Public Limited Company', itrType: 'ITR6', hasROC: true },
  { code: 'HUF', name: 'Hindu Undivided Family (HUF)', itrType: 'ITR2' },
  { code: 'TRUST', name: 'Trust/Society', itrType: 'ITR7' },
];

// Compliance types with due dates
export const COMPLIANCE_TYPES = [
  // GST
  { code: 'GSTR1', name: 'GSTR-1 (Sales)', category: 'GST', frequencyMonthly: 11, frequencyQuarterly: 13, description: 'Outward supplies' },
  { code: 'GSTR3B', name: 'GSTR-3B (Summary)', category: 'GST', frequencyMonthly: 20, frequencyQuarterly: 22, description: 'Summary return with tax payment' },
  { code: 'GSTR9', name: 'GSTR-9 (Annual)', category: 'GST', dueMonth: 12, dueDay: 31, description: 'Annual return' },
  
  // TDS
  { code: 'TDS_24Q', name: 'TDS 24Q (Salary)', category: 'TDS', quarterly: true, dueDay: 31, description: 'TDS on salary' },
  { code: 'TDS_26Q', name: 'TDS 26Q (Non-salary)', category: 'TDS', quarterly: true, dueDay: 31, description: 'TDS on other payments' },
  
  // ITR
  { code: 'ITR', name: 'Income Tax Return', category: 'ITR', yearly: true, dueDateNonAudit: 'July 31', dueDateAudit: 'October 31', dueDateTP: 'November 30' },
  
  // Audit
  { code: 'TAX_AUDIT', name: 'Tax Audit (44AB)', category: 'AUDIT', yearly: true, dueDate: 'September 30' },
  
  // Advance Tax
  { code: 'ADVANCE_TAX', name: 'Advance Tax', category: 'TAX', quarterly: true, dueDates: ['June 15', 'September 15', 'December 15', 'March 15'] },
  
  // ROC
  { code: 'ROC_ANNUAL', name: 'ROC Annual Return (AOC-4, MGT-7)', category: 'ROC', yearly: true, dueDate: '60 days from AGM' },
];

export interface ComplianceSuggestion {
  code: string;
  name: string;
  category: string;
  applicable: boolean;
  reason: string;
  frequency?: string;
  dueDate?: string;
  canOverride: boolean;
}

export interface SuggestionInput {
  entityType: string;
  natureOfBusiness: string;
  state: string;
  annualTurnover: number;
}

export function suggestCompliances(input: SuggestionInput): ComplianceSuggestion[] {
  const { entityType, natureOfBusiness, state, annualTurnover } = input;
  const suggestions: ComplianceSuggestion[] = [];
  
  const isSpecialState = SPECIAL_CATEGORY_STATES.includes(state);
  const isProfession = ['INDIVIDUAL', 'PROPRIETORSHIP'].includes(entityType);
  const isCompany = ['PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'LLP'].includes(entityType);
  
  // GST threshold based on nature and state
  let gstThreshold = THRESHOLDS.GST_GOODS;
  if (natureOfBusiness === 'SERVICES') {
    gstThreshold = THRESHOLDS.GST_SERVICES;
  }
  if (isSpecialState) {
    gstThreshold = THRESHOLDS.GST_SPECIAL_STATES;
  }
  
  // GST Suggestion
  const gstApplicable = annualTurnover > gstThreshold;
  const gstFrequency = annualTurnover > THRESHOLDS.GST_MONTHLY_THRESHOLD ? 'MONTHLY' : 'QUARTERLY';
  
  suggestions.push({
    code: 'GST',
    name: 'GST Registration & Filing',
    category: 'GST',
    applicable: gstApplicable,
    reason: gstApplicable 
      ? `Turnover ₹${formatAmount(annualTurnover)} exceeds threshold of ₹${formatAmount(gstThreshold)}`
      : `Turnover ₹${formatAmount(annualTurnover)} is below threshold of ₹${formatAmount(gstThreshold)}`,
    frequency: gstFrequency,
    dueDate: gstFrequency === 'MONTHLY' ? '11th (GSTR-1), 20th (GSTR-3B)' : '13th (GSTR-1), 22nd/24th (GSTR-3B)',
    canOverride: true,
  });
  
  // Tax Audit Suggestion
  const auditThreshold = isProfession ? THRESHOLDS.TAX_AUDIT_PROFESSION : THRESHOLDS.TAX_AUDIT_BUSINESS;
  const auditApplicable = annualTurnover > auditThreshold;
  
  suggestions.push({
    code: 'TAX_AUDIT',
    name: 'Tax Audit (Section 44AB)',
    category: 'AUDIT',
    applicable: auditApplicable,
    reason: auditApplicable
      ? `Turnover ₹${formatAmount(annualTurnover)} exceeds ${isProfession ? 'professional' : 'business'} threshold of ₹${formatAmount(auditThreshold)}`
      : `Turnover ₹${formatAmount(annualTurnover)} is below threshold of ₹${formatAmount(auditThreshold)}`,
    dueDate: 'September 30',
    canOverride: true,
  });
  
  // ITR Suggestion
  const entityInfo = ENTITY_TYPES.find(e => e.code === entityType);
  const itrDueDate = auditApplicable ? 'October 31' : 'July 31';
  
  suggestions.push({
    code: 'ITR',
    name: `Income Tax Return (${entityInfo?.itrType || 'ITR'})`,
    category: 'ITR',
    applicable: true, // ITR is always applicable
    reason: `${entityInfo?.name || entityType} must file ${entityInfo?.itrType || 'ITR'}`,
    dueDate: itrDueDate,
    canOverride: false,
  });
  
  // TDS Suggestion
  suggestions.push({
    code: 'TDS',
    name: 'TDS Returns (26Q, 24Q)',
    category: 'TDS',
    applicable: true, // CA decides based on whether client has TDS deductions
    reason: 'Required if deducting TDS on payments to contractors, professionals, or employees',
    frequency: 'QUARTERLY',
    dueDate: '31st of month following quarter',
    canOverride: true,
  });
  
  // Advance Tax Suggestion
  suggestions.push({
    code: 'ADVANCE_TAX',
    name: 'Advance Tax',
    category: 'TAX',
    applicable: annualTurnover > 500000, // Suggest if turnover > 5L (likely has tax liability)
    reason: 'Required if annual tax liability exceeds ₹10,000',
    frequency: 'QUARTERLY',
    dueDate: '15th of June, September, December, March',
    canOverride: true,
  });
  
  // ROC Suggestion (only for companies/LLP)
  if (isCompany) {
    suggestions.push({
      code: 'ROC',
      name: 'ROC Annual Filing (AOC-4, MGT-7)',
      category: 'ROC',
      applicable: true,
      reason: `${entityInfo?.name} must file annual returns with ROC`,
      dueDate: '60 days from AGM',
      canOverride: false,
    });
  }
  
  return suggestions;
}

function formatAmount(amount: number): string {
  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(2)} Crore`;
  } else if (amount >= 100000) {
    return `${(amount / 100000).toFixed(2)} Lakhs`;
  }
  return amount.toLocaleString('en-IN');
}

// Get compliance calendar for a firm
export interface ComplianceCalendarItem {
  code: string;
  name: string;
  category: string;
  dueDate: Date;
  frequency: string;
  firmId: number;
  firmName: string;
  clientName: string;
}

export function getComplianceCalendarForMonth(
  firms: Array<{
    id: number;
    name: string;
    client: { name: string };
    hasGST: boolean;
    gstFrequency: string | null;
    hasTDS: boolean;
    hasITR: boolean;
    itrDueDate: string | null;
    hasTaxAudit: boolean;
    hasAdvanceTax: boolean;
    hasROC: boolean;
  }>,
  year: number,
  month: number // 1-12
): ComplianceCalendarItem[] {
  const items: ComplianceCalendarItem[] = [];
  
  for (const firm of firms) {
    // GST Compliances
    if (firm.hasGST) {
      const isMonthly = firm.gstFrequency === 'MONTHLY';
      const isQuarterEnd = [3, 6, 9, 12].includes(month);
      
      if (isMonthly || isQuarterEnd) {
        // GSTR-1
        const gstr1Day = isMonthly ? 11 : 13;
        items.push({
          code: 'GSTR1',
          name: 'GSTR-1 Filing',
          category: 'GST',
          dueDate: new Date(year, month - 1, gstr1Day),
          frequency: isMonthly ? 'Monthly' : 'Quarterly',
          firmId: firm.id,
          firmName: firm.name,
          clientName: firm.client.name,
        });
        
        // GSTR-3B
        const gstr3bDay = isMonthly ? 20 : 22;
        items.push({
          code: 'GSTR3B',
          name: 'GSTR-3B Filing',
          category: 'GST',
          dueDate: new Date(year, month - 1, gstr3bDay),
          frequency: isMonthly ? 'Monthly' : 'Quarterly',
          firmId: firm.id,
          firmName: firm.name,
          clientName: firm.client.name,
        });
      }
    }
    
    // TDS Compliances (Quarterly)
    if (firm.hasTDS && [4, 7, 10, 1].includes(month)) {
      items.push({
        code: 'TDS',
        name: 'TDS Return (26Q/24Q)',
        category: 'TDS',
        dueDate: new Date(year, month - 1, 31),
        frequency: 'Quarterly',
        firmId: firm.id,
        firmName: firm.name,
        clientName: firm.client.name,
      });
    }
    
    // Advance Tax (Quarterly)
    if (firm.hasAdvanceTax) {
      if (month === 6) {
        items.push({
          code: 'ADVANCE_TAX',
          name: 'Advance Tax (Q1)',
          category: 'TAX',
          dueDate: new Date(year, 5, 15),
          frequency: 'Quarterly',
          firmId: firm.id,
          firmName: firm.name,
          clientName: firm.client.name,
        });
      }
      if (month === 9) {
        items.push({
          code: 'ADVANCE_TAX',
          name: 'Advance Tax (Q2)',
          category: 'TAX',
          dueDate: new Date(year, 8, 15),
          frequency: 'Quarterly',
          firmId: firm.id,
          firmName: firm.name,
          clientName: firm.client.name,
        });
      }
      if (month === 12) {
        items.push({
          code: 'ADVANCE_TAX',
          name: 'Advance Tax (Q3)',
          category: 'TAX',
          dueDate: new Date(year, 11, 15),
          frequency: 'Quarterly',
          firmId: firm.id,
          firmName: firm.name,
          clientName: firm.client.name,
        });
      }
      if (month === 3) {
        items.push({
          code: 'ADVANCE_TAX',
          name: 'Advance Tax (Q4)',
          category: 'TAX',
          dueDate: new Date(year, 2, 15),
          frequency: 'Quarterly',
          firmId: firm.id,
          firmName: firm.name,
          clientName: firm.client.name,
        });
      }
    }
    
    // ITR (Yearly - July or October)
    if (firm.hasITR) {
      const itrMonth = firm.itrDueDate === 'OCT_31' ? 10 : 7;
      const itrDay = firm.itrDueDate === 'OCT_31' ? 31 : 31;
      if (month === itrMonth) {
        items.push({
          code: 'ITR',
          name: 'Income Tax Return',
          category: 'ITR',
          dueDate: new Date(year, itrMonth - 1, itrDay),
          frequency: 'Yearly',
          firmId: firm.id,
          firmName: firm.name,
          clientName: firm.client.name,
        });
      }
    }
    
    // Tax Audit (Yearly - September 30)
    if (firm.hasTaxAudit && month === 9) {
      items.push({
        code: 'TAX_AUDIT',
        name: 'Tax Audit Report',
        category: 'AUDIT',
        dueDate: new Date(year, 8, 30),
        frequency: 'Yearly',
        firmId: firm.id,
        firmName: firm.name,
        clientName: firm.client.name,
      });
    }
  }
  
  // Sort by due date
  items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  
  return items;
}

