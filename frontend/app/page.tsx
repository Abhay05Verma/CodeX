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
import { api } from "@/lib/api";
import { getMe, getStoredToken, register, type AuthUser, login as loginUser } from "@/lib/auth";

type Language = "en" | "hi";
type ModalType = "login" | "vendor" | "supplier" | "customer" | null;
type LoginAsRole = "vendor" | "supplier"; // for UX only; backend returns actual role

type BaseAuthFormProps = {
  language: Language;
  title: string;
  subtitle: string;
  gradientClass: string;
  onClose: () => void;
  onSubmit: (values: Record<string, string>) => Promise<AuthUser | void>;
  fields: Array<{ key: string; labelEn: string; labelHi: string; type?: string; required?: boolean }>;
  submitLabelEn: string;
  submitLabelHi: string;
  /** If set, show "Sign in as Vendor / Supplier" choice in the form (login only) */
  loginAsOptions?: { value: LoginAsRole; labelEn: string; labelHi: string }[];
  loginAs?: LoginAsRole;
  onLoginAsChange?: (value: LoginAsRole) => void;
  /** Test credentials for login: show labels and "Use" buttons to fill form */
  testCredentials?: { label: string; email: string; password: string }[];
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
  loginAsOptions,
  loginAs = "vendor",
  onLoginAsChange,
  testCredentials,
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
      const user = await onSubmit(form);
      onClose();
      if (user) {
        if (user.role === "supplier") window.location.href = "/supplier";
        else if (user.role === "customer") window.location.href = "/customer";
        else window.location.href = "/buyer";
      } else {
        window.location.href = "/";
      }
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
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className={`flex-shrink-0 p-6 text-white ${gradientClass}`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-white/90 transition-colors hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <h2 className="text-center text-2xl font-bold">{title}</h2>
          <p className="mt-2 text-center text-sm text-white/90">{subtitle}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          {testCredentials && testCredentials.length > 0 && fields.some((f) => f.key === "email" && fields.some((p) => p.key === "password")) ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
                {language === "hi" ? "टेस्ट लॉगिन" : "Test credentials"}
              </p>
              <div className="flex flex-wrap gap-2">
                {testCredentials.map((cred) => (
                  <button
                    key={cred.email}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, email: cred.email, password: cred.password }));
                      setError(null);
                    }}
                    className="rounded bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
                  >
                    {cred.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {loginAsOptions && onLoginAsChange ? (
            <div className="space-y-2">
              <span className="block text-sm font-medium text-gray-700">
                {language === "hi" ? "लॉग इन करें जैसे" : "Sign in as"}
              </span>
              <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
                {loginAsOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onLoginAsChange(opt.value)}
                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                      loginAs === opt.value
                        ? "bg-white text-indigo-600 shadow"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {language === "hi" ? opt.labelHi : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {fields.map((field) => {
            const isPassword = field.type === "password";
            const isConfirm = field.key === "confirmPassword";
            const show = isPassword && (isConfirm ? showConfirmPassword : showPassword);
            return (
              <label key={field.key} className="block">
                <span className="mb-2 block text-sm font-medium text-gray-700">
                  {language === "hi" ? field.labelHi : field.labelEn}
                </span>
                <div className="relative">
                  {field.type === "email" ? (
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  ) : field.type === "password" ? (
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  ) : (
                    <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  )}
                  <input
                    type={isPassword ? (show ? "text" : "password") : field.type || "text"}
                    value={form[field.key] || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-10 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-lg py-3 text-base font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 hover:scale-[1.02] ${gradientClass}`}
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

type LoginContext = "vendor_supplier" | "customer";

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("en");
  const [modal, setModal] = useState<ModalType>(null);
  const [loginAs, setLoginAs] = useState<LoginAsRole>("vendor");
  const [loginContext, setLoginContext] = useState<LoginContext | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    getMe()
      .then((me) => setUser(me))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user?.role !== "supplier") {
      setNotificationCount(0);
      return;
    }
    const token = getStoredToken();
    if (!token) return;
    api
      .getSupplierOrders(token)
      .then((data) => {
        const pending = (data?.orders ?? []).filter((o) => o.status === "pending");
        setNotificationCount(pending.length);
      })
      .catch(() => setNotificationCount(0));
  }, [user?.role]);

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-900">
      <div className="absolute inset-0 bg-grid-pattern opacity-30" aria-hidden />
      <header className="relative z-20 bg-white/90 py-4 shadow-lg backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
            Ventrest
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage((l) => (l === "en" ? "hi" : "en"))}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-300 hover:text-indigo-600"
            >
              <Globe className="h-4 w-4" />
              {language === "hi" ? "भाषा" : "Language"}
            </button>
            {user ? (
              <Link
                href={
                  user.role === "supplier"
                    ? "/supplier"
                    : user.role === "customer"
                      ? "/customer"
                      : "/buyer"
                }
                className="relative inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-indigo-700"
              >
                {language === "hi" ? "डैशबोर्ड" : "Dashboard"}
                {user.role === "supplier" && notificationCount > 0 ? (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                ) : null}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-6xl flex-col items-center justify-center px-6 py-10 text-center">
        <div className="mb-6">
          <h2 className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-5xl font-black text-transparent md:text-6xl">
            {language === "hi" ? "वेंटरेस्ट" : "Ventrest"}
          </h2>
          <p className="mt-4 text-xl font-bold text-gray-800 md:text-2xl">
            {language === "hi" ? "सड़क भोजन में नई क्रांति!" : "Street Food Revolution!"}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
            {language === "hi"
              ? "सड़क भोजन व्यवसायों को विश्वसनीय आपूर्तिकर्ताओं से जोड़ने वाला एक अभिनव मंच"
              : "An innovative platform connecting street food businesses with trusted suppliers"}
          </p>
        </div>

        <div className="mb-6 flex w-full max-w-4xl flex-col gap-4 md:flex-row">
          <div className="group flex-1">
            <div className="flex h-full flex-col rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 transition-transform duration-300 group-hover:scale-110">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-800">
                {language === "hi" ? "स्ट्रीट फूड वेंडर" : "Street Food Vendor"}
              </h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
                {language === "hi"
                  ? "अपने व्यवसाय को बढ़ाएं और गुणवत्तापूर्ण आपूर्तिकर्ताओं से जुड़ें"
                  : "Grow your business and connect with quality suppliers"}
              </p>
              <button
                type="button"
                onClick={() => setModal("vendor")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-blue-600 hover:to-blue-700"
              >
                {language === "hi" ? "वेंडर पंजीकरण" : "Vendor Registration"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="group flex-1">
            <div className="flex h-full flex-col rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 transition-transform duration-300 group-hover:scale-110">
                <Store className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-800">
                {language === "hi" ? "आपूर्तिकर्ता" : "Supplier"}
              </h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
                {language === "hi"
                  ? "अपने उत्पादों को नए ग्राहकों तक पहुंचाएं और बिक्री बढ़ाएं"
                  : "Reach new customers and increase sales with your products"}
              </p>
              <button
                type="button"
                onClick={() => setModal("supplier")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-green-600 hover:to-green-700"
              >
                {language === "hi" ? "आपूर्तिकर्ता पंजीकरण" : "Supplier Registration"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="group flex-1">
            <div className="flex h-full flex-col rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 transition-transform duration-300 group-hover:scale-110">
                <User className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-3 text-xl font-bold text-gray-800">
                {language === "hi" ? "ग्राहक" : "I'm a Customer"}
              </h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-600">
                {language === "hi"
                  ? "वेंडर्स से खरीदें, फेवरेट्स और कार्ट का उपयोग करें"
                  : "Shop from vendors, use favorites and cart"}
              </p>
              <button
                type="button"
                onClick={() => setModal("customer")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-3 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-amber-600 hover:to-orange-700"
              >
                {language === "hi" ? "ग्राहक पंजीकरण" : "Customer Sign up"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {!user ? (
          <div className="mb-8 max-w-md rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
            <p className="mb-3 text-base text-gray-700">
              {language === "hi" ? "पहले से ही खाता है?" : "Already have an account?"}
            </p>
            <button
              type="button"
              onClick={() => setModal("login")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-indigo-600 hover:to-purple-600"
            >
              <CheckCircle className="h-4 w-4" />
              {language === "hi" ? "यहाँ लॉगिन करें" : "Login Here"}
            </button>
          </div>
        ) : null}

        {user ? (
          <div className="mb-8 max-w-md rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
            <p className="mb-3 text-base text-gray-700">
              {language === "hi" ? "स्वागत है" : "Welcome"}, {user.name}
            </p>
            <Link
              href={
                user.role === "supplier"
                  ? "/supplier"
                  : user.role === "customer"
                    ? "/customer"
                    : "/buyer"
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-indigo-600 hover:to-purple-600"
            >
              {language === "hi" ? "डैशबोर्ड खोलें" : "Open Dashboard"}
            </Link>
          </div>
        ) : null}

        <div className="w-full max-w-5xl">
          <h3 className="mb-6 text-2xl font-bold text-gray-800">
            {language === "hi" ? "क्यों वेंटरेस्ट चुनें?" : "Why Choose Ventrest?"}
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/20 bg-white/60 p-4 text-left backdrop-blur-sm transition-all duration-300 hover:bg-white/80"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  {feature.icon}
                </div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.description}</p>
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
            loginContext === "vendor_supplier"
              ? language === "hi"
                ? "वेंडर या आपूर्तिकर्ता के रूप में साइन इन करें"
                : "Sign in as vendor or supplier"
              : language === "hi"
                ? "अपने खाते में साइन इन करें"
                : "Sign in to your account"
          }
          gradientClass="bg-gradient-to-r from-indigo-500 to-purple-600"
          onClose={() => { setModal(null); setLoginContext(null); }}
          loginAsOptions={
            loginContext === "vendor_supplier"
              ? [
                  { value: "vendor", labelEn: "Vendor (street food)", labelHi: "वेंडर (स्ट्रीट फूड)" },
                  { value: "supplier", labelEn: "Supplier", labelHi: "आपूर्तिकर्ता" },
                ]
              : undefined
          }
          loginAs={loginAs}
          onLoginAsChange={setLoginAs}
          testCredentials={[
            { label: "Customer", email: "customer@test.com", password: "customer123" },
            { label: "Vendor", email: "vendor@test.com", password: "vendor123" },
            { label: "Supplier", email: "supplier@test.com", password: "supplier123" },
          ]}
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
            return loginUser(values.email, values.password);
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
            return register({
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
            return register({
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

      {modal === "customer" ? (
        <AuthModal
          language={language}
          title={language === "hi" ? "ग्राहक पंजीकरण" : "Customer Sign up"}
          subtitle={
            language === "hi" ? "वेंडर्स से खरीदारी शुरू करें" : "Start shopping from vendors"
          }
          gradientClass="bg-gradient-to-r from-amber-500 to-orange-600"
          onClose={() => setModal(null)}
          fields={[
            { key: "name", labelEn: "Full Name", labelHi: "पूरा नाम", required: true },
            { key: "email", labelEn: "Email", labelHi: "ईमेल", type: "email", required: true },
            { key: "phone", labelEn: "Phone Number", labelHi: "फोन नंबर", required: false },
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
            return register({
              name: values.name,
              email: values.email,
              password: values.password,
              role: "customer",
              phone: values.phone || undefined,
            });
          }}
        />
      ) : null}
    </div>
  );
}
