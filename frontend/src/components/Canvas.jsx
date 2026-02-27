import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import './Canvas.css';

// Helper for flood fill
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 255
    } : { r: 0, g: 0, b: 0, a: 255 };
};

const Canvas = forwardRef(function Canvas(
    { tool, color, brushSize, strokes, onDraw, onDrawing, canDraw },
    ref
) {
    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const currentStrokeRef = useRef(null);
    const snapshotRef = useRef(null); // Used for shape preview optimization

    // Expose canvas element and drawRemotePoint to parent
    useImperativeHandle(ref, () => ({
        get canvas() { return canvasRef.current; },
        toDataURL: (...args) => canvasRef.current?.toDataURL(...args),
        drawRemotePoint: (pointData) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const { prevPoint, point, strokeColor, strokeSize, strokeType } = pointData;
            if (!prevPoint || !point) return;

            ctx.beginPath();
            ctx.strokeStyle = strokeType === 'eraser' ? getCanvasBgColor() : strokeColor;
            ctx.lineWidth = strokeSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = strokeType === 'eraser' ? 'destination-out' : 'source-over';
            ctx.moveTo(prevPoint.x, prevPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
        }
    }));

    // Resize canvas to fill container
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const container = canvas.parentElement;
            const rect = container.getBoundingClientRect();

            // Store current image data
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            canvas.width = rect.width;
            canvas.height = rect.height;

            // Restore image data
            ctx.putImageData(imageData, 0, 0);

            // Redraw all strokes
            redrawAllStrokes();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Redraw all strokes when strokes array changes
    useEffect(() => {
        redrawAllStrokes();
    }, [strokes]);

    const redrawAllStrokes = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Fill background with theme color first
        ctx.fillStyle = getCanvasBgColor();
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        strokes.forEach(stroke => {
            drawStroke(ctx, stroke);
        });
    }, [strokes]);

    const drawStroke = (ctx, stroke) => {
        if (!stroke || !stroke.points || stroke.points.length === 0) return;

        if (stroke.type === 'fill') {
            doFloodFill(ctx, Math.floor(stroke.points[0].x), Math.floor(stroke.points[0].y), stroke.color);
            return;
        }

        if (stroke.points.length < 2 && stroke.type !== 'circle') return; // circle can be 0 radius

        ctx.beginPath();
        ctx.strokeStyle = stroke.type === 'eraser' ? getCanvasBgColor() : stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Erasing shapes or lines
        ctx.globalCompositeOperation = stroke.type === 'eraser' ? 'destination-out' : 'source-over';

        if (stroke.type === 'pencil' || stroke.type === 'eraser' || stroke.type === 'line') {
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        } else if (stroke.type === 'rect') {
            const start = stroke.points[0];
            const end = stroke.points[stroke.points.length - 1];
            ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (stroke.type === 'circle') {
            const start = stroke.points[0];
            const end = stroke.points[stroke.points.length - 1] || start;
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over';
    };

    const doFloodFill = (ctx, startX, startY, fillColorHex) => {
        const canvas = ctx.canvas;
        const w = canvas.width;
        const h = canvas.height;
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const startPos = (startY * w + startX) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];
        const startA = data[startPos + 3];

        const fillRgb = hexToRgb(fillColorHex);

        // Tolerance for anti-aliased edge colors
        const tolerance = 20;

        const matchStartColor = (pos) => {
            return Math.abs(data[pos] - startR) <= tolerance &&
                Math.abs(data[pos + 1] - startG) <= tolerance &&
                Math.abs(data[pos + 2] - startB) <= tolerance &&
                Math.abs(data[pos + 3] - startA) <= tolerance;
        };

        if (matchStartColor((0 * w + 0) * 4)) {
            // If background is clicked, changing bg isn't explicitly transparent, it fills with color
        }

        // if target color is effectively the same as start color, return
        if (Math.abs(startR - fillRgb.r) < 5 && Math.abs(startG - fillRgb.g) < 5 && Math.abs(startB - fillRgb.b) < 5 && Math.abs(startA - fillRgb.a) < 5) return;

        const stack = [[startX, startY]];

        while (stack.length) {
            let [x, y] = stack.pop();
            let pos = (y * w + x) * 4;

            while (y >= 0 && matchStartColor(pos)) {
                y--;
                pos -= w * 4;
            }

            pos += w * 4;
            y++;

            let reachLeft = false;
            let reachRight = false;

            while (y < h && matchStartColor(pos)) {
                data[pos] = fillRgb.r;
                data[pos + 1] = fillRgb.g;
                data[pos + 2] = fillRgb.b;
                data[pos + 3] = 255; // solid

                if (x > 0) {
                    if (matchStartColor(pos - 4)) {
                        if (!reachLeft) {
                            stack.push([x - 1, y]);
                            reachLeft = true;
                        }
                    } else if (reachLeft) {
                        reachLeft = false;
                    }
                }

                if (x < w - 1) {
                    if (matchStartColor(pos + 4)) {
                        if (!reachRight) {
                            stack.push([x + 1, y]);
                            reachRight = true;
                        }
                    } else if (reachRight) {
                        reachRight = false;
                    }
                }

                y++;
                pos += w * 4;
            }
        }

        ctx.putImageData(imgData, 0, 0);
    };

    const getCanvasBgColor = () => {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-primary').trim() || '#0a0a1a';
    };

    // Get position from mouse/touch event
    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        };
    };

    const startDrawing = (e) => {
        if (!canDraw) return;
        e.preventDefault();

        const pos = getPos(e);

        if (tool === 'fill') {
            const stroke = { type: 'fill', color, size: brushSize, points: [pos] };
            doFloodFill(canvasRef.current.getContext('2d'), Math.floor(pos.x), Math.floor(pos.y), color);
            onDraw(stroke);
            return;
        }

        isDrawingRef.current = true;
        currentStrokeRef.current = {
            type: tool,
            color,
            size: brushSize,
            points: [pos],
        };

        if (tool === 'rect' || tool === 'circle' || tool === 'line') {
            // Save snapshot for fast preview rendering
            const canvas = canvasRef.current;
            snapshotRef.current = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        }
    };

    const draw = (e) => {
        if (!isDrawingRef.current || !canDraw) return;
        e.preventDefault();
        const pos = getPos(e);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const stroke = currentStrokeRef.current;

        if (tool === 'pencil' || tool === 'eraser') {
            stroke.points.push(pos);
            const pts = stroke.points;

            ctx.beginPath();
            ctx.strokeStyle = stroke.type === 'eraser' ? getCanvasBgColor() : stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = stroke.type === 'eraser' ? 'destination-out' : 'source-over';

            if (pts.length >= 2) {
                ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
                ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
            }
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';

            // Emit incremental point for real-time sync
            if (onDrawing && pts.length >= 2) {
                onDrawing({
                    prevPoint: pts[pts.length - 2],
                    point: pts[pts.length - 1],
                    strokeColor: stroke.color,
                    strokeSize: stroke.size,
                    strokeType: stroke.type,
                });
            }
        } else if (tool === 'line' || tool === 'rect' || tool === 'circle') {
            // Shape tools: maintain only start and end points
            if (stroke.points.length > 1) {
                stroke.points[1] = pos;
            } else {
                stroke.points.push(pos);
            }

            // Restore snapshot and draw current shape preview
            if (snapshotRef.current) {
                ctx.putImageData(snapshotRef.current, 0, 0);
            } else {
                redrawAllStrokes(); // Fallback
            }
            drawStroke(ctx, stroke);
        }
    };

    const stopDrawing = (e) => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;
        snapshotRef.current = null;

        if (currentStrokeRef.current && (currentStrokeRef.current.type === 'circle' || currentStrokeRef.current.points.length >= 2)) {
            onDraw(currentStrokeRef.current);
        }
        currentStrokeRef.current = null;
    };

    return (
        <div className="canvas-container">
            <canvas
                ref={canvasRef}
                className={`drawing-canvas ${!canDraw ? 'canvas-disabled' : ''} ${tool === 'eraser' ? 'eraser-cursor' : ''} ${tool === 'fill' ? 'fill-cursor' : ''} ${['rect', 'circle', 'line'].includes(tool) ? 'crosshair-cursor' : ''}`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
            {!canDraw && (
                <div className="canvas-overlay">
                    <p>👀 Watch the drawer!</p>
                </div>
            )}
        </div>
    );
});

export default Canvas;
