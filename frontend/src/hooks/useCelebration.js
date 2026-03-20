import { useCallback } from "react";
import { fireConfetti } from "@/lib/confetti";

export function useCelebration() {
    const celebrate = useCallback(() => fireConfetti(), []);
    return { celebrate };
}
