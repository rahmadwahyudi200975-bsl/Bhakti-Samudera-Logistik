/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Clock, 
  Lock, 
  HelpCircle,
  Lightbulb,
  CornerDownRight,
  X,
  Mail,
  MessageSquare,
  Send,
  Copy,
  Check,
  Anchor,
  Ship,
  Sparkles,
  ChevronRight,
  Activity
} from 'lucide-react';
import CompanyLogo from './CompanyLogo';

export default function LoginView() {
  const { login, resetPassword, registeredUsers } = useApp();
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('bsl_remember_me') === 'true';
    } catch {
      return false;
    }
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('bsl_remembered_role');
      if (saved) {
        return saved as UserRole;
      }
    } catch {}
    return 'Director';
  });

  const [email, setEmail] = useState(() => {
    try {
      const savedEmail = localStorage.getItem('bsl_remembered_email');
      if (savedEmail) {
        return savedEmail;
      }
    } catch {}
    return 'director@bsl.co.id';
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<{ type: 'email' | 'password' | 'general'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [showAutofillSuccess, setShowAutofillSuccess] = useState<string | null>(null);

  // Recovery variables
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetRole, setResetRole] = useState<UserRole>('Staff');
  const [resetTarget, setResetTarget] = useState('staff.ops@bsl.co.id');
  const [resetSending, setResetSending] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2 | 3 | 4>(1); // 1: select email, 2: inbox preview, 3: change password, 4: success
  const [newSandi, setNewSandi] = useState('');
  const [confirmNewSandi, setConfirmNewSandi] = useState('');
  const [resetSandiSuccess, setResetSandiSuccess] = useState(false);
  const [otpSentCode, setOtpSentCode] = useState('842195');
  const [userInputOtp, setUserInputOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [newSandiValidationError, setNewSandiValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Fast verification duration (80ms) for extremely snappy, fluid feedback
    setTimeout(() => {
      setIsSubmitting(false);

      const trimmedEmail = email.trim();
      // 1. Check if email is empty or invalid format
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        setError({
          type: 'email',
          message: 'Invalid Email format! The email address must contain "@" (e.g., user@bsl.co.id).'
        });
        return;
      }

      // 2. Validate email is in the registered users roster
      const matchedUser = registeredUsers.find(u => u.email.toLowerCase() === trimmedEmail.toLowerCase());
      if (!matchedUser) {
        setError({
          type: 'email',
          message: `Email is not registered! Please ask a BSL administrator to register your account.`
        });
        return;
      }

      // 3. Make sure selected role matches the registered role
      if (matchedUser.role !== selectedRole) {
        setError({
          type: 'email',
          message: `Role mismatch! This account is registered with the role "${matchedUser.role}", not "${selectedRole}".`
        });
        return;
      }

      // 4. Verify password
      const success = login(trimmedEmail, password);
      if (!success) {
        setError({
          type: 'password',
          message: 'Incorrect password! The password you entered does not match the BSL credentials database.'
        });
      } else {
        // If login was successful and rememberMe is checked, save credentials
        try {
          if (rememberMe) {
            localStorage.setItem('bsl_remember_me', 'true');
            localStorage.setItem('bsl_remembered_role', selectedRole);
            localStorage.setItem('bsl_remembered_email', trimmedEmail);
          } else {
            localStorage.removeItem('bsl_remember_me');
            localStorage.removeItem('bsl_remembered_role');
            localStorage.removeItem('bsl_remembered_email');
          }
        } catch (err) {
          console.warn('LocalStorage error:', err);
        }
      }
    }, 80);
  };

  const handleAutofill = (role: UserRole, pass: string) => {
    setSelectedRole(role);
    setEmail(role === 'Director' ? 'director@bsl.co.id' : 'staff.ops@bsl.co.id');
    setPassword(pass);
    setError(null);
    setShowAutofillSuccess(role);
    setTimeout(() => {
      setShowAutofillSuccess(null);
    }, 2000);
  };

  return (
    <div id="login-container-root" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      
      {/* 1. LEFT SIDE PANEL: PREMIUM BRAND GRAPHIC & NARRATIVE (Visible on md+) */}
      <div className="hidden md:flex w-[42%] bg-slate-900 border-r border-slate-200 dark:border-slate-900 relative flex-col justify-between p-10 select-none overflow-hidden text-white">
        
        {/* Background Ambient Layers */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

        {/* Header Branding */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/10 border border-white/10 shadow-md overflow-hidden">
            <CompanyLogo className="h-8.5 w-8.5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-wider uppercase block text-white">
              Bhakti Samudera
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block font-mono -mt-0.5">
              Logistics
            </span>
          </div>
        </div>

        {/* Narrative Feature List */}
        <div className="relative z-10 my-auto pr-4 space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide">
              <Sparkles className="h-3 w-3 animate-spin" />
              Smart Management System
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-white">
              One Unified Portal <br />
              <span className="text-blue-450 bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">Customs & Cash Management</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              Monitor PIB status, release SPPB documents, calculate container demurrage, and analyze operational cash flows in real-time.
            </p>
          </div>

          <div className="space-y-4">
            {/* Unique Highlight Points */}
            <div className="flex items-start gap-3 bg-slate-800/40 border border-slate-800 p-3 rounded-2xl">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/10 mt-0.5">
                <ShieldCheck className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">High-Level Access Security (Local Storage)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">Client sessions are safely encrypted, protecting Director and Staff operational data within your local browser.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-800/40 border border-slate-800 p-3 rounded-2xl">
              <div className="h-8 w-8 shrink-0 rounded-lg bg-teal-600/10 flex items-center justify-center border border-teal-500/10 mt-0.5">
                <Activity className="h-4.5 w-4.5 text-teal-405" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Automatic ISO 6346 Checksum Validation</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">The system intelligently detects typos in your 11-character container numbers automatically.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info in Sidebar */}
        <div className="relative z-10 flex items-center gap-2 text-[10.5px] text-slate-500 font-medium">
          <Ship className="h-4 w-4 text-blue-500" />
          <span>Bhakti Samudera Logistik System v3.1 • 2026</span>
        </div>
      </div>

      {/* 2. RIGHT SIDE PANEL: THE LOGIN FORM */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 relative min-h-screen">
        
        {/* Background ambient light effects on form side */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-blue-400/5 dark:bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-teal-400/5 dark:bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md z-10 space-y-6">
          
          {/* Mobile Display Header (visible on screens under md) */}
          <div className="text-center md:hidden mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 border border-slate-200/60 dark:bg-slate-800 dark:border-slate-700 shadow-md mb-3 overflow-hidden">
              <CompanyLogo className="h-10 w-10" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 uppercase">
              BHAKTI SAMUDERA
            </h1>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase font-mono">
              Logistics & Customs Tracking
            </p>
          </div>

          {/* Core Login Card */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/60 p-6 sm:p-8 shadow-xl shadow-slate-150/40 dark:shadow-none transition-all"
          >
            {/* Greeting */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100">
                Sign in to BSL Portal
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 leading-normal">
                Please select your operational access role and enter your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Modern Segmented Role Switcher Dropdown */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                  Select Access Role
                </label>
                <div className="flex flex-col gap-1.5" id="login-role-selector">
                  <select
                    id="login-role-select"
                    value={selectedRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setSelectedRole(r);
                      setError(null);
                      
                      // Auto-set standard email for quick demo convenience
                      if (r === 'President Director') setEmail('president@bsl.co.id');
                      else if (r === 'Director of Operation') setEmail('ops.dir@bsl.co.id');
                      else if (r === 'Director of Finance') setEmail('fin.dir@bsl.co.id');
                      else if (r === 'Finance Staff') setEmail('finance.staff@bsl.co.id');
                      else if (r === 'Operation Staff') setEmail('operation.staff@bsl.co.id');
                      else if (r === 'Director') setEmail('director@bsl.co.id');
                      else if (r === 'Staff') setEmail('staff.ops@bsl.co.id');
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-850 dark:border-slate-800 py-3 px-3.5 text-xs outline-none text-slate-850 dark:text-slate-100 font-bold shadow-soft-xs focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all cursor-pointer"
                  >
                    <option value="President Director">👑 President Director</option>
                    <option value="Director of Operation">⚙️ Director of Operation</option>
                    <option value="Director of Finance">💼 Director of Finance</option>
                    <option value="Finance Staff">💳 Finance Staff</option>
                    <option value="Operation Staff">⚓ Operation Staff</option>
                    <option value="Director">🛡️ Director (Legacy)</option>
                    <option value="Staff">🔑 Staff Ops (Legacy)</option>
                  </select>
                </div>
              </div>              {/* Email/Username input section */}
              <div>
                <label htmlFor="login-email-input" className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                  PORTAL ACCESS EMAIL
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    placeholder={selectedRole === 'Director' ? 'director@bsl.co.id' : 'staff.ops@bsl.co.id'}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-850 dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 transition-all font-semibold font-mono placeholder:text-slate-400 dark:placeholder:text-slate-650"
                  />
                </div>
              </div>

              {/* Password input section */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="login-password-input" className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    ACCESS PASSWORD
                  </label>
                </div>

                <div className="relative">
                  {/* Inset Left Key Icon */}
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock className="h-4.5 w-4.5 text-slate-405" />
                  </div>

                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={selectedRole === 'Director' ? 'e.g. director123' : 'e.g. staff123'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-11 py-3 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 dark:border-slate-800 dark:bg-slate-850 dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 transition-all font-semibold font-mono placeholder:text-slate-400 dark:placeholder:text-slate-650"
                  />
                  
                  {/* Eye input toggler */}
                  <button
                    id="login-toggle-show-password"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>

                {/* Remember Me Checkbox and Forgot Password Link */}
                <div className="flex items-center justify-between mt-4 px-1 select-none">
                  <label htmlFor="login-remember-me-checkbox" className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-405 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    <input
                      id="login-remember-me-checkbox"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 h-4.5 w-4.5 bg-slate-50 dark:bg-slate-850 text-blue-600 focus:ring-blue-500/20 focus:ring-4 transition-all"
                    />
                    <span>Remember Me</span>
                  </label>
                  
                  <button
                    id="login-btn-forgot-password"
                    type="button"
                    onClick={() => {
                      const initialRole = selectedRole;
                      setResetRole(initialRole);
                      setResetTarget(initialRole === 'Director' ? 'director@bsl.co.id' : 'staff.ops@bsl.co.id');
                      setNewSandi('');
                      setConfirmNewSandi('');
                      setUserInputOtp('');
                      setOtpError(null);
                      setNewSandiValidationError(null);
                      setResetSandiSuccess(false);
                      setResetStep(1);
                      setShowResetModal(true);
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline outline-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Secure Session Info indicator */}
                <div className="flex items-center gap-1.5 mt-2.5 px-1.5 text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-normal">
                  <Clock className="h-3.5 w-3.5 text-slate-400/80 shrink-0" />
                  <span>Session access is protected under secure encryption of local-storage standards for privacy and data safety.</span>
                </div>
              </div>

              {/* Premium error indicator */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="relative flex flex-col gap-2.5 bg-rose-50/95 dark:bg-rose-955/20 text-rose-800 dark:text-rose-400 p-4 rounded-2xl border border-rose-250 dark:border-rose-900/60 shadow-lg shadow-rose-500/5"
                    id="login-error-alert"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="h-6 w-6 shrink-0 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-550">
                        <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs tracking-wider uppercase text-rose-700 dark:text-rose-300">
                            Login Failed: {error.type === 'email' ? 'Incorrect Email' : 'Incorrect Password'}
                          </h4>
                          <button
                            type="button"
                            onClick={() => setError(null)}
                            className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
                            title="Close notification"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] font-medium leading-relaxed">
                          {error.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Primary submit action */}
              <button
                id="login-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 flex items-center justify-center p-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:hover:bg-blue-600 text-white font-extrabold text-xs tracking-wider uppercase transition-all border border-blue-700 shadow-md shadow-blue-500/15 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-white block animate-ping" />
                    Checking Password...
                  </span>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>

            </form>



          </motion.div>

          {/* Secure disclaimer in center column layout */}
          <div className="text-center text-[10.5px] text-slate-400 dark:text-slate-550 font-medium">
            Cloud security system utilizes securely encrypted password local-storage. <br />
            Should you forget default credentials, you can simulate a safe OTP reset.
          </div>

        </div>
      </div>

      {/* 3. RESET PASSWORD MODAL CONTAINER */}
      <AnimatePresence>
        {showResetModal && (
          <div id="reset-password-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto font-sans"
            >
              {/* Close icon top-right corner */}
              <button
                id="reset-close-btn"
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                  <Lock className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400 animate-pulse" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  BSL Access Password Recovery
                </h3>
              </div>

              {/* Progress Stepper Indicator */}
              <div className="flex items-center justify-between mb-6 px-1 select-none">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${
                      resetStep === step
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                        : resetStep > step
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-850 dark:border-slate-800'
                    }`}>
                      {resetStep > step ? '✓' : step}
                    </div>
                    {step < 4 && (
                      <div className={`h-0.5 flex-1 mx-2 transition-all ${
                        resetStep > step ? 'bg-emerald-500' : 'bg-slate-100 dark:bg-slate-800'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* STEP 1: Enter registered corporate email */}
              {resetStep === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">
                      Step 1: Verify Registered Email
                    </h4>
                    <p className="text-xs text-slate-405 dark:text-slate-400 leading-relaxed">
                      The system will send a 6-digit verification code to your corporate email address. Please select your role and enter your email address:
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      SELECT ACCESS ROLE
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                       <button
                        type="button"
                        onClick={() => {
                          setResetRole('Staff');
                          setResetTarget('staff.ops@bsl.co.id');
                        }}
                        className={`py-2 px-3 text-xs rounded-xl font-bold border transition-all ${
                          resetRole === 'Staff'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-800'
                            : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        Staff Ops
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResetRole('Director');
                          setResetTarget('director@bsl.co.id');
                        }}
                        className={`py-2 px-3 text-xs rounded-xl font-bold border transition-all ${
                          resetRole === 'Director'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-800'
                            : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        Director
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                      DATABASE ACCESS EMAIL
                    </label>
                    <input
                      type="email"
                      required
                      placeholder={resetRole === 'Director' ? 'director@bsl.co.id' : 'staff.ops@bsl.co.id'}
                      value={resetTarget}
                      onChange={(e) => setResetTarget(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-850 dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs transition-all font-semibold font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={!resetTarget || resetSending}
                    onClick={() => {
                      setResetSending(true);
                      // Generate a dynamic secure code for OTP
                      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
                      setOtpSentCode(generatedOtp);
                      
                      setTimeout(() => {
                        setResetSending(false);
                        setResetStep(2);
                      }, 300);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wide uppercase transition-all border border-blue-700 disabled:opacity-40 cursor-pointer"
                  >
                    {resetSending ? (
                      <span className="flex items-center gap-1.5 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-white block animate-ping" />
                        Sending Verification to {resetTarget}...
                      </span>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Verification Code
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STEP 2: Inbox simulator & OTP Entry check */}
              {resetStep === 2 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">
                      Step 2: Verify Your Email OTP Code
                    </h4>
                    <p className="text-xs text-slate-405 dark:text-slate-400 leading-relaxed">
                      A unique OTP code has been sent to <strong className="font-mono text-slate-700 dark:text-slate-300">{resetTarget}</strong>. You can view it directly in the email simulator box below to process the instant verification:
                    </p>
                  </div>

                  {/* SIMULATOR EMAIL BOX */}
                  <div className="border border-blue-200/60 bg-blue-550/5 dark:border-blue-900/40 dark:bg-blue-955/20 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-105 dark:border-blue-950 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Mail className="h-3 w-3" />
                        </div>
                        <span className="text-[10.5px] font-extrabold text-blue-700 dark:text-blue-450 uppercase tracking-wide">Simulator Inbox</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">Just Received</span>
                    </div>

                    <div className="space-y-1 text-slate-650 dark:text-slate-350 text-[11px] leading-normal font-medium">
                      <p><strong>From:</strong> Bhakti Samudera Logistics <span className="text-slate-400">&lt;auth.noreply@bsl.co.id&gt;</span></p>
                      <p><strong>To:</strong> {resetTarget}</p>
                      <p className="pt-1 text-slate-800 dark:text-slate-150 border-t border-slate-100 dark:border-slate-850 mt-1 pb-1">
                        We detected a password reset request for your <strong>{resetRole}</strong> account.
                      </p>
                      <div className="bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-blue-200/50 dark:border-blue-950/20 text-center my-2 select-all">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">ACCESS CODE OTP</span>
                        <span className="text-xl font-mono font-extrabold text-blue-600 dark:text-blue-400 block mt-1 tracking-widest">{otpSentCode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Input OTP form field */}
                  <div className="space-y-2">
                    <label className="block text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      ENTER 6-DIGIT SECURE OTP CODE
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 123456"
                        value={userInputOtp}
                        onChange={(e) => {
                          setUserInputOtp(e.target.value.replace(/\D/g, ''));
                          setOtpError(null);
                        }}
                        className="w-full text-center tracking-widest leading-none font-extrabold text-lg placeholder:text-slate-300 font-mono rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-850 dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 transition-all"
                      />
                    </div>
                    {otpError && (
                      <p className="text-[11px] text-rose-500 font-semibold">{otpError}</p>
                    )}
                  </div>

                  {/* Quick-fill Button & Verification Submit */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUserInputOtp(otpSentCode);
                        setOtpError(null);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg text-[10px] font-bold border border-blue-150 bg-blue-50/50 hover:bg-blue-50 text-blue-600 dark:border-blue-900/30 dark:bg-blue-955/20 dark:text-blue-400 transition-all cursor-pointer"
                    >
                      ⚡ Copy & Autofill OTP Code
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (userInputOtp === otpSentCode) {
                          setResetStep(3);
                        } else {
                          setOtpError('Incorrect OTP Code! Please make sure it matches the simulator inbox code.');
                        }
                      }}
                      className="w-full h-11 flex items-center justify-center p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.98] cursor-pointer"
                    >
                      Verify OTP & Set Password
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setUserInputOtp('');
                      setOtpError(null);
                    }}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    ← Go Back, Choose Email
                  </button>
                </div>
              )}

              {/* STEP 3: Change Password Form */}
              {resetStep === 3 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">
                      Step 3: Enter New Password
                    </h4>
                    <p className="text-xs text-slate-405 dark:text-slate-400 leading-relaxed">
                      Please enter and confirm a new access password for your <strong className="text-slate-700 dark:text-slate-300">{resetRole}</strong> account to save it securely:
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                        NEW ACCESS PASSWORD
                      </label>
                      <input
                        type="text"
                        placeholder="Type at least 4 characters"
                        value={newSandi}
                        onChange={(e) => {
                          setNewSandi(e.target.value);
                          setNewSandiValidationError(null);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-850 dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs transition-all font-semibold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10.5px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                        CONFIRM NEW PASSWORD
                      </label>
                      <input
                        type="text"
                        placeholder="Must match the password entered above"
                        value={confirmNewSandi}
                        onChange={(e) => {
                          setConfirmNewSandi(e.target.value);
                          setNewSandiValidationError(null);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-850 dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs transition-all font-semibold font-mono"
                      />
                    </div>

                    {newSandiValidationError && (
                      <p className="text-[11px] text-rose-500 font-semibold">{newSandiValidationError}</p>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (newSandi.trim().length < 4) {
                          setNewSandiValidationError('Password too short! Please enter at least 4 characters.');
                          return;
                        }
                        if (newSandi !== confirmNewSandi) {
                          setNewSandiValidationError('Passwords do not match! Please verify your inputs.');
                          return;
                        }

                        resetPassword(resetRole, newSandi);
                        setResetStep(4);
                      }}
                      className="w-full h-11 flex items-center justify-center gap-1.5 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer border border-emerald-700"
                    >
                      Save New Password
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Success confirmation */}
              {resetStep === 4 && (
                <div className="space-y-6 text-center py-4">
                  <div className="flex flex-col items-center">
                    <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3 animate-bounce">
                      <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                      Password Successfully Updated!
                    </h4>
                    <p className="text-xs text-slate-405 dark:text-slate-400 mt-2 px-1 leading-relaxed">
                      Your new access password for <strong className="text-slate-700 dark:text-slate-200">{resetRole}</strong> has been successfully updated on secure client storage.
                    </p>
                  </div>

                  {/* Informational Autofill suggestion */}
                  <div className="bg-slate-550/5 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 p-3.5 rounded-2xl text-[11px] space-y-1 text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                    <div className="text-[10px] text-slate-400 tracking-wider font-extrabold">New Saved Password:</div>
                    <div className="text-sm text-emerald-600 dark:text-emerald-400 font-mono tracking-wider font-extrabold bg-white dark:bg-slate-900 border py-1 rounded-xl">{newSandi}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      // Apply it on the main login screen immediately
                      setSelectedRole(resetRole);
                      setEmail(resetRole === 'Director' ? 'director@bsl.co.id' : 'staff.ops@bsl.co.id');
                      setPassword(newSandi);
                      setError(null);
                      setShowResetModal(false);
                    }}
                    className="w-full h-11 flex items-center justify-center p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    Go to Portal Login
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
