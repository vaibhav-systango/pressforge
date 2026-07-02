"use client";

import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { ErrorMessage } from "@/components/common/error-message";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { useLoginMutation } from "@/lib/hooks/mutations/use-auth";
import { ApiError } from "@/lib/utils/api-errors";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLoginMutation();
  const [formError, setFormError] = useState("");

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => {
        if (!value.trim()) return "Email is required";
        return /^\S+@\S+\.\S+$/.test(value) ? null : "Enter a valid email address";
      },
      password: (value) => (!value ? "Password is required" : null),
    },
  });

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const passParam = searchParams.get("password");

    if (emailParam && passParam) {
      form.setValues({
        email: emailParam,
        password: passParam,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = form.onSubmit(async (values) => {
    setFormError("");
    try {
      const result = await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      });
      router.replace(getPostAuthRedirect(result.user));
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError("Invalid email or password.", 401, "UNAUTHORIZED");
      setFormError(apiError.message);
      notifications.show({
        title: "Login failed",
        message: apiError.message,
        color: "red",
      });
    }
  });

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-[400px] bg-bg-card border border-border-primary rounded-2xl p-8 shadow-sm flex flex-col gap-6 transition-colors duration-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center justify-center gap-1">
            PRESSFORGE
            <span className="text-instagram-pink font-extrabold">.AI</span>
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            Log in to manage your workspaces.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ErrorMessage message={formError} />

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-text-secondary"
              htmlFor="email"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="jane@example.com"
              {...form.getInputProps("email")}
              className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
            />
            {form.errors.email ? (
              <p className="text-[11px] text-red-500 font-medium">{form.errors.email}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-xs font-semibold text-text-secondary"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...form.getInputProps("password")}
              className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
            />
            {form.errors.password ? (
              <p className="text-[11px] text-red-500 font-medium">{form.errors.password}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm mt-3 cursor-pointer disabled:opacity-60"
          >
            <span>{loginMutation.isPending ? "Logging in..." : "Log In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-border-primary pt-4 text-center">
          <p className="text-xs text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-instagram-pink font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>

        <div className="bg-bg-app border border-border-primary rounded-xl p-3.5 text-left flex flex-col gap-2">
          <p className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-instagram-pink" /> Quick Demo
            Autocomplete
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() =>
                form.setValues({
                  email: "alex@pressforge.ai",
                  password: "password123",
                })
              }
              className="text-[10px] text-instagram-pink font-semibold hover:underline text-left"
            >
              • Fill Agency Account (Jane)
            </button>
            <button
              type="button"
              onClick={() =>
                form.setValues({
                  email: "jane@pressforge.ai",
                  password: "password123",
                })
              }
              className="text-[10px] text-instagram-pink font-semibold hover:underline text-left"
            >
              • Fill Individual Account (Alex)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
