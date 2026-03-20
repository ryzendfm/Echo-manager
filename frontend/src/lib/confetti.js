import confetti from "canvas-confetti";

const COLORS = ["#7033ff", "#4ac885", "#fd822b", "#3276e4", "#e54b4f", "#ffd700"];

const DEFAULTS = {
    particleCount: 80,
    spread: 70,
    ticks: 200,
    gravity: 1.2,
    colors: COLORS,
    disableForReducedMotion: true,
};

export function fireConfetti() {
    // Burst from bottom-left
    confetti({ ...DEFAULTS, angle: 60, origin: { x: 0, y: 1 } });
    // Burst from bottom-right
    confetti({ ...DEFAULTS, angle: 120, origin: { x: 1, y: 1 } });
}
