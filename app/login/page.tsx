"use client";

import { LoginSection } from "@/sections/auth/login-section";

/** Pages stay thin wrappers: routing here, everything else in the section. */
export default function LoginPage() {
  return <LoginSection />;
}
