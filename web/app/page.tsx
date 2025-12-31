'use client';

import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { 
  ArrowRight, 
  CheckCircle, 
  Users, 
  FileText, 
  Calculator, 
  Shield, 
  Clock, 
  Building2,
  ChevronRight,
  Star,
  Zap,
  Lock,
  BarChart3,
  Receipt,
  CalendarCheck,
  UserCheck
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: Users,
      title: 'Client Management',
      description: 'Organize all your clients and their firms in one centralized dashboard with complete visibility.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: FileText,
      title: 'Document Repository',
      description: 'Securely store and manage all client documents with easy upload, download, and categorization.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: Calculator,
      title: 'Tax Regime Calculator',
      description: 'Instantly compare old vs new tax regime to help clients make informed decisions.',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: Shield,
      title: 'Portal Credentials',
      description: 'Securely store government portal credentials with AES-256 encryption.',
      color: 'from-amber-500 to-amber-600',
    },
    {
      icon: Clock,
      title: 'Task Tracking',
      description: 'Create, assign, and track tasks with due dates, priorities, and approval workflows.',
      color: 'from-rose-500 to-rose-600',
    },
    {
      icon: Receipt,
      title: 'Invoice Management',
      description: 'Generate and track invoices with GST calculations and payment status monitoring.',
      color: 'from-cyan-500 to-cyan-600',
    },
  ];

  const stats = [
    { value: '500+', label: 'CA Firms Trust Us' },
    { value: '10,000+', label: 'Clients Managed' },
    { value: '99.9%', label: 'Uptime Guarantee' },
    { value: '24/7', label: 'Support Available' },
  ];

  const testimonials = [
    {
      quote: "CA Firm Pro has transformed how we manage our practice. The task tracking and approval workflow saves us hours every week.",
      author: "CA Rajesh Kumar",
      role: "Partner, Kumar & Associates",
      avatar: "RK",
    },
    {
      quote: "The credential manager alone is worth it. No more spreadsheets for storing portal passwords. Everything is secure and organized.",
      author: "CA Priya Sharma",
      role: "Proprietor, Sharma Tax Consultants",
      avatar: "PS",
    },
    {
      quote: "Finally, a solution built specifically for Indian CAs. The GST and Income Tax compliance features are exactly what we needed.",
      author: "CA Vikram Patel",
      role: "Managing Partner, VP & Co.",
      avatar: "VP",
    },
  ];

  const workflowSteps = [
    { icon: UserCheck, title: 'Sign Up', description: 'Create your CA account in under 2 minutes' },
    { icon: Users, title: 'Add Clients', description: 'Import or manually add your client base' },
    { icon: Building2, title: 'Setup Firms', description: 'Organize firms under each client with PAN/GST details' },
    { icon: CalendarCheck, title: 'Start Managing', description: 'Track tasks, store documents, and manage compliance' },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-primary-50"></div>
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-20 right-20 w-96 h-96 bg-primary-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-amber-200 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Built for Indian Chartered Accountants
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Manage Your CA Practice{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-700">
                  Effortlessly
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-lg">
                The all-in-one platform to manage clients, firms, tasks, documents, 
                and compliance. Built specifically for the needs of Indian CA practices.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl shadow-primary-500/25"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  View Features
                </Link>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex -space-x-3">
                  {['RK', 'PS', 'VP', 'AK'].map((initials, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-sm text-slate-600">Trusted by 500+ CA Firms</p>
                </div>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl transform rotate-3 scale-105 opacity-10"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                {/* Mock Dashboard Header */}
                <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-slate-400 text-sm">CA Firm Pro Dashboard</span>
                  </div>
                </div>
                {/* Mock Dashboard Content */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-blue-700">24</div>
                      <div className="text-xs text-blue-600">Active Tasks</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-emerald-700">156</div>
                      <div className="text-xs text-emerald-600">Clients</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-amber-700">₹12L</div>
                      <div className="text-xs text-amber-600">Revenue</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {['GST Return - ABC Traders', 'ITR Filing - XYZ Corp', 'Audit - PQR Ltd'].map((task, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                        <span className="text-sm text-slate-700 flex-1">{task}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {i === 0 ? 'Due Today' : i === 1 ? 'In Progress' : 'Completed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <BarChart3 className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Run Your Practice
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From client management to compliance tracking, we've got all the tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              View All Features
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Simple setup process to get your practice up and running quickly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflowSteps.map((step, index) => (
              <div key={index} className="relative text-center">
                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-slate-200"></div>
                )}
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 border border-slate-200">
                    <step.icon className="w-9 h-9 text-primary-600" />
                  </div>
                  <div className="text-sm font-bold text-primary-600 mb-2">Step {index + 1}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Trusted by CAs Across India
            </h2>
            <p className="text-lg text-slate-600">
              See what our users have to say about CA Firm Pro.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="p-8 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-700 leading-relaxed mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-amber-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Join hundreds of CA firms already using CA Firm Pro to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all shadow-xl"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              Schedule a Demo
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            <Lock className="w-4 h-4 inline mr-1" />
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
