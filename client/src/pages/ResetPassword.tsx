import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LockIcon, ArrowRightIcon, CheckCircleIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function ResetPassword() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            await api.post(`/api/auth/reset-password/${token}`, { password });
            setDone(true);
        } catch (error: any) {
            toast.error(error.response?.data?.message || error?.message || "Reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm p-8">

                    <div className="flex flex-col items-center mb-8">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo.svg" alt="Logo" className="size-6.5" />
                            <h1 className="text-2xl">Scheduler</h1>
                        </Link>
                        <p className="text-slate-500 text-sm mt-1">
                            {done ? "Password updated" : "Set a new password"}
                        </p>
                    </div>

                    {done ? (
                        <div className="text-center space-y-5">
                            <div className="size-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircleIcon className="size-7 text-green-500" />
                            </div>
                            <p className="text-slate-700 text-sm">
                                Your password has been updated. You can now sign in with your new password.
                            </p>
                            <button
                                onClick={() => navigate("/login")}
                                className="w-full py-2.5 px-4 bg-linear-to-r from-red-600 to-red-500 text-white rounded-full text-sm flex items-center justify-center gap-2"
                            >
                                Go to Sign In <ArrowRightIcon className="size-4" />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
                            <div>
                                <label className="block mb-1.5">New password</label>
                                <div className="relative">
                                    <LockIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Min. 6 characters"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 outline-slate-300 border border-slate-200 rounded-full"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-1.5">Confirm new password</label>
                                <div className="relative">
                                    <LockIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        placeholder="Repeat your password"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 outline-slate-300 border border-slate-200 rounded-full"
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 px-4 bg-linear-to-r from-red-600 to-red-500 text-white rounded-full text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {loading ? "Updating..." : <>Update password <ArrowRightIcon className="size-4" /></>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
