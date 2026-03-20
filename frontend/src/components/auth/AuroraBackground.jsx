import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";

const BLOB_CONFIG = [
    {
        cx: 0.45, cy: 0.10, Ax: 0.30, Ay: 0.15, fx: 0.28, fy: 0.14,
        px: 0.0, py: 0.0, opBase: 0.80, opAmp: 0.12, opF: 0.20,
        scaleBase: 1.00, scaleAmp: 0.045, scaleF: 0.11, parallax: 10,
        blur: 75,
        light: "radial-gradient(ellipse at center, rgba(160,80,255,0.50) 0%, rgba(100,40,200,0.22) 45%, transparent 70%)",
        dark: "radial-gradient(ellipse at center, rgba(180,90,255,0.68) 0%, rgba(110,40,210,0.30) 45%, transparent 70%)",
        w: "100vw", h: "52vh",
    },
    {
        cx: 0.68, cy: 0.15, Ax: 0.22, Ay: 0.18, fx: 0.22, fy: 0.11,
        px: 1.0, py: 0.5, opBase: 0.70, opAmp: 0.14, opF: 0.17,
        scaleBase: 1.00, scaleAmp: 0.060, scaleF: 0.10, parallax: 16,
        blur: 82,
        light: "radial-gradient(ellipse at center, rgba(80,30,210,0.52) 0%, rgba(50,15,145,0.24) 45%, transparent 70%)",
        dark: "radial-gradient(ellipse at center, rgba(90,30,230,0.72) 0%, rgba(55,15,155,0.32) 45%, transparent 70%)",
        w: "72vw", h: "58vh",
    },
    {
        cx: 0.30, cy: 0.12, Ax: 0.25, Ay: 0.14, fx: 0.35, fy: 0.175,
        px: 2.1, py: 1.0, opBase: 0.62, opAmp: 0.16, opF: 0.25,
        scaleBase: 1.00, scaleAmp: 0.055, scaleF: 0.13, parallax: 20,
        blur: 62,
        light: "radial-gradient(ellipse at center, rgba(195,125,255,0.38) 0%, rgba(135,65,235,0.16) 50%, transparent 70%)",
        dark: "radial-gradient(ellipse at center, rgba(215,145,255,0.52) 0%, rgba(155,75,245,0.22) 50%, transparent 70%)",
        w: "65vw", h: "46vh",
    },
    {
        cx: 0.50, cy: 0.45, Ax: 0.38, Ay: 0.12, fx: 0.19, fy: 0.095,
        px: 0.8, py: 1.6, opBase: 0.58, opAmp: 0.14, opF: 0.15,
        scaleBase: 1.00, scaleAmp: 0.040, scaleF: 0.09, parallax: 8,
        blur: 92,
        light: "radial-gradient(ellipse at center, rgba(50,10,165,0.40) 0%, rgba(25,5,80,0.16) 55%, transparent 70%)",
        dark: "radial-gradient(ellipse at center, rgba(55,8,185,0.58) 0%, rgba(28,4,88,0.22) 55%, transparent 70%)",
        w: "82vw", h: "42vh",
    },
    {
        cx: 0.75, cy: 0.08, Ax: 0.18, Ay: 0.16, fx: 0.42, fy: 0.21,
        px: 3.2, py: 0.3, opBase: 0.52, opAmp: 0.18, opF: 0.30,
        scaleBase: 1.00, scaleAmp: 0.070, scaleF: 0.17, parallax: 22,
        blur: 58,
        light: "radial-gradient(ellipse at center, rgba(185,60,255,0.32) 0%, rgba(125,30,195,0.14) 50%, transparent 70%)",
        dark: "radial-gradient(ellipse at center, rgba(205,75,255,0.44) 0%, rgba(145,38,205,0.20) 50%, transparent 70%)",
        w: "50vw", h: "44vh",
    },
    {
        cx: 0.20, cy: 0.30, Ax: 0.20, Ay: 0.15, fx: 0.31, fy: 0.155,
        px: 1.5, py: 2.4, opBase: 0.46, opAmp: 0.14, opF: 0.22,
        scaleBase: 1.00, scaleAmp: 0.050, scaleF: 0.12, parallax: 14,
        blur: 68,
        light: "radial-gradient(ellipse at center, rgba(110,40,235,0.28) 0%, rgba(70,20,165,0.12) 50%, transparent 70%)",
        dark: "radial-gradient(ellipse at center, rgba(130,50,255,0.38) 0%, rgba(80,20,180,0.16) 50%, transparent 70%)",
        w: "60vw", h: "38vh",
    },
];

