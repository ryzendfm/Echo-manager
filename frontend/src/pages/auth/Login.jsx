import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
    return (
        <div className="space-y-6">
            {/* Heading — hidden on mobile (layout provides branding there) */}
            <div className="hidden space-y-2 text-center md:block">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Sign In
                </h2>
                <p className="text-sm text-muted-foreground">
                    Enter your credentials to access your account.
                </p>
            </div>
            <LoginForm />
        </div>
    );
}
