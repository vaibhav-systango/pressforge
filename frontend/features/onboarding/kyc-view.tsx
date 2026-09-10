'use client';

import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/queries/use-app-state';
import React, { useState } from 'react';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { useCompleteOnboardingMutation } from '@/lib/hooks/mutations/use-onboarding';
import { buildOnboardingPayload } from '@/lib/onboarding/map-payload';
import { ApiError } from '@/lib/utils/api-errors';
import { FileUpload } from '@/components/common/file-upload';
import { Select } from '@/components/common/select';
import {
  ShieldCheck, ArrowRight, Building, User, FileText, Phone, Calendar, MapPin
} from 'lucide-react';
import {
  validateFullName,
  validatePhoneNumber,
  validateDob,
  validateCompanyName,
  validateTaxId,
  validateBusinessAddress,
  validateContactPerson
} from '@/lib/utils/validation';

export function KycView() {
  const router = useRouter();
  const { state, updateState } = useAppState();
  const completeOnboardingMutation = useCompleteOnboardingMutation();
  const isIndividual = state.accountType === 'individual';
  const isOrg = state.accountType === 'organization';

  // Form States
  const [fullName, setFullName] = useState(state.kycDetails?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(state.kycDetails?.phoneNumber || '');
  const [dob, setDob] = useState(state.kycDetails?.dob || '');
  const [idType, setIdType] = useState(state.kycDetails?.idType || 'passport');
  
  const [companyName, setCompanyName] = useState(state.kycDetails?.companyName || state.organizationName || '');
  const [businessType, setBusinessType] = useState(state.kycDetails?.businessType || 'llc');
  const [taxId, setTaxId] = useState(state.kycDetails?.taxId || '');
  const [businessAddress, setBusinessAddress] = useState(state.kycDetails?.businessAddress || '');
  const [contactPerson, setContactPerson] = useState(state.kycDetails?.contactPerson || '');

  const [uploadedFile, setUploadedFile] = useState<string | null>(state.kycDetails?.uploadedFile || null);
  const [filePreview, setFilePreview] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('kyc_file_preview');
    }
    return null;
  });
  const [fileType, setFileType] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('kyc_file_type');
    }
    return null;
  });
  const [verifying, setVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');

  // UI States
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const getErrors = () => {
    const errs: Record<string, string> = {};
    if (isIndividual) {
      const nameErr = validateFullName(fullName);
      if (nameErr) errs.fullName = nameErr;

      const phoneErr = validatePhoneNumber(phoneNumber);
      if (phoneErr) errs.phoneNumber = phoneErr;

      const dobErr = validateDob(dob);
      if (dobErr) errs.dob = dobErr;

      if (!uploadedFile) {
        errs.uploadedFile = 'Please upload your identity document';
      }
    } else {
      const nameErr = validateCompanyName(companyName);
      if (nameErr) errs.companyName = nameErr;

      const taxErr = validateTaxId(taxId);
      if (taxErr) errs.taxId = taxErr;

      const addrErr = validateBusinessAddress(businessAddress);
      if (addrErr) errs.businessAddress = addrErr;

      const contactErr = validateContactPerson(contactPerson);
      if (contactErr) errs.contactPerson = contactErr;

      if (!uploadedFile) {
        errs.uploadedFile = 'Please upload verification documents';
      }
    }
    return errs;
  };

  const errors = getErrors();



  const handleFileChange = (name: string | null, preview: string | null, type: string | null) => {
    setUploadedFile(name);
    setFilePreview(preview);
    setFileType(type);
    setTouched((prev) => ({ ...prev, uploadedFile: true }));

    if (typeof window !== 'undefined') {
      if (name) {
        if (preview) sessionStorage.setItem('kyc_file_preview', preview);
        if (type) sessionStorage.setItem('kyc_file_type', type);
      } else {
        sessionStorage.removeItem('kyc_file_preview');
        sessionStorage.removeItem('kyc_file_type');
      }
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setSubmitError('');

    const validationErrors = getErrors();
    if (Object.keys(validationErrors).length > 0) {
      notifications.show({
        title: 'Validation error',
        message: 'Please fix the errors below before continuing.',
        color: 'red',
      });
      return;
    }

    setVerifying(true);
    setProgress(10);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 150);

    try {
      // Save KYC details to frontend session state
      await updateState((prev) => ({
        ...prev,
        kycDetails: {
          fullName,
          phoneNumber,
          dob,
          idType,
          companyName,
          businessType,
          taxId,
          businessAddress,
          contactPerson,
          uploadedFile: uploadedFile || undefined,
        },
      }));

      const payload = buildOnboardingPayload(
        {
          ...state,
          kycDetails: {
            fullName,
            phoneNumber,
            dob,
            idType,
            companyName,
            businessType,
            taxId,
            businessAddress,
            contactPerson,
            uploadedFile: uploadedFile || undefined,
          },
        },
        isOrg
          ? {
              companyName,
              businessType,
              taxId,
              businessAddress,
              contactPerson,
              uploadedFile: uploadedFile || undefined,
            }
          : undefined,
      );

      await completeOnboardingMutation.mutateAsync(payload);

      clearInterval(progressInterval);
      setProgress(100);

      updateState((prev) => ({
        ...prev,
        currentStep: 5,
      }));

      notifications.show({
        title: 'Onboarding complete',
        message: 'Your account is ready. Welcome to PressForge!',
        color: 'green',
      });

      // Clear local preview storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('kyc_file_preview');
        sessionStorage.removeItem('kyc_file_type');
      }

      router.push('/app');
    } catch (error) {
      clearInterval(progressInterval);
      setVerifying(false);
      setProgress(0);

      const apiError =
        error instanceof ApiError
          ? error
          : error instanceof Error
            ? new ApiError(error.message, 500, 'UNKNOWN')
            : new ApiError('Unable to complete onboarding. Please try again.', 500, 'UNKNOWN');

      setSubmitError(apiError.message);
      notifications.show({
        title: 'Onboarding failed',
        message: apiError.message,
        color: 'red',
      });
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
              {submitError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {submitError}
                </p>
              )}
              {isIndividual ? (
                /* INDIVIDUAL KYC FORM */
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Full Legal Name</span>
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                    {(touched.fullName || submitted) && errors.fullName && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.fullName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Phone Number</span>
                        <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+1 (555) 000-0000"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, phoneNumber: true }))}
                        className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                      />
                      {(touched.phoneNumber || submitted) && errors.phoneNumber && (
                        <p className="text-[11px] text-red-500 font-medium">{errors.phoneNumber}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date of Birth</span>
                        <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, dob: true }))}
                        className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                      />
                      {(touched.dob || submitted) && errors.dob && (
                        <p className="text-[11px] text-red-500 font-medium">{errors.dob}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Select
                      label="Identity Document Type"
                      required={true}
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      options={[
                        { value: 'passport', label: 'Passport' },
                        { value: 'drivers_license', label: "Driver's License" },
                        { value: 'national_id', label: 'National ID Card' }
                      ]}
                      className="py-2.5 text-sm"
                    />
                  </div>
                </div>
              ) : (
                /* ORGANIZATION KYC FORM */
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Company Legal Name</span>
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Acme Digital Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, companyName: true }))}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                    {(touched.companyName || submitted) && errors.companyName && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.companyName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Select
                        label="Business Entity Type"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        options={[
                          { value: 'llc', label: 'LLC (Limited Liability Co)' },
                          { value: 'corporation', label: 'Corporation' },
                          { value: 'partnership', label: 'Partnership' },
                          { value: 'solo', label: 'Solo Proprietorship' }
                        ]}
                        className="py-2.5 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tax ID / EIN Number</span>
                        <span className="text-red-500 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. EIN-12-3456789"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value)}
                        onBlur={() => setTouched((prev) => ({ ...prev, taxId: true }))}
                        className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                      />
                      {(touched.taxId || submitted) && errors.taxId && (
                        <p className="text-[11px] text-red-500 font-medium">{errors.taxId}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Business Registered Address</span>
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123 Corporate Blvd, Suite 400, New York, NY"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, businessAddress: true }))}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                    {(touched.businessAddress || submitted) && errors.businessAddress && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.businessAddress}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#737373] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Primary Contact Person (Name & Title)</span>
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe (CEO)"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, contactPerson: true }))}
                      className="border border-[#EFEFEF] rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                    />
                    {(touched.contactPerson || submitted) && errors.contactPerson && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.contactPerson}</p>
                    )}
                  </div>
                </div>
              )}

              {/* DOCUMENT UPLOAD ZONE */}
              <div className="mt-4">
                <FileUpload
                  label={isIndividual ? 'Upload Identity Document Scan' : 'Upload Corporate Registry / Business License'}
                  required={true}
                  value={uploadedFile}
                  previewUrl={filePreview}
                  fileType={fileType}
                  onChange={handleFileChange}
                />
                {(touched.uploadedFile || submitted) && errors.uploadedFile && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">{errors.uploadedFile}</p>
                )}
              </div>


              {/* Action Button */}
              <button
                type="submit"
                disabled={
                  completeOnboardingMutation.isPending ||
                  (isIndividual
                    ? !fullName.trim() || !phoneNumber.trim() || !dob.trim() || !idType || !uploadedFile || Object.keys(errors).length > 0
                    : !companyName.trim() || !taxId.trim() || !businessAddress.trim() || !contactPerson.trim() || !uploadedFile || Object.keys(errors).length > 0)
                }
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3.5 rounded-xl text-xs font-bold hover:opacity-95 transition shadow-sm mt-6 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>Verify Identity & Complete Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}


        </div>
      </div>
    </div>
  );
}

