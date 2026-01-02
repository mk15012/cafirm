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
  UserCheck,
  Smartphone,
  Download,
  User,
  Wallet,
  Key,
  Heart
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

      {/* Mobile App Download Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 lg:p-16 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 right-10 w-64 h-64 bg-primary-500 rounded-full blur-3xl"></div>
              <div className="absolute bottom-10 left-10 w-48 h-48 bg-amber-500 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Smartphone className="w-4 h-4" />
                  Mobile App Available
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Manage Your Practice On-The-Go
                </h2>
                <p className="text-lg text-slate-300 mb-8">
                  Download our mobile app to access your dashboard, track tasks, 
                  and manage clients from anywhere. Available for both iOS and Android.
                </p>
                
                {/* Download Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Android Button */}
                  <a
                    href="https://expo.dev/artifacts/eas/wZqrdz71NvF75U9Lkxpsy9.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-4 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-all shadow-lg group"
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4486.9993.9993.0007.5511-.4482.9997-.9993.9997zm-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4486.9993.9993 0 .5511-.4486.9997-.9993.9997zm11.4042-6.4958l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 7.2507 13.8524 6.5 11.9998 6.5s-3.5765.7404-5.1367 1.8722L4.841 4.8687a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 10.8426.8779 14.4014.8779 18.5h22.2442c0-4.0986-1.811-7.6574-5.2449-9.6544z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-slate-500">Download for</div>
                      <div className="text-lg font-bold">Android</div>
                    </div>
                    <Download className="w-5 h-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                  </a>
                  
                  {/* iOS Button */}
                  <a
                    href="https://expo.dev/artifacts/eas/wZqrdz71NvF75U9Lkxpsy9.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all group"
                  >
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs text-slate-400">Download for</div>
                      <div className="text-lg font-bold">iOS</div>
                    </div>
                    <Download className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  </a>
                </div>
                
                <p className="mt-6 text-sm text-slate-400">
                  * iOS version coming soon. Currently using TestFlight.
                </p>
              </div>
              
              {/* Right Content - Phone Mockup */}
              <div className="hidden lg:flex justify-center">
                <div className="relative">
                  {/* Phone Frame */}
                  <div className="w-64 h-[520px] bg-slate-800 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-700">
                    <div className="w-full h-full bg-slate-900 rounded-[2.5rem] overflow-hidden relative">
                      {/* Phone Screen Content */}
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 p-4">
                        {/* Status Bar */}
                        <div className="flex justify-between items-center text-white text-xs mb-4">
                          <span>9:41</span>
                          <div className="flex gap-1">
                            <div className="w-4 h-2 bg-white rounded-sm"></div>
                          </div>
                        </div>
                        {/* App Header */}
                        <div className="bg-slate-800 rounded-xl p-4 mb-4">
                          <div className="text-amber-400 text-lg font-bold mb-1">CA Firm Pro</div>
                          <div className="text-slate-400 text-xs">Good Morning, User!</div>
                        </div>
                        {/* Metrics */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-blue-900/50 rounded-lg p-3">
                            <div className="text-blue-400 text-xl font-bold">12</div>
                            <div className="text-slate-400 text-xs">Tasks</div>
                          </div>
                          <div className="bg-emerald-900/50 rounded-lg p-3">
                            <div className="text-emerald-400 text-xl font-bold">45</div>
                            <div className="text-slate-400 text-xs">Clients</div>
                          </div>
                          <div className="bg-amber-900/50 rounded-lg p-3">
                            <div className="text-amber-400 text-xl font-bold">₹2.5L</div>
                            <div className="text-slate-400 text-xs">Revenue</div>
                          </div>
                          <div className="bg-purple-900/50 rounded-lg p-3">
                            <div className="text-purple-400 text-xl font-bold">8</div>
                            <div className="text-slate-400 text-xs">Pending</div>
                          </div>
                        </div>
                        {/* Quick Access */}
                        <div className="text-slate-400 text-xs mb-2">Quick Access</div>
                        <div className="grid grid-cols-4 gap-2">
                          {['👥', '📋', '📄', '💰'].map((emoji, i) => (
                            <div key={i} className="bg-slate-800 rounded-lg p-3 flex items-center justify-center text-xl">
                              {emoji}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full blur-2xl opacity-50"></div>
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full blur-2xl opacity-50"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-32 bg-slate-50">
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

      {/* For Individuals Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-teal-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 font-medium text-sm mb-6">
                <User className="w-4 h-4" />
                Also For Individuals
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                Manage Your Own Taxes?
                <span className="block text-emerald-600">This App is For You Too!</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Not a CA? No problem! If you file your own ITR, manage multiple PANs for family members, 
                or just want a secure place to store government portal credentials — CA Firm Pro works 
                perfectly for you too. <strong className="text-emerald-700">And it&apos;s completely FREE!</strong>
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Key className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Secure Password Storage</h4>
                    <p className="text-slate-600 text-sm">Store Income Tax, GST, PF, TAN and other portal credentials safely with AES-256 encryption</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Manage Family Members</h4>
                    <p className="text-slate-600 text-sm">Track ITR filings for parents, spouse, and kids — all in one place</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Calculator className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Tax Regime Calculator</h4>
                    <p className="text-slate-600 text-sm">Compare old vs new tax regime instantly to maximize your savings</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Document Storage</h4>
                    <p className="text-slate-600 text-sm">Keep all your Form 16, ITR acknowledgments, and tax documents organized</p>
                  </div>
                </div>
              </div>
              
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="mt-3 text-sm text-slate-500">
                <Heart className="w-4 h-4 inline mr-1 text-red-400" />
                Free forever for personal use
              </p>
            </div>
            
            {/* Right Visual */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mb-4">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Personal Dashboard</h3>
                  <p className="text-slate-500 text-sm">Everything you need, simplified</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">My Tax Filings</div>
                      <div className="text-xs text-slate-500">Track ITR status for all family members</div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Key className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">Saved Credentials</div>
                      <div className="text-xs text-slate-500">12 portal passwords stored securely</div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">Documents</div>
                      <div className="text-xs text-slate-500">Form 16, ITR Acks, PAN cards</div>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-emerald-900">Tax Calculator</div>
                      <div className="text-xs text-emerald-600">Save ₹24,000 with new regime!</div>
                    </div>
                    <Zap className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <Star className="w-4 h-4 text-amber-400" />
                    100% Free for Personal Use
                  </span>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl opacity-20 blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full opacity-20 blur-xl"></div>
            </div>
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
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Whether you&apos;re a CA firm or an individual managing personal taxes — we&apos;ve got you covered.
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
