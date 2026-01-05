'use client';

import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { 
  ArrowRight,
  Target,
  Heart,
  Lightbulb,
  Users,
  Award,
  Globe,
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: 'Security First',
      description: 'Your data is protected with bank-grade encryption and secure infrastructure.',
    },
    {
      icon: Users,
      title: 'Customer Focused',
      description: 'Every feature is built based on real feedback from practicing CAs.',
    },
    {
      icon: Zap,
      title: 'Continuous Innovation',
      description: 'We constantly improve and add features to stay ahead of compliance changes.',
    },
    {
      icon: Heart,
      title: 'Made in India',
      description: 'Built specifically for Indian CAs with deep understanding of local requirements.',
    },
  ];

  const milestones = [
    { year: '2022', title: 'Founded', description: 'CA Firm Pro was born from the vision to simplify CA practice management.' },
    { year: '2023', title: 'Beta Launch', description: 'First version launched with 50 beta users providing valuable feedback.' },
    { year: '2023', title: '500+ Users', description: 'Crossed 500 CA firms milestone with expanding feature set.' },
    { year: '2024', title: 'Mobile App', description: 'Launched React Native mobile app for on-the-go access.' },
  ];

  const team = [
    { name: 'Founding Team', role: 'Leadership', description: 'A team of CA professionals and technology experts.' },
    { name: 'Development', role: 'Engineering', description: 'Skilled engineers building robust and scalable solutions.' },
    { name: 'Support', role: 'Customer Success', description: 'Dedicated team ensuring your success with our platform.' },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-amber-50"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-80 h-80 bg-amber-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-primary-200 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              Empowering CAs to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
                Focus on What Matters
              </span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              We believe that Chartered Accountants should spend their time on high-value advisory work, 
              not on managing spreadsheets and chasing documents. That's why we built CA Firm Pro.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-10 lg:p-12">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
              <p className="text-slate-700 leading-relaxed text-lg">
                To provide Chartered Accountants with the most intuitive and comprehensive practice 
                management solution, enabling them to serve their clients better while growing their practice.
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-10 lg:p-12">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h2>
              <p className="text-slate-700 leading-relaxed text-lg">
                To become the trusted technology partner for every CA firm in India, 
                helping them embrace digital transformation and deliver exceptional client service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">Our Story</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              CA Firm Pro was born from a simple observation: CA firms across India were struggling 
              with outdated tools and manual processes. Client data in spreadsheets, documents 
              scattered across folders, and compliance deadlines tracked on paper calendars.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">The Problem We Saw</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>CAs spending hours on administrative tasks instead of client advisory</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Client data scattered across multiple spreadsheets and folders</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Missed deadlines due to lack of proper tracking systems</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <span>Team coordination challenges in growing practices</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Our Solution</h3>
              <p className="text-slate-600 leading-relaxed">
                We built CA Firm Pro as an all-in-one platform that brings together client management, 
                task tracking, document storage, and compliance monitoring. Designed specifically for 
                Indian CAs, with features like GST tracking, ITR management, and secure credential storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Our Values</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              The principles that guide everything we do.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{value.title}</h3>
                <p className="text-slate-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-20 lg:py-28 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Our Journey</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Key milestones in our growth story.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{milestone.year}</span>
                    </div>
                    {index < milestones.length - 1 && (
                      <div className="w-0.5 h-16 bg-slate-700 mx-auto mt-4"></div>
                    )}
                  </div>
                  <div className="pt-3">
                    <h3 className="text-xl font-bold text-white mb-2">{milestone.title}</h3>
                    <p className="text-slate-400">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Our Team</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              A passionate team dedicated to your success.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center p-8 bg-slate-50 rounded-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h3>
                <p className="text-primary-600 font-medium text-sm mb-3">{member.role}</p>
                <p className="text-slate-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-amber-500 to-amber-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Join Our Growing Community
          </h2>
          <p className="text-lg text-amber-100 mb-10">
            Be part of the CA Firm Pro family and transform your practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-amber-600 font-bold rounded-xl hover:bg-amber-50 transition-all shadow-xl"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-600 text-white font-semibold rounded-xl border border-amber-400 hover:bg-amber-700 transition-all"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

