import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-primary"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h2 className="mt-4 text-2xl font-bold tracking-tight">
                        Project Manager
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Sign in to manage your projects
                    </p>
                </div>
                <Outlet />
            </div>
        </div>
    );
}