export default function AuroraBackground() {
    const containerRef = useRef(null);
    const blobRefs = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const targetMouseRef = useRef({ x: 0, y: 0 });
    const sizesRef = useRef([]);
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const cacheSizes = useCallback(() => {
        sizesRef.current = blobRefs.current.map((el) =>
            el ? { w: el.offsetWidth, h: el.offsetHeight } : { w: 0, h: 0 }
        );
    }, []);

    useEffect(() => {
        let animId;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const getW = () => containerRef.current?.offsetWidth || window.innerWidth;
        const getH = () => containerRef.current?.offsetHeight || window.innerHeight;

        cacheSizes();

        const onPointerMove = (e) => {
            targetMouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
            targetMouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
        };

        const onResize = () => cacheSizes();

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("resize", onResize);

        function tick(ts) {
            const t = ts * 0.001;
            const w = getW();
            const h = getH();
            const mouse = mouseRef.current;
            const target = targetMouseRef.current;

            mouse.x += (target.x - mouse.x) * 0.035;
            mouse.y += (target.y - mouse.y) * 0.035;

            BLOB_CONFIG.forEach((b, i) => {
                const el = blobRefs.current[i];
                if (!el) return;
                const size = sizesRef.current[i] || { w: 0, h: 0 };

                const x = (b.cx + b.Ax * Math.sin(b.fx * t + b.px)) * w;
                const y = (b.cy + b.Ay * Math.sin(b.fy * t + b.py)) * h;

                const driftX = reducedMotion ? 0 : mouse.x * b.parallax;
                const driftY = reducedMotion ? 0 : mouse.y * (b.parallax * 0.35);

                const scale = reducedMotion
                    ? 1
                    : b.scaleBase + b.scaleAmp * Math.sin(b.scaleF * t + b.py + i);

                const op = b.opBase + b.opAmp * Math.sin(b.opF * t + b.px);

                const hue = reducedMotion
                    ? 0
                    : (b.hueAmp || 10) * Math.sin((b.hueF || 0.05) * t + b.py);

                const brightness = 1.0 + 0.10 * Math.sin(0.09 * t + i * 0.7);
                const saturate = 1.05 + 0.08 * Math.sin(0.07 * t + i);

                el.style.transform = `translate(${x - size.w * 0.5 + driftX}px, ${y - size.h * 0.5 + driftY}px) scale(${scale})`;
                el.style.opacity = op.toFixed(3);
                el.style.filter = `blur(${b.blur}px) hue-rotate(${hue.toFixed(2)}deg) brightness(${brightness.toFixed(3)}) saturate(${saturate.toFixed(3)})`;
            });

            animId = requestAnimationFrame(tick);
        }

        animId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("resize", onResize);
        };
    }, [cacheSizes]);

    return (
        <>
            {/* Aurora container — covers full viewport, no clipping */}
            <div
                ref={containerRef}
                className="pointer-events-none absolute inset-0"
                style={{ isolation: "isolate" }}
            >
                {BLOB_CONFIG.map((b, i) => (
                    <div
                        key={i}
                        ref={(el) => (blobRefs.current[i] = el)}
                        className="absolute rounded-full"
                        style={{
                            width: b.w,
                            height: b.h,
                            background: isDark ? b.dark : b.light,
                            mixBlendMode: "screen",
                            willChange: "transform, opacity, filter",
                            transformOrigin: "center center",
                        }}
                    />
                ))}

                {/* Curtain streaks */}
                <div className="aurora-curtain" />

                {/* Glow haze */}
                <div
                    className="pointer-events-none absolute"
                    style={{
                        inset: "-10% -10% 20% -10%",
                        background: isDark
                            ? "radial-gradient(ellipse at 50% 20%, rgba(160,90,255,0.10), transparent 55%), radial-gradient(ellipse at 25% 10%, rgba(90,40,220,0.08), transparent 50%), radial-gradient(ellipse at 80% 15%, rgba(210,110,255,0.07), transparent 45%)"
                            : "radial-gradient(ellipse at 50% 20%, rgba(140,70,235,0.08), transparent 55%), radial-gradient(ellipse at 25% 10%, rgba(80,35,200,0.06), transparent 50%), radial-gradient(ellipse at 80% 15%, rgba(190,95,235,0.05), transparent 45%)",
                        filter: "blur(60px)",
                        zIndex: 1,
                    }}
                />
            </div>

            {/* Shimmer stars */}
            <div className="aurora-shimmer" />

            {/* Subtle vignette */}
            <div
                className="pointer-events-none fixed inset-0"
                style={{
                    zIndex: 2,
                    background: "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.08) 72%, rgba(0,0,0,0.18) 100%)",
                }}
            />

            {/* Film grain */}
            <div className="aurora-grain" />
        </>
    );
}
