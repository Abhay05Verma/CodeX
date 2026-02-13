"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { login } from "@/lib/auth";

const TEST_CREDENTIALS = [
  { label: "Customer", email: "customer@test.com", password: "customer123" },
  { label: "Customer 2", email: "customer2@test.com", password: "customer123" },
  { label: "Vendor (Buyer)", email: "vendor@test.com", password: "vendor123" },
  { label: "Supplier", email: "supplier@test.com", password: "supplier123" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function fillTest(cred: (typeof TEST_CREDENTIALS)[0]) {
    setEmail(cred.email);
    setPassword(cred.password);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="mt-1 text-sm text-zinc-600">Use your CodeX account credentials.</p>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Test credentials
          </p>
          <p className="mb-2 text-[11px] text-amber-700">
            If login fails, run in backend: <code className="rounded bg-amber-100 px-1">node scripts/seed-test-users.js</code>
          </p>
          <ul className="space-y-1.5 text-sm text-zinc-700">
            {TEST_CREDENTIALS.map((cred) => (
              <li key={cred.email} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-zinc-800">{cred.label}:</span>
                <span className="text-zinc-600">{cred.email} / {cred.password}</span>
                <button
                  type="button"
                  onClick={() => fillTest(cred)}
                  className="rounded bg-zinc-800 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700"
                >
                  Use
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-1 text-sm">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
              placeholder="Enter password"
              required
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-600">
          Back to dashboard:{" "}
          <Link href="/" className="font-medium text-zinc-900 underline">
            Home
          </Link>
        </p>
      </div>
    </main>
  );
}
