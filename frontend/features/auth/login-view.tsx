"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { useAppState } from "@/lib/queries/use-app-state";
import { INITIAL_STATE } from "@/lib/data/mock-data";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginAsClient } = useAppState({ enabled: false });

  const invitedClient =
    INITIAL_STATE.clients && INITIAL_STATE.clients.length > 0
      ? INITIAL_STATE.clients[0]
      : null;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const passParam = searchParams.get("password");
    const acceptParam = searchParams.get("acceptClientInvite");

    if (emailParam && passParam) {
      setFormData({
        email: decodeURIComponent(emailParam),
        password: decodeURIComponent(passParam),
      });

      if (acceptParam === "true") {
        void (async () => {
          const success = await loginAsClient(
            decodeURIComponent(emailParam),
            decodeURIComponent(passParam),
          );
          if (success) {
            alert("Invitation Accepted! Welcome to your Client Portal.");
            router.replace("/app");
          }
        })();
      }
    }
  }, [searchParams, loginAsClient, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      alert("Please fill out all required fields.");
      return;
    }

    setSubmitting(true);
    const success = await loginAsClient(formData.email, formData.password);
    setSubmitting(false);

    if (success) {
      router.replace("/app");
    } else {
      alert("Invalid email or password.");
    }
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
            Log in to manage your workspaces.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              required
              placeholder="jane@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
            />
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
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="border border-border-primary bg-bg-app text-text-primary rounded-xl px-3.5 py-2.5 text-sm focus:border-instagram-pink outline-none transition duration-150"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-tr from-[#F58529] to-[#DD2A7B] text-white py-3 rounded-full text-sm font-semibold hover:opacity-95 transition shadow-sm mt-3 cursor-pointer disabled:opacity-60"
          >
            <span>{submitting ? "Logging in..." : "Log In"}</span>
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
                setFormData({
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
                setFormData({
                  email: "jane@pressforge.ai",
                  password: "password123",
                })
              }
              className="text-[10px] text-instagram-pink font-semibold hover:underline text-left"
            >
              • Fill Individual Account (Alex)
            </button>
            {invitedClient ? (
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    email: invitedClient.email,
                    password: invitedClient.password,
                  })
                }
                className="text-[10px] text-instagram-pink font-semibold hover:underline text-left"
              >
                • Fill Client Portal Account ({invitedClient.name})
              </button>
            ) : (
              <p className="text-[9px] text-text-secondary italic">
                (No client invited yet. Invite a client in Settings to see
                client login options.)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
