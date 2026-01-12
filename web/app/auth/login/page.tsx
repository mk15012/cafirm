'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { Building2, Shield, FileText, Calculator, Users, CheckCircle, Lock, Mail, Smartphone, ArrowRight, RefreshCw, KeyRound, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { initializeFirebase, setupRecaptcha, sendOTP, ConfirmationResult } from '@/lib/firebase';

type LoginMethod = 'email' | 'otp';
type OtpStep = 'phone' | 'verify' | 'register';
type ForgotPasswordStep = 'email' | 'code' | 'success';

export default function LoginPage() {
  const router = useRouter();
  const { login, setUser } = useAuthStore();
  
  // Login method toggle
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  
  // Email login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP login state
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [firebaseToken, setFirebaseToken] = useState('');
  
  // Registration fields (for new OTP users)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'CA' | 'INDIVIDUAL'>('CA');
  
  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<ForgotPasswordStep>('email');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Common state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    initializeFirebase();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Email login handler
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!', { icon: '👋' });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handlers
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data.resetCode) {
        toast.success(`Reset code: ${response.data.resetCode}`, { duration: 10000 });
      } else {
        toast.success('Reset code sent to your email!');
      }
      setForgotPasswordStep('code');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { email, resetCode, newPassword });
      toast.success('Password reset successfully!');
      setForgotPasswordStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const resetForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep('email');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  // OTP handlers
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    // Always add +91 since user enters 10-digit number only
    return `+91${cleaned}`;
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      const confirmationResult = await sendOTP(formattedPhone, recaptchaVerifier);
      setConfirmation(confirmationResult);
      setOtpStep('verify');
      setCountdown(60);
      toast.success(`OTP sent to ${formattedPhone}`);
    } catch (error: any) {
      console.error('OTP send error:', error);
      let message = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/invalid-phone-number') {
        message = 'Invalid phone number format';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    if (!confirmation) {
      toast.error('Please request OTP first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const credential = await confirmation.confirm(otpCode);
      const idToken = await credential.user.getIdToken();
      
      try {
        const response = await api.post('/auth/phone/login', { firebaseToken: idToken });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user, response.data.token);
        toast.success('Login successful!');
        router.push('/dashboard');
      } catch (apiError: any) {
        if (apiError.response?.status === 404 && apiError.response?.data?.needsRegistration) {
          setFirebaseToken(idToken);
          setOtpStep('register');
        } else {
          throw apiError;
        }
      }
    } catch (error: any) {
      console.error('OTP verify error:', error);
      let message = 'Invalid OTP. Please try again.';
      if (error.code === 'auth/invalid-verification-code') {
        message = 'Invalid OTP code. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        message = 'OTP has expired. Please request a new one.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/phone/register', {
        firebaseToken,
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        role: regRole,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user, response.data.token);
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const resetOtpFlow = () => {
    setOtpStep('phone');
    setOtp(['', '', '', '', '', '']);
    setConfirmation(null);
    setFirebaseToken('');
    setRegName('');
    setRegEmail('');
  };

  const features = [
    { icon: Users, text: 'Client & Firm Management' },
    { icon: FileText, text: 'Document Repository' },
    { icon: Calculator, text: 'Tax Regime Calculator' },
    { icon: Shield, text: 'Secure Credential Storage' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container"></div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20">
                <Building2 className="w-9 h-9 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">CA Firm Pro</h1>
                <p className="text-amber-400 font-semibold text-lg">Management System</p>
              </div>
            </div>
            <div className="w-20 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>

          <div className="mb-12">
            <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
              Streamline Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-500">
                Practice Management
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md leading-relaxed">
              The complete solution for Chartered Accountants to manage clients, 
              firms, tasks, documents, and compliance with ease.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-lg">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400/20 to-amber-600/20 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-amber-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-400">Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-400">ICAI Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-400">GST Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-end px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">Home</Link>
            <Link href="/features" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">Features</Link>
            <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">Pricing</Link>
            <Link href="/auth/signup" className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm">Sign Up</Link>
          </nav>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">CA Firm Pro</h1>
                <p className="text-amber-600 font-semibold text-sm">Management System</p>
              </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-200">
              {/* Forgot Password Flow */}
              {showForgotPassword ? (
                <>
                  {forgotPasswordStep === 'email' && (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <KeyRound className="w-8 h-8 text-primary-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Forgot Password?</h2>
                        <p className="text-slate-500">Enter your email to receive a reset code</p>
                      </div>

                      {error && (
                        <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
                          {error}
                        </div>
                      )}

                      <form onSubmit={handleForgotPasswordRequest} className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              placeholder="you@example.com"
                              className="block w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              Sending...
                            </span>
                          ) : 'Send Reset Code'}
                        </button>
                      </form>

                      <div className="mt-6 text-center">
                        <button onClick={resetForgotPassword} className="text-primary-600 hover:text-primary-700 font-medium">
                          ← Back to Login
                        </button>
                      </div>
                    </>
                  )}

                  {forgotPasswordStep === 'code' && (
                    <>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <KeyRound className="w-8 h-8 text-primary-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>
                        <p className="text-slate-500">Enter the code sent to <span className="font-medium text-slate-700">{email}</span></p>
                      </div>

                      {error && (
                        <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">
                          {error}
                        </div>
                      )}

                      <form onSubmit={handleResetPassword} className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Reset Code</label>
                          <input
                            type="text"
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                            required
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl tracking-widest font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Enter new password"
                            minLength={6}
                            className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm new password"
                            minLength={6}
                            className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25"
                        >
                          {loading ? (
                            <span className="flex items-center justify-center gap-2">
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              Resetting...
                            </span>
                          ) : 'Reset Password'}
                        </button>
                      </form>

                      <div className="mt-6 text-center">
                        <button onClick={() => setForgotPasswordStep('email')} className="text-slate-500 hover:text-slate-700 font-medium">
                          ← Use different email
                        </button>
                      </div>
                    </>
                  )}

                  {forgotPasswordStep === 'success' && (
                    <div className="text-center py-6">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h2>
                      <p className="text-slate-500 mb-8">Your password has been successfully reset. You can now login with your new password.</p>
                      <button
                        onClick={resetForgotPassword}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg shadow-primary-500/25"
                      >
                        Go to Login
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                    <p className="text-slate-500">Sign in to access your dashboard</p>
                  </div>

                  {/* Login Method Toggle */}
                  <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('email'); setError(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        loginMethod === 'email' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('otp'); setError(''); resetOtpFlow(); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        loginMethod === 'otp' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      OTP
                    </button>
                  </div>

                  {error && (
                    <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-red-600">!</span>
                      </div>
                      {error}
                    </div>
                  )}

                  {/* Email Login Form */}
                  {loginMethod === 'email' && (
                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="block w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="block w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl shadow-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Signing in...
                      </span>
                    ) : 'Sign In'}
                  </button>

                  <div className="text-center mt-4">
                    <button 
                      type="button"
                      onClick={() => { setShowForgotPassword(true); setError(''); }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              )}

              {/* OTP Login Form */}
              {loginMethod === 'otp' && (
                <div className="space-y-5">
                  {/* Phone Input Step */}
                  {otpStep === 'phone' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Number</label>
                        <div className="flex gap-2">
                          <div className="flex items-center justify-center px-4 bg-slate-100 rounded-xl text-slate-700 font-medium border border-slate-300">
                            +91
                          </div>
                          <input
                            type="tel"
                            maxLength={10}
                            placeholder="Enter 10-digit number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg tracking-wider"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={loading || phoneNumber.length < 10}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25"
                      >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Smartphone className="w-5 h-5" /> Send OTP</>}
                      </button>
                    </>
                  )}

                  {/* OTP Verify Step */}
                  {otpStep === 'verify' && (
                    <>
                      <p className="text-center text-slate-600 mb-4">
                        Enter the 6-digit code sent to<br />
                        <span className="font-semibold text-slate-900">+91 {phoneNumber}</span>
                      </p>
                      <div className="flex justify-center gap-2 mb-4">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => { otpInputs.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(e.target.value, index)}
                            onKeyDown={(e) => handleOtpKeyDown(e, index)}
                            className="w-12 h-14 text-center text-2xl font-bold border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={loading || otp.join('').length !== 6}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25"
                      >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Verify OTP <ArrowRight className="w-5 h-5" /></>}
                      </button>
                      <div className="text-center mt-3">
                        {countdown > 0 ? (
                          <p className="text-slate-500 text-sm">Resend OTP in {countdown}s</p>
                        ) : (
                          <button type="button" onClick={handleSendOTP} className="text-primary-600 hover:text-primary-700 text-sm font-medium">Resend OTP</button>
                        )}
                      </div>
                      <button type="button" onClick={resetOtpFlow} className="w-full text-slate-500 hover:text-slate-700 text-sm mt-2">← Change Phone Number</button>
                    </>
                  )}

                  {/* Registration Step */}
                  {otpStep === 'register' && (
                    <>
                      <p className="text-center text-slate-600 mb-4">Complete your registration</p>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address *</label>
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Account Type *</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setRegRole('CA')}
                            className={`p-3 rounded-xl border-2 transition-colors text-left ${regRole === 'CA' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                          >
                            <div className="font-semibold text-sm">CA / Firm</div>
                            <div className="text-xs text-slate-500">For professionals</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegRole('INDIVIDUAL')}
                            className={`p-3 rounded-xl border-2 transition-colors text-left ${regRole === 'INDIVIDUAL' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                          >
                            <div className="font-semibold text-sm">Individual</div>
                            <div className="text-xs text-slate-500">Personal use</div>
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRegister}
                        disabled={loading || !regName.trim() || !regEmail.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-500/25"
                      >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-5 h-5" /></>}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-center text-slate-600">
                  New to the platform?{' '}
                  <Link href="/auth/signup" className="text-primary-600 hover:text-primary-700 font-semibold">Create an account</Link>
                </p>
              </div>
                </>
              )}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">© 2024 CA Firm Pro. All rights reserved.</p>
              <p className="text-xs text-slate-400 mt-1">Trusted by Chartered Accountants across India</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
