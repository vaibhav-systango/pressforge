"use client";

import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Mail, KeyRound } from "lucide-react";

import { PasswordInput } from "@/components/common/password-input";
import {
  useForgotPasswordMutation,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
} from "@/lib/hooks/mutations/use-auth";
import { ApiError } from "@/lib/utils/api-errors";
import { validateEmail, validatePassword } from "@/lib/utils/validation";

export function ForgotPasswordView() {
  const [step, setStep] = useState<"email" | "code" | "password" | "success">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const forgotPasswordMutation = useForgotPasswordMutation();
  const verifyResetCodeMutation = useVerifyResetCodeMutation();
  const resetPasswordMutation = useResetPasswordMutation();

  // Timer effect for resending code
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Form 1: Email Request
  const emailForm = useForm({
    initialValues: { email: "" },
    validate: {
      email: validateEmail,
    },
  });

  // Form 2: Code Verification
  const codeForm = useForm({
    initialValues: { code: "" },
    validate: {
      code: (val) =>
        !val
          ? "Verification code is required"
          : val.length !== 6
          ? "Code must be exactly 6 digits"
          : !/^\d+$/.test(val)
          ? "Code must contain only numbers"
          : null,
    },
  });

  // Form 3: Password Update
  const passwordForm = useForm({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validate: {
      password: validatePassword,
      confirmPassword: (val, values) =>
        val !== values.password ? "Passwords do not match" : null,
    },
  });

  const handleRequestCode = async (values: { email: string }) => {
    try {
      await forgotPasswordMutation.mutateAsync({ email: values.email });
      setEmail(values.email);
      setResendTimer(60);
      setStep("code");
      notifications.show({
        title: "Code Sent",
        message: "We've sent a 6-digit verification code to your email.",
        color: "teal",
      });
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Failed to send reset code.", 500, "FORGOT_PASSWORD_FAILED");
      notifications.show({
        title: "Request Failed",
        message: apiError.message,
        color: "red",
      });
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    try {
      await forgotPasswordMutation.mutateAsync({ email });
      setResendTimer(60);
      notifications.show({
        title: "Code Resent",
        message: "A new verification code has been sent to your email.",
        color: "teal",
      });
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Failed to resend code.", 500, "FORGOT_PASSWORD_FAILED");
      notifications.show({
        title: "Resend Failed",
        message: apiError.message,
        color: "red",
      });
    }
  };

  const handleVerifyCode = async (values: { code: string }) => {
    try {
      await verifyResetCodeMutation.mutateAsync({ email, code: values.code });
      setCode(values.code);
      setStep("password");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Invalid or expired code.", 400, "VERIFY_RESET_CODE_FAILED");
      notifications.show({
        title: "Verification Failed",
        message: apiError.message,  
        color: "red",
      });
    }
  };

  const handleResetPassword = async (values: { password: string }) => {
    try {
      await resetPasswordMutation.mutateAsync({
        email,
        code,
        newPassword: values.password,
      });
      setStep("success");
      notifications.show({
        title: "Password Reset Successful",
        message: "Your password has been updated. You can now log in.",
        color: "teal",
      });
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Failed to reset password.", 400, "RESET_PASSWORD_FAILED");
      notifications.show({
        title: "Reset Failed",
        message: apiError.message,
        color: "red",
      });
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-[400px] bg-bg-card border border-border-primary rounded-2xl p-8 shadow-sm flex flex-col gap-6 transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center justify-center gap-1">
            PRESSFORGE
            <span className="text-instagram-pink font-extrabold">.AI</span>
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            {step === "email" && "Reset your password to access your account."}
            {step === "code" && "Verify your identity with the code sent to your email."}
            {step === "password" && "Create a secure new password for your account."}
            {step === "success" && "Your password has been successfully reset."}
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={emailForm.onSubmit(handleRequestCode)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="jane@example.com"
                  {...emailForm.getInputProps("email")}
                  className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
                />
              </div>
              {emailForm.errors.email ? (
                <p className="text-[11px] text-red-500 font-medium">{emailForm.errors.email}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm mt-2 cursor-pointer disabled:opacity-60"
            >
              <span>{forgotPasswordMutation.isPending ? "Sending Code..." : "Send Verification Code"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-1 text-xs text-text-secondary hover:text-instagram-pink transition mt-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Log In
            </Link>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={codeForm.onSubmit(handleVerifyCode)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-center">
              <label className="text-xs font-semibold text-text-secondary mb-1" htmlFor="code">
                Enter the 6-digit code sent to <strong className="text-text-primary">{email}</strong>
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                placeholder="••••••"
                {...codeForm.getInputProps("code")}
                className="w-full border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-3 text-lg font-mono text-center tracking-[0.5em] pl-[0.8em] focus:border-instagram-pink outline-none transition duration-150"
              />
              {codeForm.errors.code ? (
                <p className="text-[11px] text-red-500 font-medium mt-1">{codeForm.errors.code}</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={verifyResetCodeMutation.isPending}
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm mt-2 cursor-pointer disabled:opacity-60"
            >
              <span>{verifyResetCodeMutation.isPending ? "Verifying..." : "Verify Code"}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>

            <div className="text-center mt-2">
              {resendTimer > 0 ? (
                <p className="text-xs text-text-secondary">
                  Resend code in <span className="font-semibold">{formatTimer(resendTimer)}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={forgotPasswordMutation.isPending}
                  className="text-xs text-instagram-pink font-semibold hover:underline cursor-pointer disabled:opacity-50"
                >
                  Resend Verification Code
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep("email")}
              className="flex items-center justify-center gap-1 text-xs text-text-secondary hover:text-instagram-pink transition font-semibold mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Email
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={passwordForm.onSubmit(handleResetPassword)} className="flex flex-col gap-4">
            <PasswordInput
              id="password"
              label="New Password"
              placeholder="••••••••"
              {...passwordForm.getInputProps("password")}
              error={passwordForm.errors.password ? String(passwordForm.errors.password) : undefined}
            />

            <PasswordInput
              id="confirmPassword"
              label="Confirm New Password"
              placeholder="••••••••"
              {...passwordForm.getInputProps("confirmPassword")}
              error={passwordForm.errors.confirmPassword ? String(passwordForm.errors.confirmPassword) : undefined}
            />

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm mt-2 cursor-pointer disabled:opacity-60"
            >
              <span>{resetPasswordMutation.isPending ? "Resetting Password..." : "Reset Password"}</span>
              <KeyRound className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center text-teal-500">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-text-primary">All Set!</h3>
              <p className="text-xs text-text-secondary mt-1">
                Your password has been successfully updated.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm cursor-pointer"
            >
              <span>Log In to Your Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
