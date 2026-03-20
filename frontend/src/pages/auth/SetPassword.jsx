import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function SetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            toast.error("Invalid link. No token found.");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const res = await authApi.setPassword({ token, password });
            toast.success(res.data.message || "Password set successfully");
            setSuccess(true);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to set password");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg text-center">
                    <h2 className="text-xl font-bold text-destructive">Invalid Link</h2>
                    <p className="text-sm text-muted-foreground">
                        This link is invalid or has expired. Please contact your administrator.
                    </p>
                    <Link to="/login">
                        <Button variant="outline" className="mt-4">Go to Login</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
                <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                    <h2 className="text-xl font-bold">Password Set Successfully</h2>
                    <p className="text-sm text-muted-foreground">
                        You can now sign in with your email and password.
                    </p>
                    <Button onClick={() => navigate("/login")} className="w-full">
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-2xl font-bold tracking-tight">Set Your Password</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Create a password for your Echo Manager portal account.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Password</Label>
                        <div className="relative">
                            <Input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Confirm Password</Label>
                        <Input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter your password"
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Set Password
                    </Button>
                </form>
            </div>
        </div>
    );
}
