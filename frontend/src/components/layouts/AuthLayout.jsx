import { Outlet, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun, FolderKanban, Users, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuroraBackground from "@/components/auth/AuroraBackground";

export default function AuthLayout() {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const isLogin = location.pathname === "/login";
    const isDark = theme === "dark";

    const formContent = (
        <div className="auth-mobile-dark w-full max-w-sm">
            <Outlet />
        </div>
    );

    return (
        <div className={`relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 md:p-8 ${isDark ? "bg-[#08060e]" : "bg-muted/40"}`}>
            <AuroraBackground />

            {/* Theme toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="absolute top-4 right-4 z-20 text-white/60 hover:text-white md:text-muted-foreground md:hover:text-foreground"
            >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Single responsive wrapper */}
            <div className="relative z-10 flex w-full max-w-sm flex-col items-center px-4 md:max-w-[1000px] md:flex-row md:overflow-hidden md:rounded-2xl md:border md:border-border md:bg-card/80 md:p-0 md:shadow-2xl md:backdrop-blur-sm">

                {/* ── Mobile branding (above form, no card) ── */}
                <div className="flex flex-col items-center md:hidden">
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-md ${isDark ? "border-white/15 bg-white/[0.07]" : "border-border bg-muted"}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-7 w-7 ${isDark ? "text-purple-400" : "text-primary"}`}>
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className={`mb-1 text-xs font-medium tracking-widest uppercase ${isDark ? "text-white/40" : "text-muted-foreground/80"}`}>
                        Echo Manager
                    </span>
                    <h1 className={`mb-1 text-xl font-bold ${isDark ? "text-white" : "text-foreground"}`}>
                        {isLogin ? "Welcome Back" : "Reset Password"}
                    </h1>
                    <p className={`mb-8 text-center text-sm leading-relaxed ${isDark ? "text-white/50" : "text-muted-foreground/90"}`}>
                        {isLogin
                            ? "Sign in to continue to your workspace."
                            : "Follow the steps to recover your account."}
                    </p>
                </div>

                {/* ── Desktop left panel ── */}
                <div className="relative hidden w-[45%] flex-col items-center justify-end self-stretch overflow-hidden md:flex">
                    <div className="absolute inset-0 bg-[#111118]" />
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/80 via-purple-500/40 to-[#111118]" />
                        <div className="absolute -top-20 left-1/2 h-[400px] w-[500px] -translate-x-1/2 rounded-full bg-purple-500/60 blur-[100px]" />
                        <div className="absolute top-10 left-1/4 h-[300px] w-[300px] rounded-full bg-violet-400/30 blur-[80px]" />
                        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-fuchsia-500/20 blur-[90px]" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center px-8 pb-10 text-center">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-white">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold text-white">Echo Manager</span>
                        </div>

                        <h1 className="text-2xl font-bold text-white">
                            {isLogin ? "Welcome Back" : "Get Started with Us"}
                        </h1>
                        <p className="mt-2 text-sm leading-relaxed text-white/60">
                            {isLogin
                                ? "Your projects, teams, and tasks — all in one place."
                                : "Complete these steps to recover your account."}
                        </p>

                        <div className="mt-8 w-full max-w-[280px] space-y-3">
                            <FeatureItem icon={<FolderKanban className="h-4 w-4" />} title="Projects & Tasks" desc="Track progress from kickoff to delivery" />
                            <FeatureItem icon={<Users className="h-4 w-4" />} title="Team Management" desc="Organize employees, roles & attendance" />
                            <FeatureItem icon={<ClipboardCheck className="h-4 w-4" />} title="Clients & Invoices" desc="Manage clients and billing seamlessly" />
                        </div>
                    </div>
                </div>

                {/* ── Form area (shared: mobile + desktop) ── */}
                <div className="flex w-full flex-col items-center md:w-[55%] md:px-12 md:py-14">
                    {/* Mobile: frosted glass card wrapping the form */}
                    <div className={`w-full rounded-2xl border p-6 backdrop-blur-md shadow-lg md:rounded-none md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none md:shadow-none ${isDark ? "border-white/[0.08] bg-white/[0.05]" : "border-border bg-card"}`}>
                        {formContent}
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureItem({ icon, title, desc }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    
    return (
        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-left ${isDark ? "bg-white/[0.06]" : "bg-muted"}`}>
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-white/10 text-white/70" : "bg-primary/10 text-primary"}`}>
                {icon}
            </span>
            <div className="min-w-0">
                <p className={`text-sm font-medium ${isDark ? "text-white/90" : "text-foreground"}`}>{title}</p>
                <p className={`text-xs leading-relaxed ${isDark ? "text-white/40" : "text-muted-foreground"}`}>{desc}</p>
            </div>
        </div>
    );
}
