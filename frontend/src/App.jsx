import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SocketProvider } from "@/context/SocketContext";
import AppRoutes from "@/routes";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="pm-theme">
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              className: "font-sans",
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
