/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, RegisteredUser } from '../types';
import { 
  Building2, 
  Users, 
  Trash2, 
  Pencil,
  Plus, 
  Upload, 
  Link, 
  Type, 
  RefreshCw, 
  Check, 
  ShieldAlert, 
  UserPlus, 
  Info,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';

export default function AdminSettingsDesk() {
  const { 
    registeredUsers, 
    registerUser, 
    updateUser,
    deleteUser, 
    companyLogo, 
    updateCompanyLogo,
    currentUser,
    currentRole,
    wipeAllShipments
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [logoType, setLogoType] = useState<'upload' | 'url' | 'text'>('upload');
  
  // Custom Logo input states
  const [logoUrl, setLogoUrl] = useState('');
  const [logoText, setLogoText] = useState('BSL');
  const [dragActive, setDragActive] = useState(false);
  const [logoAlert, setLogoAlert] = useState<string | null>(null);
  
  // Register User input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('Operation Staff');
  const [password, setPassword] = useState('');
  const [userAlert, setUserAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit User input states
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('Operation Staff');
  const [editPassword, setEditPassword] = useState('');

  // Temporary uploaded logo before save
  const [tempLogoDataUrl, setTempLogoDataUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isWritable = currentRole === 'Director of Operation';

  // File picker upload handler for Logo (Base64 conversion)
  const handleLogoFile = (file: File) => {
    setLogoAlert(null);
    if (!isWritable) {
      setLogoAlert('⚠️ Permission Denied: Only Director of Operation can update Logo configuration!');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setLogoAlert('File format must be an image (PNG, JPG, SVG, WEBP)!');
      return;
    }
    // Limit to 1.5MB for local storage optimization
    if (file.size > 1500000) {
      setLogoAlert('File size too large! Please use an image under 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTempLogoDataUrl(reader.result);
        setLogoAlert('Selected logo loaded! Press "SAVE PHOTO" or "SAVE LOGO" to apply the changes.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveUploadedLogo = () => {
    if (!isWritable) {
      setLogoAlert('⚠️ Permission Denied: Only Director of Operation can update Logo configuration!');
      return;
    }
    if (!tempLogoDataUrl) {
      setLogoAlert('Please choose or drop an image file first!');
      return;
    }
    updateCompanyLogo(tempLogoDataUrl);
    setTempLogoDataUrl(null);
    setLogoAlert('New logo successfully uploaded, applied and saved!');
    setTimeout(() => setLogoAlert(null), 3000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!isWritable) {
      setLogoAlert('⚠️ Permission Denied: Only Director of Operation can update Logo configuration!');
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLogoAlert(null);
    if (!isWritable) {
      setLogoAlert('⚠️ Permission Denied: Only Director of Operation can update Logo configuration!');
      return;
    }
    if (!logoUrl.trim().startsWith('http://') && !logoUrl.trim().startsWith('https://')) {
      setLogoAlert('Image URL address must start with http:// or https://!');
      return;
    }
    updateCompanyLogo(logoUrl.trim());
    setLogoAlert('URL-based logo saved successfully!');
    setLogoUrl('');
    setTempLogoDataUrl(null);
    setTimeout(() => setLogoAlert(null), 3000);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLogoAlert(null);
    if (!isWritable) {
      setLogoAlert('⚠️ Permission Denied: Only Director of Operation can update Logo configuration!');
      return;
    }
    if (!logoText.trim() || logoText.trim().length > 6) {
      setLogoAlert('Monogram initials must be minimum 1 character and maximum 6 characters!');
      return;
    }
    updateCompanyLogo(logoText.trim().toUpperCase());
    setTempLogoDataUrl(null);
    setLogoAlert('Official text monogram logo configured successfully!');
    setTimeout(() => setLogoAlert(null), 3000);
  };

  const handleResetLogo = () => {
    if (!isWritable) {
      setLogoAlert('⚠️ Permission Denied: Only Director of Operation can update Logo configuration!');
      return;
    }
    setTempLogoDataUrl(null);
    updateCompanyLogo(null);
    setLogoAlert('Company logo successfully reverted to default BSL Maritime standard!');
    setTimeout(() => setLogoAlert(null), 3550);
  };

  // Add User Registration handler
  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserAlert(null);

    if (!isWritable) {
      setUserAlert({ type: 'error', message: '⚠️ Permission Denied: Only Director of Operation can register corporate staff access portals!' });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setUserAlert({ type: 'error', message: 'Invalid email format!' });
      return;
    }

    // Check duplicate email
    const duplicate = registeredUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (duplicate) {
      setUserAlert({ type: 'error', message: 'This email address is already registered in the BSL system!' });
      return;
    }

    if (password.length < 5) {
      setUserAlert({ type: 'error', message: 'Password must consist of at least 5 characters!' });
      return;
    }

    registerUser(email, fullName, userRole, password);
    setUserAlert({ 
      type: 'success', 
      message: `${userRole} account for "${fullName}" registered successfully! They can now log in.` 
    });

    // Reset inputs
    setFullName('');
    setEmail('');
    setPassword('');
    setTimeout(() => setUserAlert(null), 4000);
  };

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserAlert(null);

    if (!isWritable) {
      setUserAlert({ type: 'error', message: '⚠️ Permission Denied: Only Director of Operation can edit corporate staff access portal!' });
      return;
    }

    if (editingUser) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(editEmail)) {
        setUserAlert({ type: 'error', message: 'Invalid email format!' });
        return;
      }

      // Check duplicate email (excluding the user being edited)
      const duplicate = registeredUsers.find(u => u.id !== editingUser.id && u.email.toLowerCase() === editEmail.trim().toLowerCase());
      if (duplicate) {
        setUserAlert({ type: 'error', message: 'This email address is already registered under another account!' });
        return;
      }

      if (editPassword.length < 5) {
        setUserAlert({ type: 'error', message: 'Password must consist of at least 5 characters!' });
        return;
      }

      updateUser(editingUser.id, editEmail, editFullName, editUserRole, editPassword);
      setEditingUser(null);
      setUserAlert({ 
        type: 'success', 
        message: `Active member "${editFullName}" credentials updated successfully!` 
      });
      setTimeout(() => setUserAlert(null), 4000);
    }
  };

  return (
    <div 
      id="admin-settings-desk-card" 
      className="mt-8 rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/40 to-slate-50 dark:border-slate-800 dark:from-slate-900/60 dark:to-slate-950 overflow-hidden shadow-sm"
    >
      {/* Header Banner Button Toggler */}
      <button
        id="admin-settings-toggler"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-blue-100/10 dark:hover:bg-slate-800/15 transition-all text-left outline-none"
      >
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-blue-400">
            <Building2 className="h-5.5 w-5.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
              Administration & Branding Control Panel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Change company logo, customize identity monogram, and register operational staff access rights independently.
            </p>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="h-5 h-5" /> : <ChevronDown className="h-5 h-5" />}
        </div>
      </button>

      {/* Settings Panel Content */}
      {isOpen && (
        <div id="admin-settings-panel-body" className="border-t border-blue-100 dark:border-slate-800 p-6 md:p-8 space-y-8">
          
          {/* Permission warning for non-Director of Operation */}
          {!isWritable && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300 text-xs shadow-soft-xs">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-sm mb-1 uppercase tracking-wider text-amber-900 dark:text-amber-200">⚠️ Restricted Access Control Panel</span>
                Only employees holding the role <strong className="font-extrabold text-blue-700 dark:text-blue-300">Director of Operation</strong> can edit or update branding configurations, text monogram, or staff listings. Feel free to use the role switcher to switch to Director of Operation to try out edits.
              </div>
            </div>
          )}
          
          {/* Section 1: Brand Logo customizer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-8 border-b border-dashed border-slate-200 dark:border-slate-850">
            
            {/* Left Col: Explainer & Current Preview */}
            <div className="lg:col-span-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Visual Identity</span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Change Company Logo</h4>
                <p className="text-xs text-slate-550 leading-relaxed dark:text-slate-400">
                  Instantly update the logo across all application views (Header, Sidebar, PDF reports, and Login credentials page).
                </p>
              </div>

              {/* Real-time logo widget preview */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200/80 dark:bg-slate-850 dark:border-slate-800 text-center shadow-soft-sm">
                <span className="text-[10px] text-slate-400 font-bold block mb-3 uppercase tracking-widest font-mono">Real-time Preview</span>
                <div className={`h-20 w-20 flex items-center justify-center rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 shadow-inner mb-3 overflow-hidden ${companyLogo || tempLogoDataUrl ? 'p-0' : 'p-2'}`}>
                  {tempLogoDataUrl ? (
                    <img
                      src={tempLogoDataUrl}
                      alt="Pending Preview Logo"
                      className="h-full w-full object-cover animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                  ) : companyLogo ? (
                    companyLogo.startsWith('data:') || companyLogo.startsWith('http://') || companyLogo.startsWith('https://') ? (
                      <img
                        src={companyLogo}
                        alt="Preview Logo"
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold flex items-center justify-center text-sm shadow-sm uppercase tracking-tighter select-none">
                        {companyLogo.slice(0, 3)}
                      </div>
                    )
                  ) : (
                    <div className="text-slate-300 italic text-[11px] select-none">Default (B)</div>
                  )}
                </div>
                <div className="space-y-1 text-center w-full">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block">
                    {tempLogoDataUrl ? (
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px] uppercase tracking-wider block animate-pulse">⚠️ PENDING SAVE</span>
                    ) : companyLogo ? (
                      companyLogo.startsWith('data:') ? 'Custom Upload Base64' : companyLogo.startsWith('http') ? 'External Web URL' : `Text Monogram ("${companyLogo}")`
                    ) : (
                      'Default Maritime BSL'
                    )}
                  </span>
                  {companyLogo && !tempLogoDataUrl && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-450 dark:hover:text-rose-400 flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw className="h-3 w-3" /> Revert to Default
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Logo Input Options */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              
              {/* Type Switcher tabs */}
              <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-850/80 rounded-xl mb-4 border border-slate-200/40 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setLogoType('upload')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all outline-none ${
                    logoType === 'upload' 
                      ? 'bg-white shadow-sm text-blue-600 dark:bg-slate-850 dark:text-blue-400 border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" /> Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setLogoType('url')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all outline-none ${
                    logoType === 'url' 
                      ? 'bg-white shadow-sm text-blue-600 dark:bg-slate-850 dark:text-blue-400 border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Link className="h-3.5 w-3.5" /> Link Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setLogoType('text')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all outline-none ${
                    logoType === 'text' 
                      ? 'bg-white shadow-sm text-blue-600 dark:bg-slate-850 dark:text-blue-400 border border-slate-200/50' 
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Type className="h-3.5 w-3.5" /> Monogram Text
                </button>
              </div>

              {/* File Upload Canvas Tab */}
              {logoType === 'upload' && (
                tempLogoDataUrl ? (
                  <div className="border-2 border-dashed border-amber-300 bg-amber-500/5 dark:border-amber-800/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-14 w-14 rounded-xl overflow-hidden border border-amber-300 shadow-sm flex-shrink-0">
                        <img src={tempLogoDataUrl} className="h-full w-full object-cover" alt="Loaded preview" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-100">Selected Photo Loaded</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">Image processed successfully but not yet saved as the official company logo.</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={handleSaveUploadedLogo}
                        className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <Check className="h-3.5 w-3.5" /> SAVE LOGO
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTempLogoDataUrl(null);
                          setLogoAlert(null);
                        }}
                        className="py-2 px-4 border border-slate-200 text-slate-500 hover:text-slate-850 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-750 dark:hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    id="logo-drag-drop-zone"
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px] select-none ${
                      dragActive 
                        ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-400/5' 
                        : 'border-slate-250 hover:border-blue-500 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleLogoFile(e.target.files[0]);
                        }
                      }}
                    />
                    <ImageIcon className="h-8 w-8 text-blue-600 mb-2 dark:text-blue-400" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Drag & drop logo file here, or <span className="text-blue-600 dark:text-blue-400 hover:underline">choose file</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supported formats: PNG, JPG, WEBP, or SVG. Maximum 1.5MB.
                    </p>
                  </div>
                )
              )}

              {/* Link Image URL Tab */}
              {logoType === 'url' && (
                <form onSubmit={handleUrlSubmit} className="space-y-3 p-1">
                  <div className="space-y-1.5">
                    <label htmlFor="logo-url-input" className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      Logo Image URL Address
                    </label>
                    <input
                      id="logo-url-input"
                      type="url"
                      required
                      placeholder="https://example.com/company-logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-850 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 border border-slate-950 text-white dark:bg-blue-600 dark:border-blue-700 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Link className="h-3.5 w-3.5" /> Save Logo URL Link
                  </button>
                </form>
              )}

              {/* Monogram Teks Tab */}
              {logoType === 'text' && (
                <form onSubmit={handleTextSubmit} className="space-y-3 p-1">
                  <div className="space-y-1.5">
                    <label htmlFor="logo-text-input" className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      Monogram Initials (Max 6 Characters)
                    </label>
                    <input
                      id="logo-text-input"
                      type="text"
                      required
                      placeholder="e.g. BSL"
                      maxLength={6}
                      value={logoText}
                      onChange={(e) => setLogoText(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-850 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-900 border border-slate-950 text-white dark:bg-blue-600 dark:border-blue-700 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Type className="h-3.5 w-3.5" /> Set Monogram Text
                  </button>
                </form>
              )}

              {/* Alert Feedback Branding */}
              {logoAlert && (
                <div id="admin-logo-alert-notif" className="mt-3 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <Info className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{logoAlert}</span>
                </div>
              )}
            </div>

          </div>

          {/* Section 2: User manager & registrations (Roster) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
            
            {/* Left Box: Simple Account registering form */}
            <div className="lg:col-span-5 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#005cbb] dark:text-blue-400">Security & Access</span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Register New Member</h4>
                <p className="text-xs text-slate-550 leading-relaxed dark:text-slate-400">
                  Create new active operational portal logins for employees, staff, or additional executives.
                </p>
              </div>

              <form onSubmit={handleRegisterUser} className="space-y-3.5 bg-white border border-slate-200/80 p-5 rounded-2xl dark:bg-slate-850 dark:border-slate-800 shadow-soft-sm">
                <div className="space-y-1">
                  <label htmlFor="reg-fullname-input" className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    Full Name
                  </label>
                  <input
                    id="reg-fullname-input"
                    type="text"
                    required
                    placeholder="e.g. Sri Mulyani"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-email-input" className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    Portal Access Email
                  </label>
                  <input
                    id="reg-email-input"
                    type="email"
                    required
                    placeholder="e.g. sri@bsl.co.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="reg-role-select" className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      Authority Role
                    </label>
                    <select
                      id="reg-role-select"
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as UserRole)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-2 text-xs outline-none dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold"
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

                  <div className="space-y-1">
                    <label htmlFor="reg-pw-input" className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      Access Password
                    </label>
                    <input
                      id="reg-pw-input"
                      type="password"
                      required
                      placeholder="e.g. sri123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:focus:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="h-4 w-4" /> Register Employee Access
                </button>

                {userAlert && (
                  <div 
                    id="admin-user-alert-notif" 
                    className={`text-xs p-3 rounded-xl border flex items-start gap-2 ${
                      userAlert.type === 'success' 
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/30' 
                        : 'text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-455 dark:bg-rose-955/20 dark:border-rose-900/30'
                    }`}
                  >
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{userAlert.message}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Right Box: Members Table Roster */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div className="space-y-1 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#015bb6] dark:text-blue-400">Active Members Roster</span>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Registered Access Rights Listing</h4>
              </div>

              <div id="roster-table-container" className="border border-slate-200 rounded-2xl bg-white overflow-hidden dark:bg-slate-850 dark:border-slate-800 shadow-soft-sm flex-1 min-h-[180px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-450 dark:bg-slate-900 dark:border-slate-800 font-bold">
                      <th className="py-2.5 px-4">Full Name & Email</th>
                      <th className="py-2.5 px-4 w-28">Role</th>
                      <th className="py-2.5 px-4 w-32">Passphrase Key</th>
                      <th className="py-2.5 px-4 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {registeredUsers.map((user) => {
                      const isMe = currentUser.fullName === user.fullName || currentUser.username === user.email.split('@')[0];
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                              {user.fullName}
                              {isMe && (
                                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{user.email}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.role === 'Director' 
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' 
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-350'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {user.password || '•••••'}
                          </td>
                          <td className="py-3 px-4 text-center mr-0">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isWritable) {
                                    alert("🛡️ Permission Denied: Only Director of Operation can update active members credentials!");
                                    return;
                                  }
                                  setEditingUser(user);
                                  setEditFullName(user.fullName);
                                  setEditEmail(user.email);
                                  setEditUserRole(user.role);
                                  setEditPassword(user.password || '');
                                }}
                                className="p-1.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-600 transition-all dark:border-blue-900/30 dark:hover:bg-blue-950 dark:text-blue-400 cursor-pointer"
                                title="Edit Access Rights"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (!isWritable) {
                                    alert("🛡️ Permission Denied: Only Director of Operation can revoke registered user access portal!");
                                    return;
                                  }
                                  if (isMe) {
                                    alert("You cannot revoke access for your own currently logged-in account!");
                                    return;
                                  }
                                  if (confirm(`Confirm: Revoke portal access for "${user.fullName}" (${user.email})?`)) {
                                    deleteUser(user.id);
                                  }
                                }}
                                disabled={isMe}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isMe 
                                    ? 'text-slate-300 border-slate-100 cursor-not-allowed dark:text-slate-755 dark:border-slate-800' 
                                    : 'text-rose-600 border-rose-200 bg-rose-50/60 hover:bg-rose-100 dark:hover:bg-rose-950 dark:border-rose-900/40 cursor-pointer'
                                }`}
                                title={isMe ? "Your active account" : "Revoke Access"}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Section 3: Danger Zone */}
          <div className="pt-8 border-t border-dashed border-red-200 dark:border-red-900/30">
            <div className="rounded-2xl border border-red-205 bg-red-50/15 dark:border-red-900/20 dark:bg-rose-950/5 p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Database Administration</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    Hapus Semua Data Shipment (Wipe Database)
                  </h4>
                  <p className="text-xs text-slate-550 leading-relaxed dark:text-slate-400">
                    This action will permanently delete all shipments, estimated cost entries, operational invoices, customs checklists, and active budgets from active Firestore. This action is IRREVERSIBLE.
                  </p>
                </div>

                <div className="self-start md:self-center shrink-0">
                  <button
                    type="button"
                    disabled={!isWritable}
                    onClick={async () => {
                      if (!isWritable) return;
                      if (confirm("🚨 WARNING: Are you absolutely sure you want to PERMANENTLY delete all active shipment and costing records from Firestore and local caches? This will clear the portal for fresh new entries.")) {
                        const secondCheck = prompt("Security check: Type the word 'WIPE' to confirm deletion:");
                        if (secondCheck === 'WIPE' || secondCheck === 'wipe') {
                          const success = await wipeAllShipments();
                          if (success) {
                            alert("✅ Database successfully wiped clean. All shipments have been deleted.");
                          } else {
                            alert("❌ Error: Failed to wipe some database nodes. See server logs.");
                          }
                        } else {
                          alert("Action cancelled. Security passphrase mismatched.");
                        }
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-2 transition-all ${
                      isWritable
                        ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer hover:shadow active:scale-95'
                        : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-900 dark:border-slate-800'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" /> HAPUS SEMUA SHIPMENT
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Edit User Floating Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft-xl max-w-sm w-full p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#005cbb] dark:text-blue-400 font-mono">Security & Access Control</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">Edit Access Rights</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  Portal Access Email
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 outline-none focus:border-blue-500 font-medium font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                    Authority Role
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-850 dark:bg-slate-950 py-2 px-3 text-xs text-slate-800 dark:text-slate-100 outline-none focus:bg-white font-bold select-none cursor-pointer"
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

                <div className="space-y-1">
                  <label className="block text-[10px] font-black tracking-wider text-slate-400 dark:text-slate-550 uppercase">
                    Passphrase Key
                  </label>
                  <input
                    type="password"
                    required
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 px-4 py-2 text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 hover:shadow-md text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ease-out duration-150 active:scale-95"
                >
                  <Check className="h-4 w-4" /> SAVE CHANGES
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="py-2 px-4 border border-slate-200 hover:bg-slate-50 dark:border-slate-850 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
