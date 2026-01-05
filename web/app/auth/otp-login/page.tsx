'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Phone, ArrowRight, RefreshCw, Shield, Smartphone } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { initializeFirebase, setupRecaptcha, sendOTP, ConfirmationResult } from '@/lib/firebase';

export default function OTPLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const [step, setStep] = useState<'phone' | 'otp' | 'register'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [firebaseToken, setFirebaseToken] = useState('');
  
  // Registration fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'CA' | 'INDIVIDUAL'>('CA');

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Firebase
    initializeFirebase();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Setup reCAPTCHA
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      
      // Send OTP
      const confirmationResult = await sendOTP(formattedPhone, recaptchaVerifier);
      setConfirmation(confirmationResult);
      setStep('otp');
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
      toast.error(message);
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
    try {
      const credential = await confirmation.confirm(otpCode);
      const idToken = await credential.user.getIdToken();
      
      // Try to login with our backend
      try {
        const response = await api.post('/auth/phone/login', {
          firebaseToken: idToken,
        });

        // Success - user exists
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user, response.data.token);
        
        toast.success('Login successful!');
        router.push('/dashboard');
      } catch (apiError: any) {
        if (apiError.response?.status === 404 && apiError.response?.data?.needsRegistration) {
          // User needs to register
          setFirebaseToken(idToken);
          setStep('register');
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
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/phone/register', {
        firebaseToken,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user, response.data.token);
      
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-600/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CA Firm Pro</h1>
          <p className="text-slate-400">
            {step === 'phone' && 'Login with OTP'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'register' && 'Complete Registration'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/10">
          {/* Phone Input Step */}
          {step === 'phone' && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mobile Number
                </label>
                <div className="flex gap-3">
                  <div className="flex items-center justify-center px-4 bg-slate-700 rounded-xl text-white font-medium">
                    +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg tracking-wider"
                  />
                </div>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading || phoneNumber.length < 10}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Smartphone className="w-5 h-5" />
                    Send OTP
                  </>
                )}
              </button>

              <div className="mt-6 text-center">
                <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 text-sm">
                  Login with Email & Password instead
                </Link>
              </div>
            </>
          )}

          {/* OTP Input Step */}
          {step === 'otp' && (
            <>
              <p className="text-slate-300 text-center mb-6">
                Enter the 6-digit code sent to<br />
                <span className="text-white font-semibold">+91 {phoneNumber}</span>
              </p>

              <div className="flex justify-center gap-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="w-12 h-14 text-center text-2xl font-bold bg-slate-700 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length !== 6}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify OTP
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="mt-4 text-center">
                {countdown > 0 ? (
                  <p className="text-slate-400 text-sm">Resend OTP in {countdown}s</p>
                ) : (
                  <button
                    onClick={handleSendOTP}
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={() => setStep('phone')}
                className="w-full mt-4 text-slate-400 hover:text-white text-sm"
              >
                ← Change Phone Number
              </button>
            </>
          )}

          {/* Registration Step */}
          {step === 'register' && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Account Type *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('CA')}
                      className={`p-4 rounded-xl border-2 transition-colors ${
                        role === 'CA'
                          ? 'border-primary-500 bg-primary-500/20 text-white'
                          : 'border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-semibold mb-1">CA / Firm</div>
                      <div className="text-xs text-slate-400">For professionals</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('INDIVIDUAL')}
                      className={`p-4 rounded-xl border-2 transition-colors ${
                        role === 'INDIVIDUAL'
                          ? 'border-primary-500 bg-primary-500/20 text-white'
                          : 'border-slate-600 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="font-semibold mb-1">Individual</div>
                      <div className="text-xs text-slate-400">Personal use</div>
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={loading || !name.trim() || !email.trim()}
                className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          © 2024 CA Firm Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
}

