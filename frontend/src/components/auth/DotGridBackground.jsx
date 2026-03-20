import { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

const DOT_SPACING = 28;
const BASE_R = 1.8;
const MAX_R = 7;
const INFLUENCE = 260;
const DISPLACE = 16;
const LERP = 0.08;
const FADE_IN_SPEED = 0.01;
const FADE_OUT_SPEED = 0.018;

// Ambient wiggle settings
const WIGGLE_AMP = 3;
const WIGGLE_SPEED = 0.0008;

const THEMES = {
    light: {
        base: [140, 100, 255],
        glow: [109, 40, 217],
        baseAlpha: 0.22,
        cursor: "rgba(83,74,183,",
    },
    dark: {
        base: [80, 50, 160],
        glow: [153, 82, 224],
        baseAlpha: 0.18,
        cursor: "rgba(153,82,224,",
    },
};

export default function DotGridBackground() {
    const canvasRef = useRef(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let dots = [];
        let realMouse = { x: -999, y: -999 };
        let smoothMouse = { x: -999, y: -999 };
        let currentStrength = 0;
        let animId;

        function resize() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            dots = [];
            const spacing = canvas.width < 640 ? DOT_SPACING * 1.5 : DOT_SPACING;
            const cols = Math.ceil(canvas.width / spacing) + 1;
            const rows = Math.ceil(canvas.height / spacing) + 1;
            for (let r = 0; r <= rows; r++)
                for (let c = 0; c <= cols; c++)
                    dots.push({
                        ox: c * spacing,
                        oy: r * spacing,
                        // Each dot gets unique phase offsets for organic wiggle
                        px: Math.random() * Math.PI * 2,
                        py: Math.random() * Math.PI * 2,
                    });
        }

        function draw(time) {
            const t_cfg = THEMES[theme] || THEMES.light;
            const isAway = realMouse.x === -999;
            const targetStrength = isAway ? 0 : 1;
            const fadeSpeed = isAway ? FADE_OUT_SPEED : FADE_IN_SPEED;
            currentStrength +=
                (targetStrength - currentStrength) * fadeSpeed;

            if (!isAway) {
                if (smoothMouse.x === -999) {
                    smoothMouse.x = realMouse.x;
                    smoothMouse.y = realMouse.y;
                } else {
                    smoothMouse.x +=
                        (realMouse.x - smoothMouse.x) * LERP;
                    smoothMouse.y +=
                        (realMouse.y - smoothMouse.y) * LERP;
                }
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const mx = smoothMouse.x,
                my = smoothMouse.y;
            const { base, glow, baseAlpha } = t_cfg;

            for (const d of dots) {
                // Ambient wiggle
                const wx = Math.sin(time * WIGGLE_SPEED + d.px) * WIGGLE_AMP;
                const wy = Math.cos(time * WIGGLE_SPEED * 0.7 + d.py) * WIGGLE_AMP;
                const bx = d.ox + wx;
                const by = d.oy + wy;

                // Cursor distortion on top of wiggle
                const dx = bx - mx,
                    dy = by - my;
                const dist = Math.hypot(dx, dy);
                const t = Math.max(0, 1 - dist / INFLUENCE) * currentStrength;
                const t2 = t * t;
                const angle = Math.atan2(dy, dx);
                const x = bx + Math.cos(angle) * DISPLACE * t2;
                const y = by + Math.sin(angle) * DISPLACE * t2;
                const r = BASE_R + (MAX_R - BASE_R) * t2;
                const a = baseAlpha + (1 - baseAlpha) * t2;
                const rc = Math.round(base[0] + (glow[0] - base[0]) * t);
                const gc = Math.round(base[1] + (glow[1] - base[1]) * t);
                const bc = Math.round(base[2] + (glow[2] - base[2]) * t);
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${rc},${gc},${bc},${a})`;
                ctx.fill();
            }

            if (currentStrength > 0.01 && smoothMouse.x !== -999) {
                const cursorAlpha = currentStrength * 0.85;
                ctx.beginPath();
                ctx.arc(smoothMouse.x, smoothMouse.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = `${t_cfg.cursor}${cursorAlpha})`;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(smoothMouse.x, smoothMouse.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${cursorAlpha})`;
                ctx.fill();
            }

            animId = requestAnimationFrame(draw);
        }

        const getCanvasPos = (clientX, clientY) => {
            const r = canvas.getBoundingClientRect();
            return { x: clientX - r.left, y: clientY - r.top };
        };
        const onMouseMove = (e) => {
            realMouse = getCanvasPos(e.clientX, e.clientY);
        };
        const onMouseLeave = () => {
            realMouse = { x: -999, y: -999 };
        };
        const onTouchMove = (e) => {
            const touch = e.touches[0];
            realMouse = getCanvasPos(touch.clientX, touch.clientY);
        };
        const onTouchEnd = () => {
            realMouse = { x: -999, y: -999 };
        };

        window.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseleave", onMouseLeave);
        window.addEventListener("touchstart", onTouchMove, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: true });
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("touchcancel", onTouchEnd);
        window.addEventListener("resize", resize);

        resize();
        animId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseleave", onMouseLeave);
            window.removeEventListener("touchstart", onTouchMove);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
            window.removeEventListener("touchcancel", onTouchEnd);
            window.removeEventListener("resize", resize);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ display: "block" }}
        />
    );
}
