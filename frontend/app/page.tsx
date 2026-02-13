"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  Star,
  Store,
  Truck,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { clearAuth, getMe, register, type AuthUser, login as loginUser } from "@/lib/auth";

type Language = "en" | "hi";
type ModalType = "login" | "vendor" | "supplier" | null;

type BaseAuthFormProps = {
  language: Language;
  title: string;
  subtitle: string;
  gradientClass: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  fields: Array<{ key: string; labelEn: string; labelHi: string; type?: string; required?: boolean }>;
  submitLabelEn: string;
  submitLabelHi: string;
};

function AuthModal({
  language,
  title,
  subtitle,
  gradientClass,
  onClose,
  onSubmit,
  fields,
  submitLabelEn,
  submitLabelHi,
}: BaseAuthFormProps) {
  const initialState = useMemo(() => {
    const s: Record<string, string> = {};
    for (const f of fields) s[f.key] = "";
    return s;
  }, [fields]);

  const [form, setForm] = useState<Record<string, string>>(initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    for (const field of fields) {
      if (field.required && !String(form[field.key] || "").trim()) {
        setError(
          language === "hi"
            ? `${field.labelHi} आवश्यक है`
            : `${field.labelEn} is required`
        );
        return;
      }
    }
    if (form.password && form.password.length < 6) {
      setError(
        language === "hi"
          ? "पासवर्ड कम से कम 6 अक्षर होना चाहिए"
          : "Password must be at least 6 characters"
      );
      return;
    }
    if (
      Object.prototype.hasOwnProperty.call(form, "confirmPassword") &&
      form.password !== form.confirmPassword
    ) {
      setError(language === "hi" ? "पासवर्ड मेल नहीं खाते" : "Passwords do not match");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(form);
      onClose();
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className={`p-6 text-white ${gradientClass}`}>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white transition-colors hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-center text-2xl font-bold">{title}</h2>
          <p className="mt-1 text-center text-sm text-white/90">{subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-6">
          {fields.map((field) => {
            const isPassword = field.type === "password";
            const isConfirm = field.key === "confirmPassword";
            const show = isPassword && (isConfirm ? showConfirmPassword : showPassword);
            return (
              <label key={field.key} className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-700">
                  {language === "hi" ? field.labelHi : field.labelEn}
                </span>
                <div className="relative">
                  {field.type === "email" ? (
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  ) : field.type === "password" ? (
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  ) : (
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  )}
                  <input
                    type={isPassword ? (show ? "text" : "password") : field.type || "text"}
                    value={form[field.key] || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-10 text-sm outline-none focus:border-indigo-500"
                  />
                  {isPassword ? (
                    <button
                      type="button"
                      onClick={() => (isConfirm ? setShowConfirmPassword((v) => !v) : setShowPassword((v) => !v))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  ) : null}
                </div>
              </label>
            );
          })}

          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-lg py-2 text-sm font-semibold text-white ${gradientClass} disabled:opacity-60`}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {language === "hi" ? "कृपया प्रतीक्षा करें..." : "Please wait..."}
              </span>
            ) : language === "hi" ? (
              submitLabelHi
            ) : (
              submitLabelEn
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [modal, setModal] = useState<ModalType>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    getMe()
      .then((me) => setUser(me))
      .catch(() => setUser(null));
  }, []);

  function logout() {
    clearAuth();
    setUser(null);
  }

  const features = [
    {
      icon: <Users className="h-5 w-5" />,
      title: language === "hi" ? "विश्वसनीय आपूर्तिकर्ता" : "Trusted Suppliers",
      description:
        language === "hi"
          ? "सत्यापित और विश्वसनीय आपूर्तिकर्ताओं से जुड़ें"
          : "Connect with verified and reliable suppliers",
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: language === "hi" ? "तेज़ डिलीवरी" : "Fast Delivery",
      description:
        language === "hi"
          ? "समय पर और कुशल डिलीवरी सेवाएं"
          : "Timely and efficient delivery services",
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: language === "hi" ? "गुणवत्ता आश्वासन" : "Quality Assurance",
      description:
        language === "hi"
          ? "उच्च गुणवत्ता वाले उत्पादों की गारंटी"
          : "Guaranteed high-quality products",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-zinc-900">
      <header className="relative z-20 bg-white/85 py-4 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4">
          <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
            Ventrest
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm"
            >
              <Globe className="h-4 w-4" />
              {language === "hi" ? "भाषा" : "Language"}
            </button>
            {user ? (
              <>
                <Link
                  href={user.role === "supplier" ? "/supplier" : "/buyer"}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm"
                >
                  {language === "hi" ? "डैशबोर्ड" : "Dashboard"}
                </Link>
                <button
                  onClick={logout}
                  className="rounded-md border border-red-300 bg-white px-3 py-1 text-sm text-red-700"
                >
                  {language === "hi" ? "लॉगआउट" : "Logout"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-6">
          <h2 className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-5xl font-black text-transparent md:text-6xl">
            {language === "hi" ? "वेंटरेस्ट" : "Ventrest"}
          </h2>
          <p className="mt-3 text-xl font-bold md:text-2xl">
            {language === "hi" ? "सड़क भोजन में नई क्रांति!" : "Street Food Revolution!"}
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-base text-zinc-600 md:text-lg">
            {language === "hi"
              ? "सड़क भोजन व्यवसायों को विश्वसनीय आपूर्तिकर्ताओं से जोड़ने वाला एक अभिनव मंच"
              : "An innovative platform connecting street food businesses with trusted suppliers"}
          </p>
        </div>

        <div className="mb-6 grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 text-xl font-bold">
              {language === "hi" ? "स्ट्रीट फूड वेंडर" : "Street Food Vendor"}
            </h3>
            <p className="mb-4 text-sm text-zinc-600">
              {language === "hi"
                ? "अपने व्यवसाय को बढ़ाएं और गुणवत्तापूर्ण आपूर्तिकर्ताओं से जुड़ें"
                : "Grow your business and connect with quality suppliers"}
            </p>
            <button
              onClick={() => setModal("vendor")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-base font-semibold text-white"
            >
              {language === "hi" ? "वेंडर पंजीकरण" : "Vendor Registration"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600">
              <Store className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-3 text-xl font-bold">{language === "hi" ? "आपूर्तिकर्ता" : "Supplier"}</h3>
            <p className="mb-4 text-sm text-zinc-600">
              {language === "hi"
                ? "अपने उत्पादों को नए ग्राहकों तक पहुंचाएं और बिक्री बढ़ाएं"
                : "Reach new customers and increase sales with your products"}
            </p>
            <button
              onClick={() => setModal("supplier")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-base font-semibold text-white"
            >
              {language === "hi" ? "आपूर्तिकर्ता पंजीकरण" : "Supplier Registration"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!user ? (
          <div className="mb-8 rounded-2xl border border-white/20 bg-white/80 p-5 shadow-lg backdrop-blur-sm">
            <p className="mb-3 text-sm text-zinc-700">
              {language === "hi" ? "पहले से ही खाता है?" : "Already have an account?"}
            </p>
            <button
              onClick={() => setModal("login")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 text-sm font-semibold text-white"
            >
              <CheckCircle className="h-4 w-4" />
              {language === "hi" ? "यहाँ लॉगिन करें" : "Login Here"}
            </button>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-white/20 bg-white/80 p-5 shadow-lg backdrop-blur-sm">
            <p className="mb-3 text-sm text-zinc-700">
              {language === "hi" ? "स्वागत है" : "Welcome"}, {user.name}
            </p>
            <Link
              href={user.role === "supplier" ? "/supplier" : "/buyer"}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-2 text-sm font-semibold text-white"
            >
              {language === "hi" ? "डैशबोर्ड खोलें" : "Open Dashboard"}
            </Link>
          </div>
        )}

        <div className="w-full max-w-5xl">
          <h3 className="mb-5 text-2xl font-bold">
            {language === "hi" ? "क्यों वेंटरेस्ट चुनें?" : "Why Choose Ventrest?"}
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature, i) => (
              <div key={i} className="rounded-xl border border-white/20 bg-white/70 p-4 text-left">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  {feature.icon}
                </div>
                <h4 className="mb-1 text-lg font-semibold">{feature.title}</h4>
                <p className="text-sm text-zinc-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {modal === "login" ? (
        <AuthModal
          language={language}
          title={language === "hi" ? "लॉग इन करें" : "Login"}
          subtitle={
            language === "hi" ? "अपने खाते में लॉगिन करें" : "Sign in to your account"
          }
          gradientClass="bg-gradient-to-r from-purple-500 to-purple-600"
          onClose={() => setModal(null)}
          fields={[
            { key: "email", labelEn: "Email", labelHi: "ईमेल", type: "email", required: true },
            {
              key: "password",
              labelEn: "Password",
              labelHi: "पासवर्ड",
              type: "password",
              required: true,
            },
          ]}
          submitLabelEn="Login"
          submitLabelHi="लॉगिन करें"
          onSubmit={async (values) => {
            await loginUser(values.email, values.password);
          }}
        />
      ) : null}

      {modal === "vendor" ? (
        <AuthModal
          language={language}
          title={language === "hi" ? "वेंडर पंजीकरण" : "Vendor Registration"}
          subtitle={
            language === "hi" ? "अपना स्ट्रीट फूड व्यवसाय शुरू करें" : "Start your street food business"
          }
          gradientClass="bg-gradient-to-r from-blue-500 to-blue-600"
          onClose={() => setModal(null)}
          fields={[
            { key: "name", labelEn: "Full Name", labelHi: "पूरा नाम", required: true },
            { key: "email", labelEn: "Email", labelHi: "ईमेल", type: "email", required: true },
            { key: "phone", labelEn: "Phone Number", labelHi: "फोन नंबर", required: true },
            {
              key: "password",
              labelEn: "Password",
              labelHi: "पासवर्ड",
              type: "password",
              required: true,
            },
            {
              key: "confirmPassword",
              labelEn: "Confirm Password",
              labelHi: "पासवर्ड की पुष्टि करें",
              type: "password",
              required: true,
            },
          ]}
          submitLabelEn="Register"
          submitLabelHi="पंजीकरण करें"
          onSubmit={async (values) => {
            await register({
              name: values.name,
              email: values.email,
              password: values.password,
              role: "buyer",
              phone: values.phone,
            });
          }}
        />
      ) : null}

      {modal === "supplier" ? (
        <AuthModal
          language={language}
          title={language === "hi" ? "आपूर्तिकर्ता पंजीकरण" : "Supplier Registration"}
          subtitle={
            language === "hi" ? "अपने उत्पादों को बेचना शुरू करें" : "Start selling your products"
          }
          gradientClass="bg-gradient-to-r from-green-500 to-green-600"
          onClose={() => setModal(null)}
          fields={[
            { key: "name", labelEn: "Full Name", labelHi: "पूरा नाम", required: true },
            { key: "email", labelEn: "Email", labelHi: "ईमेल", type: "email", required: true },
            {
              key: "businessName",
              labelEn: "Business Name",
              labelHi: "व्यवसाय का नाम",
              required: true,
            },
            { key: "gstin", labelEn: "GSTIN", labelHi: "GSTIN", required: true },
            { key: "phone", labelEn: "Phone Number", labelHi: "फोन नंबर", required: true },
            {
              key: "password",
              labelEn: "Password",
              labelHi: "पासवर्ड",
              type: "password",
              required: true,
            },
            {
              key: "confirmPassword",
              labelEn: "Confirm Password",
              labelHi: "पासवर्ड की पुष्टि करें",
              type: "password",
              required: true,
            },
          ]}
          submitLabelEn="Register"
          submitLabelHi="पंजीकरण करें"
          onSubmit={async (values) => {
            await register({
              name: values.name,
              email: values.email,
              password: values.password,
              role: "supplier",
              phone: values.phone,
              businessName: values.businessName,
              gstin: values.gstin,
            });
          }}
        />
      ) : null}
    </div>
  );
}
