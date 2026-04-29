import { useEffect, useRef, useState } from "react";

type CursorPreview = {
    x: number;
    y: number;
    size: number;
    visible: boolean;
};

export default function HeatmapDogEditor() {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isPainting, setIsPainting] = useState(false);
    const [isCooling, setIsCooling] = useState(false);
    const [brushSize, setBrushSize] = useState(200);
    const [sensitivity, setSensitivity] = useState(2.5);
    const [cursorPreview, setCursorPreview] = useState<CursorPreview>({
        x: 0,
        y: 0,
        size: 0,
        visible: false,
    });

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const historyRef = useRef<Float32Array[]>([]);
    const historyIndexRef = useRef(-1);
    const baseImageRef = useRef<HTMLImageElement | null>(null);
    const heatmapRef = useRef<Float32Array>(new Float32Array());
    const pointerRef = useRef({ x: 0, y: 0 });
    const animationRef = useRef<number | null>(null);
    const lastFrameTimeRef = useRef(0);
    const hasStrokeChangesRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        const loadDog = async () => {
            try {
                let validImageUrl: string | null = null;
                let attempts = 0;

                while (!validImageUrl && attempts < 12) {
                    attempts += 1;
                    const res = await fetch("https://random.dog/woof.json");
                    const data = await res.json();
                    const url = data.url || "";
                    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(url);

                    if (isImage) {
                        validImageUrl = url;
                    }
                }

                if (!validImageUrl) {
                    throw new Error("No se encontró una imagen válida en random.dog");
                }

                const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
                    validImageUrl.replace(/^https?:\/\//, "")
                )}`;

                if (!cancelled) {
                    setImageUrl(proxyUrl);
                }
            } catch (error) {
                console.error("Error cargando imagen:", error);
            }
        };

        loadDog();

        return () => {
            cancelled = true;
        };
    }, []);

    const initHeatmap = (width: number, height: number) => {
        const initial = new Float32Array(width * height).fill(0);
        heatmapRef.current = initial;
        historyRef.current = [new Float32Array(initial)];
        historyIndexRef.current = 0;
    };

    const getIndex = (x: number, y: number, width: number) => y * width + x;

    const clamp = (value: number, min = 0, max = 1) =>
        Math.max(min, Math.min(max, value));

    const jetColor = (v: number): [number, number, number] => {
        const value = clamp(v);
        const fourValue = 4 * value;
        const r = clamp(Math.min(fourValue - 1.5, -fourValue + 4.5));
        const g = clamp(Math.min(fourValue - 0.5, -fourValue + 3.5));
        const b = clamp(Math.min(fourValue + 0.5, -fourValue + 2.5));
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

    const saveSnapshot = () => {
        const snapshot = new Float32Array(heatmapRef.current);
        const trimmed = historyRef.current.slice(0, historyIndexRef.current + 1);
        trimmed.push(snapshot);

        if (trimmed.length > 100) {
            trimmed.shift();
        }

        historyRef.current = trimmed;
        historyIndexRef.current = trimmed.length - 1;
    };

    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        const img = baseImageRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const overlayCanvas = document.createElement("canvas");
        overlayCanvas.width = canvas.width;
        overlayCanvas.height = canvas.height;

        const overlayCtx = overlayCanvas.getContext("2d");
        if (!overlayCtx) return;

        const overlay = overlayCtx.createImageData(canvas.width, canvas.height);

        for (let i = 0; i < heatmapRef.current.length; i++) {
            const intensity = heatmapRef.current[i];
            const [r, g, b] = jetColor(intensity);
            overlay.data[i * 4 + 0] = r;
            overlay.data[i * 4 + 1] = g;
            overlay.data[i * 4 + 2] = b;
            overlay.data[i * 4 + 3] = 110;
        }

        overlayCtx.putImageData(overlay, 0, 0);
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(overlayCanvas, 0, 0);
        ctx.restore();
    };

    const restoreSnapshot = (snapshot: Float32Array | undefined) => {
        if (!snapshot) return;
        heatmapRef.current = new Float32Array(snapshot);
        redrawCanvas();
    };

    const applyHeat = (x: number, y: number, delta: number, radius = brushSize) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.width;
        const height = canvas.height;
        const heatmap = heatmapRef.current;

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const nx = x + dx;
                const ny = y + dy;

                if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;

                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > radius) continue;

                const falloff = 1 - distance / radius;
                const idx = getIndex(nx, ny, width);
                heatmap[idx] = clamp(heatmap[idx] + delta * falloff);
                hasStrokeChangesRef.current = true;
            }
        }
    };

    useEffect(() => {
        if (!imageUrl) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        img.onload = () => {
            baseImageRef.current = img;

            const canvas = canvasRef.current;
            if (!canvas) return;

            canvas.width = img.width;
            canvas.height = img.height;
            initHeatmap(img.width, img.height);
            redrawCanvas();
        };
    }, [imageUrl]);

    useEffect(() => {
        const step = (timestamp: number) => {
            if (!lastFrameTimeRef.current) {
                lastFrameTimeRef.current = timestamp;
            }

            const deltaMs = timestamp - lastFrameTimeRef.current;
            lastFrameTimeRef.current = timestamp;

            if (isPainting || isCooling) {
                const strengthPerSecond = isCooling ? -sensitivity : sensitivity;
                const delta = (deltaMs / 1000) * strengthPerSecond;
                applyHeat(pointerRef.current.x, pointerRef.current.y, delta, brushSize);
                redrawCanvas();
            }

            animationRef.current = requestAnimationFrame(step);
        };

        animationRef.current = requestAnimationFrame(step);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            lastFrameTimeRef.current = 0;
        };
    }, [isPainting, isCooling, brushSize, sensitivity]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const modifier = event.ctrlKey || event.metaKey;
            if (!modifier) return;

            const key = event.key.toLowerCase();

            if (key === "z" && !event.shiftKey) {
                event.preventDefault();
                if (historyIndexRef.current > 0) {
                    historyIndexRef.current -= 1;
                    restoreSnapshot(historyRef.current[historyIndexRef.current]);
                }
                return;
            }

            if (key === "y" || (key === "z" && event.shiftKey)) {
                event.preventDefault();
                if (historyIndexRef.current < historyRef.current.length - 1) {
                    historyIndexRef.current += 1;
                    restoreSnapshot(historyRef.current[historyIndexRef.current]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const refreshCursorPreview = (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = rect.width / canvas.width;
        const displayRadius = brushSize * scaleX;

        setCursorPreview({
            x: clientX - rect.left,
            y: clientY - rect.top,
            size: displayRadius * 2,
            visible: true,
        });
    };

    const updatePointerPosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const rawX = (event.clientX - rect.left) * scaleX;
        const rawY = (event.clientY - rect.top) * scaleY;

        pointerRef.current = {
            x: Math.max(0, Math.min(canvas.width - 1, Math.round(rawX))),
            y: Math.max(0, Math.min(canvas.height - 1, Math.round(rawY))),
        };

        refreshCursorPreview(event.clientX, event.clientY);
    };

    const handlePointerDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
        hasStrokeChangesRef.current = false;
        updatePointerPosition(event);

        if (event.button === 2) {
            setIsCooling(true);
            return;
        }

        if (event.button === 0) {
            setIsPainting(true);
        }
    };

    const stopPainting = () => {
        const shouldSave = (isPainting || isCooling) && hasStrokeChangesRef.current;

        setIsPainting(false);
        setIsCooling(false);
        setCursorPreview((prev) => ({ ...prev, visible: false }));

        if (shouldSave) {
            saveSnapshot();
            hasStrokeChangesRef.current = false;
        }
    };

    useEffect(() => {
        redrawCanvas();
        setCursorPreview((prev) => ({
            ...prev,
            size: (() => {
                const canvas = canvasRef.current;
                if (!canvas) return prev.size;
                const rect = canvas.getBoundingClientRect();
                const scaleX = rect.width / canvas.width;
                return brushSize * scaleX * 2;
            })(),
        }));
    }, [brushSize]);

    const exportImage = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob(
            async (blob) => {
                if (!blob) return;

                const formData = new FormData();
                formData.append("file", blob, "heatmap.png");

                try {
                    await fetch("http://localhost:3000", {
                        method: "POST",
                        body: formData,
                    });
                    alert("Imagen enviada correctamente");
                } catch (error) {
                    console.error("Error enviando imagen:", error);
                    alert("No se pudo enviar la imagen");
                }
            },
            "image/png"
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 text-gray-900 dark:bg-slate-950 dark:text-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-white/5 dark:shadow-2xl dark:backdrop-blur">
                    <h1 className="text-2xl font-bold">Editor de zonas calientes</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-white/70">
                        La imagen inicia completamente en azul frío. Mantén presionado click
                        izquierdo para subir la intensidad de forma gradual. Usa click
                        derecho para enfriar la zona. El mapa de calor es translúcido y
                        puedes cambiar el tamaño de la brocha.
                    </p>
                </div>

                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-black/40 dark:shadow-2xl">
                    {imageUrl ? (
                        <div className="relative mx-auto w-fit">
                            <canvas
                                ref={canvasRef}
                                tabIndex={0}
                                onMouseDown={handlePointerDown}
                                onMouseMove={updatePointerPosition}
                                onMouseUp={stopPainting}
                                onMouseLeave={stopPainting}
                                onContextMenu={(e) => e.preventDefault()}
                                className="mx-auto block max-h-[75vh] max-w-full cursor-none rounded-2xl border border-gray-200 dark:border-white/10"
                                style={{ width: "auto", height: "auto" }}
                            />

                            {cursorPreview.visible && (
                                <div
                                    className="pointer-events-none absolute rounded-full border-2 border-dashed border-gray-900/80 dark:border-white/90"
                                    style={{
                                        left: cursorPreview.x,
                                        top: cursorPreview.y,
                                        width: cursorPreview.size,
                                        height: cursorPreview.size,
                                        transform: "translate(-50%, -50%)",
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-gray-300 text-gray-500 dark:border-white/10 dark:text-white/60">
                            No se pudo cargar la imagen todavía. Revisa la consola del
                            navegador si persiste.
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-lg dark:border-white/10 dark:bg-white/5 dark:shadow-2xl">
                    <div className="min-w-[260px] flex-1">
                        <div className="mb-2 flex items-center justify-between text-sm text-gray-700 dark:text-white/80">
                            <span>Tamaño de brocha</span>
                            <span>{brushSize}px</span>
                        </div>
                        <input
                            type="range"
                            min="8"
                            max="300"
                            step="1"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-full accent-blue-500"
                        />
                    </div>

                    <div className="min-w-[260px] flex-1">
                        <div className="mb-2 flex items-center justify-between text-sm text-gray-700 dark:text-white/80">
                            <span>Sensibilidad</span>
                            <span>{sensitivity.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="0.05"
                            max="5"
                            step="0.05"
                            value={sensitivity}
                            onChange={(e) => setSensitivity(Number(e.target.value))}
                            className="w-full accent-amber-500"
                        />
                    </div>

                    <button
                        onClick={exportImage}
                        className="
                                rounded-2xl
                                px-5 py-3
                                font-medium
                                text-body dark:text-white
                                transition
                                bg-blue-600 hover:bg-blue-700
                                dark:bg-blue-500 dark:hover:bg-blue-400
                                shadow-md
                                "
                    >
                        Generar y enviar imagen
                    </button>

                    <div className="text-sm text-gray-600 dark:text-white/70">
                        Azul oscuro = baja activación · Verde = media-baja · Amarillo =
                        media-alta · Rojo = alta activación · El círculo punteado muestra el
                        tamaño actual de la brocha · Sensibilidad alta = pinta más rápido ·
                        Ctrl/Cmd+Z deshace · Ctrl/Cmd+Y rehace
                    </div>
                </div>
            </div>
        </div>
    );
}