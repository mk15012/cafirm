'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Building2, Menu, X, ArrowRight } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-slate-900">CA Firm</span>
                <span className="text-xl font-bold text-amber-600 ml-1">Pro</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-500/25 flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    pathname === link.href
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <Link
                  href="/auth/login"
                  className="block w-full px-4 py-3 text-center text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block w-full px-4 py-3 text-center text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-16 lg:pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold">CA Firm</span>
                  <span className="text-xl font-bold text-amber-400 ml-1">Pro</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                The complete practice management solution for Chartered Accountants in India.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Product</h3>
              <ul className="space-y-3">
                <li><Link href="/features" className="text-slate-300 hover:text-white transition-colors text-sm">Features</Link></li>
                <li><Link href="/about" className="text-slate-300 hover:text-white transition-colors text-sm">About Us</Link></li>
                <li><Link href="/contact" className="text-slate-300 hover:text-white transition-colors text-sm">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-slate-300 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
                <li><Link href="#" className="text-slate-300 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
                <li><Link href="#" className="text-slate-300 hover:text-white transition-colors text-sm">Security</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Contact</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>support@cafirmpro.com</li>
                <li>+91 98765 43210</li>
                <li>Mumbai, India</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © 2024 CA Firm Pro. All rights reserved.
            </p>
            <p className="text-sm text-slate-500">
              Made with ❤️ for Chartered Accountants
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

