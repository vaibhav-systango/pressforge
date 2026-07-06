'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { 
  ShieldCheck, UploadCloud, Check, ArrowRight, Sparkles, 
  Building, User, FileText, Phone, Calendar, MapPin
} from 'lucide-react';

export function KycView() {
  const router = useRouter();
  const { state, updateState } = useAppState();
  const isIndividual = state.accountType === 'individual';
  const isOrg = state.accountType === 'organization';

  // Form States
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [idType, setIdType] = useState('passport');
  
  const [companyName, setCompanyName] = useState(state.organizationName || '');
  const [businessType, setBusinessType] = useState('llc');
  const [taxId, setTaxId] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  // UI States
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSimulatedUpload = () => {
    setIsUploading(true);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 20;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setUploadedFile(isIndividual ? 'passport_scan.jpg' : 'business_registration.pdf');
        setIsUploading(false);
      }
    }, 150);
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    if (isIndividual && (!fullName || !phoneNumber || !dob || !uploadedFile)) {
      alert('Please fill in all details and upload your identity document.');
      return;
    }
    if (isOrg && (!companyName || !taxId || !businessAddress || !contactPerson || !uploadedFile)) {
      alert('Please fill in all business details and upload verification documents.');
      return;
    }

    setVerifying(true);
    let stepProgress = 0;
    const interval = setInterval(() => {
      stepProgress += 10;
      setProgress(stepProgress);
      if (stepProgress >= 100) {
        clearInterval(interval);
        updateState((prev) => ({
          ...prev,
          currentStep: 4,
        }));
        router.push('/onboarding/connect');
      }
    }, 100);
  };

  const autofillDemo = () => {
    if (isIndividual) {
      setFullName('Jane Doe');
      setPhoneNumber('+1 (555) 019-2834');
      setDob('1994-08-12');
      setUploadedFile('passport_jane_doe.jpg');
    } else {
      setCompanyName(state.organizationName || 'Forge Agencies Inc.');
      setTaxId('EIN-98-7654321');
      setBusinessAddress('100 Pine Street, San Francisco, CA 94111');
      setContactPerson('Jane Doe (Managing Director)');
      setUploadedFile('business_license_forge.pdf');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-200/20 to-orange-200/20 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-pink-200/20 to-orange-200/20 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10 w-full max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#262626] flex items-center justify-center gap-2">
            <ShieldCheck className="w-8 h-8 text-instagram-pink" />
            <span>Identity & Compliance (KYC)</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
            {isIndividual 
              ? 'Complete a quick identity verification to verify your content creator account.' 
              : 'Verify your business registration details to enable client portals and workspace features.'}
          </p>
        </div>

        <OnboardingStepper currentStep={isIndividual ? 4 : 2} />

        <div className="bg-white border border-[#EFEFEF] rounded-3xl p-8 shadow-sm">
          {verifying ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-pink-50 border border-pink-100 flex items-center justify-center text-instagram-pink animate-pulse">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#262626]">Submitting Verification</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Our automated compliance system is validating your documents.
                </p>
              </div>
              <div className="w-full max-w-xs bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#F58529] to-[#DD2A7B] h-1.5 transition-all duration-100" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                {progress}% Complete
              </span>
            </div>
          ) : (
            <form onSubmit={handleFinish} className="space-y-6">
              {isIndividual ? (
                /* INDIVIDUAL KYC FORM */
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Legal Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Phone Number</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 000-0000"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date of Birth</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Identity Document Type</span>
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="border border-[#EFEFEF] bg-white rounded-xl px-3 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    >
                      <option value="passport">Passport</option>
                      <option value="drivers_license">Driver's License</option>
                      <option value="national_id">National ID Card</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* ORGANIZATION KYC FORM */
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Company Legal Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Acme Digital Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#737373]">Business Entity Type</label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="border border-[#EFEFEF] bg-white rounded-xl px-3 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                      >
                        <option value="llc">LLC (Limited Liability Co)</option>
                        <option value="corporation">Corporation</option>
                        <option value="partnership">Partnership</option>
                        <option value="solo">Solo Proprietorship</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tax ID / EIN Number</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. EIN-12-3456789"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Business Registered Address</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123 Corporate Blvd, Suite 400, New York, NY"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Primary Contact Person (Name & Title)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe (CEO)"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                  </div>
                </div>
              )}

              {/* DOCUMENT UPLOAD ZONE */}
              <div className="flex flex-col gap-1.5 mt-4">
                <label className="text-xs font-semibold text-[#737373]">
                  {isIndividual ? 'Upload Identity Document Scan' : 'Upload Corporate Registry / Business License'}
                </label>
                
                {uploadedFile ? (
                  <div className="border border-green-200 bg-green-50/50 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{uploadedFile}</p>
                        <p className="text-[10px] text-green-700">Document Uploaded Successfully</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-xs text-red-500 hover:underline font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSimulatedUpload}
                    disabled={isUploading}
                    className="border border-dashed border-[#EFEFEF] rounded-2xl p-6 text-center hover:bg-slate-50 transition duration-150 cursor-pointer flex flex-col items-center justify-center gap-2 w-full text-slate-500 disabled:opacity-75"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-instagram-pink border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-semibold">Uploading document...</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-8 h-8 text-[#A3A3A3]" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">Drag & drop files or click to upload</p>
                          <p className="text-[10px] text-slate-400 mt-1">Supported formats: PDF, PNG, JPG (Max 10MB)</p>
                        </div>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3.5 rounded-xl text-xs font-bold hover:opacity-95 transition shadow-sm mt-6 cursor-pointer"
              >
                <span>Verify Identity & Complete Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Autofill Option */}
          {!verifying && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left mt-6 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-instagram-pink" /> 
                  <span>Quick Demo Helper</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">Autofill valid KYC information instantly.</p>
              </div>
              <button
                type="button"
                onClick={autofillDemo}
                className="text-[10px] bg-white border border-slate-200 hover:border-instagram-pink text-instagram-pink font-bold px-3 py-1.5 rounded-lg shadow-2xs"
              >
                Autofill Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

