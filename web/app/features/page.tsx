'use client';

import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { 
  ArrowRight,
  Users,
  Building2,
  FileText,
  CheckSquare,
  Receipt,
  Calculator,
  Shield,
  Clock,
  Bell,
  BarChart3,
  Lock,
  Smartphone,
  Cloud,
  UserCheck,
  FolderOpen,
  Search,
  Filter,
  Activity,
  Calendar
} from 'lucide-react';

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: Users,
      title: 'Client Management',
      description: 'Centralized client database with complete contact information, notes, and relationship tracking.',
      details: [
        'Store client details with contact person, email, phone, address',
        'Track multiple firms under each client',
        'Add notes and important information',
        'Quick search and filter capabilities',
      ],
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Building2,
      title: 'Firm Management',
      description: 'Organize and manage all client firms with PAN, GST, and registration details.',
      details: [
        'Store PAN Number, GST Number, Registration Number',
        'Track firm status (Active/Inactive)',
        'Link firms to parent clients',
        'View all tasks, documents, and invoices per firm',
      ],
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: CheckSquare,
      title: 'Task & Workflow Management',
      description: 'Create, assign, and track tasks with built-in approval workflows.',
      details: [
        'Assign tasks to team members with due dates',
        'Priority levels (High, Medium, Low)',
        'Status tracking (Pending → In Progress → Awaiting Approval → Completed)',
        'Role-based approval workflow (Staff → Manager → CA)',
      ],
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: FileText,
      title: 'Document Repository',
      description: 'Secure document storage with categorization and easy access.',
      details: [
        'Upload documents linked to firms and tasks',
        'Categorize by type (ITR, GST, Audit, etc.)',
        'Download and share documents easily',
        'Track upload history and file versions',
      ],
      color: 'from-amber-500 to-amber-600',
    },
    {
      icon: Receipt,
      title: 'Invoice Management',
      description: 'Generate, track, and manage invoices with GST calculations.',
      details: [
        'Create invoices for each firm',
        'Automatic GST calculation',
        'Track payment status (Paid, Unpaid, Overdue)',
        'Generate invoice reports',
      ],
      color: 'from-rose-500 to-rose-600',
    },
    {
      icon: Calculator,
      title: 'Tax Regime Calculator',
      description: 'Instantly compare old vs new tax regime for quick client decisions.',
      details: [
        'Input income and deduction details',
        'Calculate tax under both regimes',
        'Visual comparison with savings indicator',
        'Support for all major deductions (80C, 80D, HRA, etc.)',
      ],
      color: 'from-cyan-500 to-cyan-600',
    },
  ];

  const additionalFeatures = [
    {
      icon: Shield,
      title: 'Portal Credentials Manager',
      description: 'Securely store government portal credentials with AES-256 encryption. Never lose login details again.',
    },
    {
      icon: UserCheck,
      title: 'Role-Based Access',
      description: 'Three-tier access control (CA, Manager, Staff) with appropriate permissions for each role.',
    },
    {
      icon: Activity,
      title: 'Activity Logs',
      description: 'Complete audit trail of all actions performed in the system for compliance and review.',
    },
    {
      icon: Calendar,
      title: 'Meeting Scheduler',
      description: 'Schedule and track client meetings with notes, attendees, and follow-up actions.',
    },
    {
      icon: Bell,
      title: 'Notifications & Alerts',
      description: 'Get notified about due dates, pending approvals, and important updates.',
    },
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Quickly find clients, firms, tasks, or documents with powerful search functionality.',
    },
    {
      icon: Filter,
      title: 'Smart Filters',
      description: 'Filter data by status, date, priority, assignee, and more for quick insights.',
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analytics',
      description: 'Visual dashboard with key metrics, pending tasks, and revenue overview.',
    },
    {
      icon: Smartphone,
      title: 'Mobile App',
      description: 'Access your practice on-the-go with our React Native mobile application.',
    },
    {
      icon: Cloud,
      title: 'Cloud-Based',
      description: 'Access from anywhere, anytime. Your data is always synced and available.',
    },
    {
      icon: Lock,
      title: 'Secure & Encrypted',
      description: 'Bank-grade security with encrypted data storage and secure authentication.',
    },
    {
      icon: FolderOpen,
      title: 'Organized Structure',
      description: 'Hierarchical organization: CA → Clients → Firms → Tasks/Documents/Invoices.',
    },
  ];

  const complianceFeatures = [
    { title: 'Income Tax Returns', description: 'Track ITR filings for all assessment years' },
    { title: 'GST Compliance', description: 'Monitor GST returns (GSTR-1, 3B, 9, 9C)' },
    { title: 'TDS Returns', description: 'Manage quarterly TDS filings' },
    { title: 'Company Filings', description: 'Track MCA and ROC compliances' },
    { title: 'Audit Management', description: 'Plan and execute statutory audits' },
    { title: 'Due Date Tracking', description: 'Never miss a compliance deadline' },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-primary-50"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-80 h-80 bg-primary-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-60 h-60 bg-amber-200 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Powerful Features for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-700">
              Modern CA Practices
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-10">
            Everything you need to manage clients, track compliance, and grow your practice. 
            Built specifically for Indian Chartered Accountants.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl shadow-primary-500/25"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Core Features
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Comprehensive tools designed to handle every aspect of your CA practice.
            </p>
          </div>

          <div className="space-y-16">
            {mainFeatures.map((feature, index) => (
              <div 
                key={index}
                className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                  <p className="text-lg text-slate-600 mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-slate-700">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl p-6 lg:p-8 ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  {/* Feature-specific mock UI */}
                  {feature.title === 'Client Management' && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-xs text-slate-400">Clients</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {['Bajrang Enterprises', 'Sharma & Associates', 'Tech Solutions Pvt Ltd'].map((name, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${['bg-blue-500', 'bg-purple-500', 'bg-emerald-500'][i]}`}>
                              {name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 text-sm">{name}</p>
                              <p className="text-xs text-slate-500">{[2, 3, 1][i]} firms</p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">Active</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {feature.title === 'Firm Management' && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-xs text-slate-400">Firm Details</span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">Bajrang Trading Co.</h4>
                            <p className="text-sm text-slate-500">Proprietorship Firm</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-slate-500 text-xs mb-1">PAN Number</p>
                            <p className="font-mono font-medium text-slate-900">ABCDE1234F</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-slate-500 text-xs mb-1">GST Number</p>
                            <p className="font-mono font-medium text-slate-900">27ABCDE1234F1Z5</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-slate-500 text-xs mb-1">Tasks</p>
                            <p className="font-medium text-slate-900">12 Active</p>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-slate-500 text-xs mb-1">Status</p>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {feature.title === 'Task & Workflow Management' && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-xs text-slate-400">Tasks</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {[
                          { title: 'File ITR for AY 2024-25', status: 'In Progress', statusColor: 'bg-blue-100 text-blue-700', priority: 'High', priorityColor: 'bg-red-100 text-red-700' },
                          { title: 'GST Return - March 2024', status: 'Awaiting Approval', statusColor: 'bg-amber-100 text-amber-700', priority: 'Medium', priorityColor: 'bg-yellow-100 text-yellow-700' },
                          { title: 'TDS Filing Q4', status: 'Completed', statusColor: 'bg-emerald-100 text-emerald-700', priority: 'Low', priorityColor: 'bg-slate-100 text-slate-700' },
                        ].map((task, i) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.priorityColor}`}>{task.priority}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.statusColor}`}>{task.status}</span>
                              <span className="text-xs text-slate-400">Due: {['Mar 15', 'Mar 20', 'Mar 10'][i]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {feature.title === 'Document Repository' && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-xs text-slate-400">Documents</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {[
                          { name: 'ITR_2024_Bajrang.pdf', type: 'ITR', size: '2.4 MB', color: 'bg-red-100 text-red-600' },
                          { name: 'GSTR1_March_2024.xlsx', type: 'GST', size: '856 KB', color: 'bg-blue-100 text-blue-600' },
                          { name: 'Audit_Report_FY24.pdf', type: 'AUDIT', size: '5.1 MB', color: 'bg-amber-100 text-amber-600' },
                          { name: 'Form26AS_2024.pdf', type: 'TDS', size: '1.2 MB', color: 'bg-purple-100 text-purple-600' },
                        ].map((doc, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.color}`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 text-sm truncate">{doc.name}</p>
                              <p className="text-xs text-slate-500">{doc.size}</p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded-full font-medium">{doc.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {feature.title === 'Invoice Management' && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-xs text-slate-400">Invoice #INV-2024-0042</span>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm text-slate-500">Invoice to</p>
                            <p className="font-bold text-slate-900">Bajrang Trading Co.</p>
                          </div>
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">Paid</span>
                        </div>
                        <div className="border-t border-b border-slate-100 py-3 mb-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">ITR Filing Service</span>
                            <span className="font-medium">₹5,000</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">GST Return (12 months)</span>
                            <span className="font-medium">₹12,000</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-600">GST (18%)</span>
                            <span className="font-medium">₹3,060</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900">Total</span>
                          <span className="text-xl font-bold text-primary-600">₹20,060</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {feature.title === 'Tax Regime Calculator' && (
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                      <div className="bg-slate-900 px-4 py-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-xs text-slate-400">Tax Calculator</span>
                      </div>
                      <div className="p-4">
                        <div className="text-center mb-4">
                          <p className="text-sm text-slate-500 mb-1">Annual Income</p>
                          <p className="text-2xl font-bold text-slate-900">₹12,00,000</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 rounded-xl p-4 text-center">
                            <p className="text-xs text-slate-500 mb-1">Old Regime</p>
                            <p className="text-lg font-bold text-slate-900">₹1,17,000</p>
                            <p className="text-xs text-slate-400 mt-1">After 80C, 80D, HRA</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-4 text-center border-2 border-emerald-200">
                            <p className="text-xs text-emerald-600 mb-1">New Regime ✓</p>
                            <p className="text-lg font-bold text-emerald-700">₹93,600</p>
                            <p className="text-xs text-emerald-500 mt-1">Saves ₹23,400</p>
                          </div>
                        </div>
                        <div className="mt-4 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg text-center text-sm font-medium">
                          💡 New Regime saves ₹23,400 for this client
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Features */}
      <section className="py-20 lg:py-28 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Built for Indian Compliance
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Track all statutory compliances and never miss a deadline.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceFeatures.map((item, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              And Much More...
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Discover all the features that make CA Firm Pro the complete solution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div 
                key={index}
                className="p-6 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Experience These Features?
          </h2>
          <p className="text-lg text-primary-100 mb-10">
            Start your free trial today and see how CA Firm Pro can transform your practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-all shadow-xl"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-700 text-white font-semibold rounded-xl border border-primary-500 hover:bg-primary-800 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

