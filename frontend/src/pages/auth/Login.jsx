import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
    return (
        <>
            <LoginForm />
            <div className="text-center text-sm text-muted-foreground">
                Don't have an account? Contact your administrator.
            </div>
        </>
    );
}
