/**
 * Tax Deadline Tasks Generator for INDIVIDUAL users
 * Auto-creates common Indian tax deadline tasks
 */

interface TaxDeadline {
  title: string;
  description: string;
  month: number; // 1-12
  day: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// Common Indian tax deadlines
const TAX_DEADLINES: TaxDeadline[] = [
  {
    title: 'File Income Tax Return (ITR)',
    description: 'Last date to file ITR for individuals without audit requirement',
    month: 7,
    day: 31,
    priority: 'HIGH',
  },
  {
    title: 'Advance Tax - Q1 (15%)',
    description: 'Pay 15% of estimated tax liability for the year',
    month: 6,
    day: 15,
    priority: 'HIGH',
  },
  {
    title: 'Advance Tax - Q2 (45%)',
    description: 'Pay 45% of estimated tax liability (cumulative)',
    month: 9,
    day: 15,
    priority: 'HIGH',
  },
  {
    title: 'Advance Tax - Q3 (75%)',
    description: 'Pay 75% of estimated tax liability (cumulative)',
    month: 12,
    day: 15,
    priority: 'HIGH',
  },
  {
    title: 'Advance Tax - Q4 (100%)',
    description: 'Pay remaining advance tax for the year',
    month: 3,
    day: 15,
    priority: 'HIGH',
  },
  {
    title: 'Collect Form 16 from Employer',
    description: 'Collect Form 16 (TDS certificate) from your employer',
    month: 6,
    day: 15,
    priority: 'MEDIUM',
  },
  {
    title: 'Review Tax-Saving Investments',
    description: 'Review and plan 80C, 80D investments before year-end',
    month: 1,
    day: 31,
    priority: 'MEDIUM',
  },
  {
    title: 'Complete Tax-Saving Investments',
    description: 'Last date to make tax-saving investments for the FY (80C, 80D, etc.)',
    month: 3,
    day: 31,
    priority: 'HIGH',
  },
  {
    title: 'Check Form 26AS',
    description: 'Verify TDS credits in Form 26AS before filing ITR',
    month: 7,
    day: 1,
    priority: 'MEDIUM',
  },
  {
    title: 'Download AIS (Annual Information Statement)',
    description: 'Review Annual Information Statement for any discrepancies',
    month: 7,
    day: 1,
    priority: 'MEDIUM',
  },
];

/**
 * Get current financial year
 * Indian FY runs April 1 to March 31
 * Returns format: "2024-25"
 */
export function getCurrentFinancialYear(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  
  // If before April, we're in the previous FY
  if (month < 4) {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
  return `${year}-${String(year + 1).slice(-2)}`;
}

/**
 * Get the assessment year for a financial year
 * AY is the year after FY ends
 */
export function getAssessmentYear(fy: string): string {
  const startYear = parseInt(fy.split('-')[0]);
  return `${startYear + 1}-${String(startYear + 2).slice(-2)}`;
}

/**
 * Generate due date for a deadline in the given financial year
 */
function getDueDate(deadline: TaxDeadline, financialYear: string): Date {
  const startYear = parseInt(financialYear.split('-')[0]);
  
  // For months April-December (4-12), use the start year
  // For months January-March (1-3), use the next year
  let year: number;
  if (deadline.month >= 4) {
    year = startYear;
  } else {
    year = startYear + 1;
  }
  
  // Special case: ITR filing is in July of the NEXT year (assessment year)
  if (deadline.title.includes('Income Tax Return')) {
    year = startYear + 1;
  }
  
  return new Date(year, deadline.month - 1, deadline.day);
}

/**
 * Generate task data for a financial year
 */
export function generateTaxDeadlineTasks(
  firmId: number,
  userId: number,
  financialYear: string
): Array<{
  title: string;
  description: string;
  firmId: number;
  assignedToId: number;
  createdById: number;
  status: string;
  priority: string;
  dueDate: Date;
}> {
  const tasks = TAX_DEADLINES.map((deadline) => ({
    title: `${deadline.title} (FY ${financialYear})`,
    description: deadline.description,
    firmId,
    assignedToId: userId,
    createdById: userId,
    status: 'PENDING',
    priority: deadline.priority,
    dueDate: getDueDate(deadline, financialYear),
  }));
  
  // Filter out tasks with due dates in the past
  const now = new Date();
  return tasks.filter((task) => task.dueDate > now);
}

/**
 * Get next financial year
 */
export function getNextFinancialYear(currentFY: string): string {
  const startYear = parseInt(currentFY.split('-')[0]);
  return `${startYear + 1}-${String(startYear + 2).slice(-2)}`;
}




