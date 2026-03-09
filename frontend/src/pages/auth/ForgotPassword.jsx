import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Loader2,
    ArrowLeft,
    Mail,
    ShieldCheck,
    Eye,
    EyeOff,
    CheckCircle2,
} from "lucide-react";

// --- Step 1: Email ---
const emailSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
});

// --- Step 3: New password ---
const passwordSchema = z
    .object({
        password: z
            .string()
            .min(6, { message: "Password must be at least 6 characters" }),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

// --- OTP Input Component ---
function OTPInput({ length = 6, onComplete }) {
    const [values, setValues] = useState(Array(length).fill(""));
    const inputsRef = useRef([]);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    const fillFrom = (index, digits) => {
        const next = [...values];
        for (let i = 0; i < digits.length && index + i < length; i++) {
            next[index + i] = digits[i];
        }
        setValues(next);
        const focusIndex = Math.min(index + digits.length, length - 1);
        inputsRef.current[focusIndex]?.focus();
        if (next.every((v) => v !== "")) {
            onComplete(next.join(""));
        }
    };

    const handleChange = (index, val) => {
        const digits = val.replace(/\D/g, "");
        if (!digits && val !== "") return;

        // Multi-character input (paste via onChange or autocomplete)
        if (digits.length > 1) {
            fillFrom(index, digits.slice(0, length - index));
            return;
        }

        // Single digit or clear
        const next = [...values];
        next[index] = digits;
        setValues(next);

        if (digits && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }

        if (next.every((v) => v !== "")) {
            onComplete(next.join(""));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !values[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
        if (!pasted) return;
        fillFrom(0, pasted);
    };

    return (
        <div className="flex justify-center gap-2">
            {values.map((val, i) => (
                <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={val}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className="h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
            ))}
        </div>
    );
}

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=email, 2=otp, 3=password, 4=success
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const emailForm = useForm({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    });

    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    // Step 1: Send OTP
    const handleSendOTP = async (values) => {
        setLoading(true);
        try {
            await authApi.forgotPassword(values);
            setEmail(values.email);
            setStep(2);
            toast.success("OTP sent to your email!");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to send OTP"
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (otp) => {
        setLoading(true);
        try {
            const res = await authApi.verifyOTP({ email, otp });
            setResetToken(res.data.resetToken);
            setStep(3);
            toast.success("OTP verified!");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Invalid OTP"
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset password
    const handleResetPassword = async (values) => {
        setLoading(true);
        try {
            await authApi.resetPassword({
                resetToken,
                password: values.password,
            });
            setStep(4);
            toast.success("Password reset successfully!");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to reset password"
            );
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setLoading(true);
        try {
            await authApi.forgotPassword({ email });
            toast.success("New OTP sent to your email!");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Failed to resend OTP"
            );
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Success
    if (step === 4) {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                        Password reset successful
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Your password has been updated. You can now sign in with
                        your new password.
                    </p>
                </div>
                <Button className="w-full" onClick={() => navigate("/login")}>
                    Sign In
                </Button>
            </div>
        );
    }

    // Step 3: New password
    if (step === 3) {
        return (
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <h3 className="text-lg font-semibold">Set new password</h3>
                    <p className="text-sm text-muted-foreground">
                        Enter your new password below.
                    </p>
                </div>
                <Form {...passwordForm}>
                    <form
                        onSubmit={passwordForm.handleSubmit(handleResetPassword)}
                        className="space-y-4"
                    >
                        <FormField
                            control={passwordForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="••••••••"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={
                                                    showConfirmPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="••••••••"
                                                {...field}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        !showConfirmPassword
                                                    )
                                                }
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Reset Password
                        </Button>
                    </form>
                </Form>
            </div>
        );
    }

    // Step 2: Enter OTP
    if (step === 2) {
        return (
            <div className="space-y-6">
                <div className="space-y-2 text-center">
                    <div className="flex justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold">Enter OTP</h3>
                    <p className="text-sm text-muted-foreground">
                        We've sent a 6-digit code to{" "}
                        <span className="font-medium text-foreground">
                            {email}
                        </span>
                    </p>
                </div>
                <OTPInput length={6} onComplete={handleVerifyOTP} />
                {loading && (
                    <div className="flex justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                )}
                <p className="text-center text-sm text-muted-foreground">
                    Didn't receive the code?{" "}
                    <button
                        type="button"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                        onClick={handleResendOTP}
                        disabled={loading}
                    >
                        Resend OTP
                    </button>
                </p>
                <div className="text-center">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                        onClick={() => setStep(1)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Change email
                    </button>
                </div>
            </div>
        );
    }

    // Step 1: Enter email
    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h3 className="text-lg font-semibold">Forgot your password?</h3>
                <p className="text-sm text-muted-foreground">
                    Enter your email and we'll send you a verification code.
                </p>
            </div>
            <Form {...emailForm}>
                <form
                    onSubmit={emailForm.handleSubmit(handleSendOTP)}
                    className="space-y-4"
                >
                    <FormField
                        control={emailForm.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="name@example.com"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Send OTP
                    </Button>
                </form>
            </Form>
            <div className="text-center">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                </Link>
            </div>
        </div>
    );
}
