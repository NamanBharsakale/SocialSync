import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { MailIcon, LockIcon, ArrowRightIcon, User2Icon, ArrowLeftIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../api/axios";

type View = "login" | "register" | "forgot";

export default function Login() {
    const [view, setView] = useState<View>("login");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // forgot-password state
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSent, setForgotSent] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const { login, user, isLoading } = useAuth();

    // All hooks must be called before any early return (Rules of Hooks)
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const id = setInterval(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearInterval(id);
    }, [resendCooldown]);

    if (!isLoading && user) return <Navigate to="/dashboard" replace />;

    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const endpoint = view === "login" ? "login" : "register";
            const { data } = await api.post(`/api/auth/${endpoint}`, { name, email, password });
            login(data, data.token);
        } catch (error: any) {
            const msg = error.response?.data?.message || error?.message;
            toast.error(msg);
            if (view === "register" && msg === "User already exists") {
                setView("login");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/api/auth/forgot-password", { email: forgotEmail });
            setForgotSent(true);
            setResendCooldown(60);
        } catch (error: any) {
            const msg = error.response?.data?.message || error?.message;
            // 429 means already sent recently — treat same as success to avoid leaking info
            if (error.response?.status === 429) {
                toast.error(msg);
            } else {
                toast.error(msg || "Failed to send reset email");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setLoading(true);
        try {
            await api.post("/api/auth/forgot-password", { email: forgotEmail });
            setResendCooldown(60);
            toast.success("Reset link resent!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || error?.message || "Failed to resend");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm p-8">

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo.svg" alt="Logo" className="size-6.5" />
                            <h1 className="text-2xl">Scheduler</h1>
                        </Link>
                        <p className="text-slate-500 text-sm mt-1">
                            {view === "forgot" ? "Reset your password" : "Sign in to your Dashboard"}
                        </p>
                    </div>

                    {/* ── Forgot password ── */}
                    {view === "forgot" && (
                        <>
                            {!forgotSent ? (
                                <form onSubmit={handleForgotSubmit} className="space-y-5 text-sm">
                                    <div>
                                        <label className="block mb-1.5">Email address</label>
                                        <div className="relative">
                                            <MailIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="email"
                                                required
                                                placeholder="you@company.com"
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 outline-slate-300 border border-slate-200 rounded-full"
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-2.5 px-4 bg-linear-to-r from-red-600 to-red-500 text-white rounded-full text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {loading ? "Sending..." : <>Send reset link <ArrowRightIcon className="size-4" /></>}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setView("login")}
                                        className="w-full flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm"
                                    >
                                        <ArrowLeftIcon className="size-3.5" /> Back to Sign In
                                    </button>
                                </form>
                            ) : (
                                /* ── Success / resend state ── */
                                <div className="text-center space-y-5 text-sm">
                                    <div className="size-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                        <MailIcon className="size-6 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-slate-800 font-medium">Check your inbox</p>
                                        <p className="text-slate-500 mt-1">
                                            We sent a reset link to <span className="font-medium text-slate-700">{forgotEmail}</span>.
                                            It expires in 1 hour.
                                        </p>
                                    </div>

                                    {/* ── Resend link ── */}
                                    <div className="text-slate-500">
                                        Didn't get it?{" "}
                                        {resendCooldown > 0 ? (
                                            <span className="text-slate-400">
                                                Resend in {resendCooldown}s
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResend}
                                                disabled={loading}
                                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                                            >
                                                Resend email
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => { setView("login"); setForgotSent(false); }}
                                        className="flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-700 mx-auto"
                                    >
                                        <ArrowLeftIcon className="size-3.5" /> Back to Sign In
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Login / Register ── */}
                    {view !== "forgot" && (
                        <form onSubmit={handleAuthSubmit} className="space-y-5 text-sm">
                            {view === "register" && (
                                <div>
                                    <label className="block mb-1.5">Name</label>
                                    <div className="relative">
                                        <User2Icon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            required
                                            placeholder="Enter your name"
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 outline-slate-300 border border-slate-200 rounded-full"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block mb-1.5">Email</label>
                                <div className="relative">
                                    <MailIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="you@company.com"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 outline-slate-300 border border-slate-200 rounded-full"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label>Password</label>
                                    {view === "login" && (
                                        <button
                                            type="button"
                                            onClick={() => { setForgotEmail(email); setView("forgot"); }}
                                            className="text-red-500 hover:text-red-600 text-xs"
                                        >
                                            Forgot password?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <LockIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="********"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 outline-slate-300 border border-slate-200 rounded-full"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 px-4 bg-linear-to-r from-red-600 to-red-500 text-white rounded-full text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? "Signing in..." : <>{view === "login" ? "Sign In" : "Sign Up"} <ArrowRightIcon className="size-4" /></>}
                            </button>
                        </form>
                    )}

                    {/* ── Toggle login / register ── */}
                    {view !== "forgot" && (
                        <div className="mt-6 text-center text-sm text-slate-500">
                            {view === "login" ? (
                                <>
                                    Don't have an account?{" "}
                                    <button onClick={() => setView("register")} className="text-red-600 hover:text-red-700">
                                        Create one free
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{" "}
                                    <button onClick={() => setView("login")} className="text-red-600 hover:text-red-700">
                                        Sign In
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
