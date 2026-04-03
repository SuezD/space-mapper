"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const STEPS = ["upload", "floor", "scale", "light", "occlusion", "designer"];

const STEP_META = {
upload: { label: "Upload Room", icon: "⬆", desc: "Upload a photo of your room to get started." },
floor: { label: "Mark Floor", icon: "⬡", desc: "Click the 4 corners of your visible floor area." },
scale: { label: "Set Scale", icon: "↔", desc: "Click 2 points of a known distance on the floor." },
light: { label: "Light Source", icon: "◎", desc: "Click where the primary light source is in the photo." },
occlusion: { label: "Foreground", icon: "◈", desc: "Paint over any objects in front of where furniture will go." },
designer: { label: "Designer", icon: "✦", desc: "Place, rotate, and size furniture on your floor plan." },
};

const FURNITURE_PRESETS = [
{ id: 1, name: "Scandinavian Sofa", dims: "W 200cm · H 85cm · D 95cm", color: "#c8a882", img: null },
{ id: 2, name: "Oak Coffee Table", dims: "W 120cm · H 45cm · D 60cm", color: "#a07850", img: null },
{ id: 3, name: "Accent Chair", dims: "W 80cm · H 90cm · D 85cm", color: "#8b9e8a", img: null },
{ id: 4, name: "Floor Lamp", dims: "W 40cm · H 160cm · D 40cm", color: "#d4c4a0", img: null },
];

function StepDots({ current }) {
return (
<div style={{ display: "flex", gap: 6, alignItems: "center" }}>
{STEPS.map((s, i) => {
const idx = STEPS.indexOf(current);
const done = i < idx;
const active = i === idx;
return (
<div key={s} style={{
width: active ? 20 : 6,
height: 6,
borderRadius: 3,
background: active ? "#d4935a" : done ? "#d4935a66" : "#ffffff22",
transition: "all 0.3s ease",
}} />
);
})}
</div>
);
}

function UploadStep({ onNext }) {
const [dragging, setDragging] = useState(false);
const [preview, setPreview] = useState(null);
const inputRef = useRef();

const handleFile = (file) => {
if (!file || !file.type.startsWith("image/")) return;
const url = URL.createObjectURL(file);
setPreview(url);
};

return (
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 24 }}>
<div style={{ textAlign: "center" }}>
<div style={{ fontSize: 13, letterSpacing: "0.2em", color: "#d4935a", textTransform: "uppercase", marginBottom: 8 }}>Step 1</div>
<h2 style={{ fontSize: 28, fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 600, color: "#f5f0e8", margin: 0 }}>Upload Your Room</h2>
<p style={{ color: "#888", fontSize: 14, marginTop: 8 }}>A clear, well-lit photo works best. Avoid fisheye lenses.</p>
</div>

  <div
    onClick={() => inputRef.current.click()}
    onDragOver={e => { e.preventDefault(); setDragging(true); }}
    onDragLeave={() => setDragging(false)}
    onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
    style={{
      width: "100%", maxWidth: 480,
      height: preview ? "auto" : 220,
      border: `2px dashed ${dragging ? "#d4935a" : "#333"}`,
      borderRadius: 12,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      cursor: "pointer", background: dragging ? "#d4935a0a" : "#0d0d0d",
      transition: "all 0.2s", overflow: "hidden",
      position: "relative",
    }}
  >
    {preview ? (
      <>
        <img src={preview} alt="Room preview" style={{ width: "100%", display: "block", borderRadius: 10 }} />
        <div style={{
          position: "absolute", inset: 0, background: "linear-gradient(to top, #000a, transparent)",
          display: "flex", alignItems: "flex-end", padding: 16,
        }}>
          <span style={{ color: "#fff", fontSize: 13 }}>Click to change photo</span>
        </div>
      </>
    ) : (
      <>
        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>⬆</div>
        <div style={{ color: "#666", fontSize: 14 }}>Drop photo here or click to browse</div>
        <div style={{ color: "#444", fontSize: 12, marginTop: 4 }}>JPG, PNG, WEBP</div>
      </>
    )}
    <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
  </div>

  {preview && (
    <button onClick={() => onNext(preview)} style={{
      background: "#d4935a", border: "none", borderRadius: 8,
      color: "#fff", fontSize: 14, fontWeight: 600,
      padding: "12px 32px", cursor: "pointer", letterSpacing: "0.05em",
      transition: "all 0.2s",
    }}
      onMouseEnter={e => e.target.style.background = "#c4834a"}
      onMouseLeave={e => e.target.style.background = "#d4935a"}
    >
      Continue →
    </button>
  )}
</div>
);
}

function FloorStep({ photo, onNext, onBack }) {
const canvasRef = useRef();
const [corners, setCorners] = useState([]);
const imgRef = useRef(new Image());
const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

useEffect(() => {
const img = imgRef.current;
img.src = photo;
img.onload = () => {
const canvas = canvasRef.current;
if (!canvas) return;
const maxW = canvas.parentElement.clientWidth - 48;
const maxH = 400;
const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
canvas.width = img.naturalWidth * ratio;
canvas.height = img.naturalHeight * ratio;
setImgSize({ w: canvas.width, h: canvas.height });
draw([], canvas, img);
};
}, [photo]);

const draw = (pts, canvas, img) => {
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
ctx.fillStyle = "rgba(0,0,0,0.35)";
ctx.fillRect(0, 0, canvas.width, canvas.height);

if (pts.length >= 2) {
  ctx.strokeStyle = "#d4935a";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  if (pts.length >= 3) { ctx.lineTo(pts[0].x, pts[0].y); ctx.fillStyle = "#d4935a18"; ctx.fill(); }
  ctx.stroke();
  ctx.setLineDash([]);
}

pts.forEach((p, i) => {
  ctx.beginPath();
  ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = i === 0 ? "#d4935a" : "#fff";
  ctx.fill();
  ctx.strokeStyle = "#d4935a";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#000";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(i + 1, p.x, p.y);
});
};

const handleClick = (e) => {
const rect = canvasRef.current.getBoundingClientRect();
const x = e.clientX - rect.left;
const y = e.clientY - rect.top;
const newCorners = [...corners, { x, y }];
setCorners(newCorners);
draw(newCorners, canvasRef.current, imgRef.current);
};

return (
<div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
<div style={{ textAlign: "center" }}>
<div style={{ fontSize: 13, letterSpacing: "0.2em", color: "#d4935a", textTransform: "uppercase", marginBottom: 8 }}>Step 2</div>
<h2 style={{ fontSize: 24, fontFamily: "'Playfair Display', Georgia, serif", color: "#f5f0e8", margin: 0 }}>Mark the Floor</h2>
<p style={{ color: "#888", fontSize: 13, marginTop: 6 }}>Click corners of the visible floor area. At least 3 corners required.</p>
</div>

  <div style={{ position: "relative", cursor: corners.length < 4 ? "crosshair" : "default" }}>
    <canvas ref={canvasRef} onClick={handleClick} style={{ borderRadius: 10, display: "block" }} />
    <div style={{
      position: "absolute", top: 12, right: 12,
      background: "#000a", borderRadius: 6, padding: "6px 10px",
      color: "#d4935a", fontSize: 12, letterSpacing: "0.05em"
    }}>
      {corners.length} corners {corners.length >= 3 && "(done adding)"}
    </div>
  </div>

  <div style={{ display: "flex", gap: 12 }}>
    <button onClick={onBack} style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#888", fontSize: 14, padding: "10px 20px", cursor: "pointer" }}>← Back</button>
    {corners.length > 0 && <button onClick={() => { setCorners([]); draw([], canvasRef.current, imgRef.current); }} style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#888", fontSize: 14, padding: "10px 20px", cursor: "pointer" }}>Reset</button>}
    <button
      onClick={() => onNext(corners)}
      disabled={corners.length < 3}
      style={{
        background: corners.length >= 3 ? "#d4935a" : "#222", border: "none", borderRadius: 8,
        color: corners.length >= 3 ? "#fff" : "#555", fontSize: 14, fontWeight: 600,
        padding: "10px 24px", cursor: corners.length >= 3 ? "pointer" : "not-allowed", transition: "all 0.2s"
      }}>
      Continue →
    </button>
  </div>
</div>
);
}

function ScaleStep({ photo, corners, onNext, onBack }) {
const canvasRef = useRef();
const [points, setPoints] = useState([]);
const [distance, setDistance] = useState("");
const imgRef = useRef(new Image());

useEffect(() => {
const img = imgRef.current;
img.src = photo;
img.onload = () => {
const canvas = canvasRef.current;
if (!canvas) return;
const maxW = canvas.parentElement.clientWidth - 48;
const maxH = 360;
const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
canvas.width = img.naturalWidth * ratio;
canvas.height = img.naturalHeight * ratio;
drawScene([], canvas, img);
};
}, [photo]);

const drawScene = (pts, canvas, img) => {
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
ctx.fillStyle = "rgba(0,0,0,0.3)";
ctx.fillRect(0, 0, canvas.width, canvas.height);

if (pts.length === 2) {
  ctx.strokeStyle = "#60c8a0";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  ctx.lineTo(pts[1].x, pts[1].y);
  ctx.stroke();
  ctx.setLineDash([]);

  const mx = (pts[0].x + pts[1].x) / 2;
  const my = (pts[0].y + pts[1].y) / 2;
  ctx.fillStyle = "#000a";
  ctx.roundRect(mx - 28, my - 14, 56, 22, 4);
  ctx.fill();
  ctx.fillStyle = "#60c8a0";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(distance ? `${distance}cm` : "? cm", mx, my);
}

pts.forEach(p => {
  ctx.beginPath();
  ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#60c8a0";
  ctx.fill();
});
};

const handleClick = (e) => {
if (points.length >= 2) return;
const rect = canvasRef.current.getBoundingClientRect();
const x = e.clientX - rect.left;
const y = e.clientY - rect.top;
const newPts = [...points, { x, y }];
setPoints(newPts);
drawScene(newPts, canvasRef.current, imgRef.current);
};

const canContinue = points.length === 2 && distance && Number(distance) > 0;

return (
<div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
<div style={{ textAlign: "center" }}>
<div style={{ fontSize: 13, letterSpacing: "0.2em", color: "#d4935a", textTransform: "uppercase", marginBottom: 8 }}>Step 3</div>
<h2 style={{ fontSize: 24, fontFamily: "'Playfair Display', Georgia, serif", color: "#f5f0e8", margin: 0 }}>Set Scale</h2>
<p style={{ color: "#888", fontSize: 13, marginTop: 6 }}>Click 2 points on the floor with a known distance between them.</p>
</div>

  <div style={{ position: "relative", cursor: points.length < 2 ? "crosshair" : "default" }}>
    <canvas ref={canvasRef} onClick={handleClick} style={{ borderRadius: 10, display: "block" }} />
  </div>

  {points.length === 2 && (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <label style={{ color: "#888", fontSize: 13 }}>Distance between points:</label>
      <div style={{ display: "flex", alignItems: "center", background: "#111", border: "1px solid #333", borderRadius: 8, overflow: "hidden" }}>
        <input
          type="number" placeholder="e.g. 200" value={distance}
          onChange={e => { setDistance(e.target.value); drawScene(points, canvasRef.current, imgRef.current); }}
          style={{ background: "transparent", border: "none", color: "#f5f0e8", fontSize: 14, padding: "8px 12px", width: 100, outline: "none" }}
        />
        <span style={{ color: "#555", fontSize: 13, paddingRight: 12 }}>cm</span>
      </div>
    </div>
  )}

  <div style={{ display: "flex", gap: 12 }}>
    <button onClick={onBack} style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#888", fontSize: 14, padding: "10px 20px", cursor: "pointer" }}>← Back</button>
    {points.length > 0 && <button onClick={() => { setPoints([]); setDistance(""); drawScene([], canvasRef.current, imgRef.current); }} style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#888", fontSize: 14, padding: "10px 20px", cursor: "pointer" }}>Reset</button>}
    <button onClick={() => onNext({ points, distance: Number(distance) })} disabled={!canContinue}
      style={{ background: canContinue ? "#d4935a" : "#222", border: "none", borderRadius: 8, color: canContinue ? "#fff" : "#555", fontSize: 14, fontWeight: 600, padding: "10px 24px", cursor: canContinue ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
      Continue →
    </button>
  </div>
</div>
);
}

function LightStep({ photo, onNext, onBack }) {
const canvasRef = useRef();
const [light, setLight] = useState(null);
const imgRef = useRef(new Image());

useEffect(() => {
const img = imgRef.current;
img.src = photo;
img.onload = () => {
const canvas = canvasRef.current;
if (!canvas) return;
const maxW = canvas.parentElement.clientWidth - 48;
const maxH = 360;
const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
canvas.width = img.naturalWidth * ratio;
canvas.height = img.naturalHeight * ratio;
drawScene(null, canvas, img);
};
}, [photo]);

const drawScene = (pt, canvas, img) => {
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
ctx.fillStyle = "rgba(0,0,0,0.28)";
ctx.fillRect(0, 0, canvas.width, canvas.height);

if (pt) {
  for (let r = 60; r > 0; r -= 10) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 220, 100, ${0.04})`;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd84a";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
}
};

const handleClick = (e) => {
const rect = canvasRef.current.getBoundingClientRect();
const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
setLight(pt);
drawScene(pt, canvasRef.current, imgRef.current);
};

return (
<div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
<div style={{ textAlign: "center" }}>
<div style={{ fontSize: 13, letterSpacing: "0.2em", color: "#d4935a", textTransform: "uppercase", marginBottom: 8 }}>Step 4</div>
<h2 style={{ fontSize: 24, fontFamily: "'Playfair Display', Georgia, serif", color: "#f5f0e8", margin: 0 }}>Light Source</h2>
<p style={{ color: "#888", fontSize: 13, marginTop: 6 }}>Click the primary light source — a window, lamp, or ceiling light.</p>
</div>
<div style={{ position: "relative", cursor: "crosshair" }}>
<canvas ref={canvasRef} onClick={handleClick} style={{ borderRadius: 10, display: "block" }} />
</div>
<div style={{ display: "flex", gap: 12 }}>
<button onClick={onBack} style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#888", fontSize: 14, padding: "10px 20px", cursor: "pointer" }}>← Back</button>
<button onClick={() => onNext(light)} style={{ background: "#d4935a", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 24px", cursor: "pointer" }}>
{light ? "Continue →" : "Skip →"}
</button>
</div>
</div>
);
}

function OcclusionStep({ photo, onNext, onBack }) {
const canvasRef = useRef();
const painting = useRef(false);
const imgRef = useRef(new Image());
const maskRef = useRef(null);

useEffect(() => {
const img = imgRef.current;
img.src = photo;
img.onload = () => {
const canvas = canvasRef.current;
if (!canvas) return;
const maxW = canvas.parentElement.clientWidth - 48;
const maxH = 360;
const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
canvas.width = img.naturalWidth * ratio;
canvas.height = img.naturalHeight * ratio;
maskRef.current = document.createElement("canvas");
maskRef.current.width = canvas.width;
maskRef.current.height = canvas.height;
redraw(canvas, img);
};
}, [photo]);

const redraw = (canvas, img) => {
const ctx = canvas.getContext("2d");
ctx.clearRect(0, 0, canvas.width, canvas.height);
ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
ctx.fillStyle = "rgba(0,0,0,0.25)";
ctx.fillRect(0, 0, canvas.width, canvas.height);
if (maskRef.current) {
ctx.globalAlpha = 0.55;
ctx.drawImage(maskRef.current, 0, 0);
ctx.globalAlpha = 1;
}
};

const paint = (e) => {
if (!painting.current) return;
const rect = canvasRef.current.getBoundingClientRect();
const x = e.clientX - rect.left;
const y = e.clientY - rect.top;
const mctx = maskRef.current.getContext("2d");
mctx.beginPath();
mctx.arc(x, y, 18, 0, Math.PI * 2);
mctx.fillStyle = "rgba(212, 147, 90, 0.85)";
mctx.fill();
redraw(canvasRef.current, imgRef.current);
};

const clearMask = () => {
const mctx = maskRef.current.getContext("2d");
mctx.clearRect(0, 0, maskRef.current.width, maskRef.current.height);
redraw(canvasRef.current, imgRef.current);
};

return (
<div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
<div style={{ textAlign: "center" }}>
<div style={{ fontSize: 13, letterSpacing: "0.2em", color: "#d4935a", textTransform: "uppercase", marginBottom: 8 }}>Step 5</div>
<h2 style={{ fontSize: 24, fontFamily: "'Playfair Display', Georgia, serif", color: "#f5f0e8", margin: 0 }}>Mark Foreground</h2>
<p style={{ color: "#888", fontSize: 13, marginTop: 6 }}>Paint over objects closer to the camera than where furniture will go.</p>
</div>
<div style={{ position: "relative", cursor: "crosshair" }}>
<canvas
ref={canvasRef}
onMouseDown={() => painting.current = true}
onMouseUp={() => painting.current = false}
onMouseLeave={() => painting.current = false}
onMouseMove={paint}
style={{ borderRadius: 10, display: "block" }}
/>
</div>
<div style={{ display: "flex", gap: 12 }}>
<button onClick={onBack} style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#888", fontSize: 14, padding: "10px 20px", cursor: "pointer" }}>← Back</button>
<button onClick={clearMask} style={{ background: "transparent", border: "1px solid #333", borderRadius: 8, color: "#888", fontSize: 14, padding: "10px 20px", cursor: "pointer" }}>Clear</button>
<button onClick={() => onNext(maskRef.current)} style={{ background: "#d4935a", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, padding: "10px 24px", cursor: "pointer" }}>
Enter Designer →
</button>
</div>
</div>
);
}

function DesignerView({ photo, roomData, onBack }) {
const [placedItems, setPlacedItems] = useState([]);
const [selectedId, setSelectedId] = useState(null);
const [dragging, setDragging] = useState(null);
const [rotating, setRotating] = useState(null);
const [showPalette, setShowPalette] = useState(true);
const [perspCtrl, setPerspCtrl] = useState({ x: -0.8, y: -0.89, w: 0, r: -13.83 });
const canvasRef = useRef();
const containerRef = useRef();
const imgRef = useRef(new Image());
const [imgLoaded, setImgLoaded] = useState(false);
const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

useEffect(() => {
const img = imgRef.current;
img.src = photo;
img.onload = () => {
const checkContainer = () => {
const container = containerRef.current;
if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
setTimeout(checkContainer, 100);
return;
}
const maxW = container.clientWidth;
const maxH = container.clientHeight;
const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
setCanvasSize({ w: img.naturalWidth * ratio, h: img.naturalHeight * ratio });
setImgLoaded(true);
};
checkContainer();
};
img.onerror = () => {
console.error('Failed to load image:', photo);
setImgLoaded(false);
};
}, [photo]);

const addFurniture = (preset) => {
const id = Date.now();
setPlacedItems(prev => [...prev, {
id, name: preset.name, color: preset.color,
x: canvasSize.w / 2 - 60, y: canvasSize.h / 2 - 30,
w: 120, h: 55, rotation: 0,
imageAttached: false,
}]);
setSelectedId(id);
};

const selected = placedItems.find(i => i.id === selectedId);

const handleMouseDown = (e, id, mode) => {
e.stopPropagation();
if (mode === "drag") setDragging({ id, startX: e.clientX, startY: e.clientY });
if (mode === "rotate") setRotating({ id, startX: e.clientX, startY: e.clientY });
};

const handleMouseMove = useCallback((e) => {
if (dragging) {
const dx = e.clientX - dragging.startX;
const dy = e.clientY - dragging.startY;
setPlacedItems(prev => prev.map(i => i.id === dragging.id ? { ...i, x: i.x + dx, y: i.y + dy } : i));
setDragging(d => ({ ...d, startX: e.clientX, startY: e.clientY }));
}
if (rotating) {
const item = placedItems.find(i => i.id === rotating.id);
if (!item) return;
const cx = item.x + item.w / 2;
const cy = item.y + item.h / 2;
const rect = containerRef.current.getBoundingClientRect();
const angle = Math.atan2(e.clientY - rect.top - cy, e.clientX - rect.left - cx);
setPlacedItems(prev => prev.map(i => i.id === rotating.id ? { ...i, rotation: angle } : i));
}
}, [dragging, rotating, placedItems]);

const handleMouseUp = useCallback(() => {
setDragging(null);
setRotating(null);
}, []);

const deleteSelected = () => {
setPlacedItems(prev => prev.filter(i => i.id !== selectedId));
setSelectedId(null);
};

return (
<div style={{ display: "flex", height: "100%", gap: 0, position: "relative" }}>

  {/* Left palette */}
  {showPalette && (
    <div className="design-palette">
      <div className="palette-header">
        <span className="palette-title">Design Palette</span>
        <button onClick={() => setShowPalette(false)} className="close-btn">×</button>
      </div>

      <div style={{ padding: 12, borderBottom: "1px solid #1a1a1a" }}>
        {selected ? (
          <div style={{ background: "#111", borderRadius: 8, padding: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: selected.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: "#f5f0e8", fontWeight: 500 }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Selected</div>
              </div>
            </div>
            <button onClick={deleteSelected} style={{ width: "100%", background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 6, color: "#c05050", fontSize: 12, padding: "6px", cursor: "pointer" }}>
              Remove Item
            </button>
          </div>
        ) : (
          <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: "8px 0" }}>No item selected</div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        <div style={{ fontSize: 11, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Add Furniture</div>
        {FURNITURE_PRESETS.map(p => (
          <div key={p.id} onClick={() => addFurniture(p)} style={{
            display: "flex", gap: 10, alignItems: "center",
            padding: "10px", borderRadius: 8, cursor: "pointer",
            marginBottom: 6, background: "#111", border: "1px solid #1e1e1e",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#d4935a44"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e1e"}
          >
            <div style={{ width: 32, height: 32, borderRadius: 6, background: p.color, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, color: "#ccc", fontWeight: 500 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{p.dims}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: 12, borderTop: "1px solid #1a1a1a" }}>
        <button onClick={onBack} style={{ width: "100%", background: "transparent", border: "1px solid #222", borderRadius: 8, color: "#555", fontSize: 12, padding: "8px", cursor: "pointer" }}>
          ← Back to Setup
        </button>
      </div>
    </div>
  )}

  {/* Canvas area */}
  <div ref={containerRef} className={`canvas-area ${showPalette ? 'palette-visible' : ''}`}
    onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
    onClick={() => setSelectedId(null)}
  >
    {imgLoaded ? (
      <div className="room-canvas" style={{ width: canvasSize.w, height: canvasSize.h }}>
        <img src={photo} style={{ width: canvasSize.w, height: canvasSize.h, display: "block", borderRadius: 8 }} alt="room" />

        {/* Floor grid overlay */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Furniture items */}
        {placedItems.map(item => {
          const isSel = item.id === selectedId;
          const cx = item.x + item.w / 2;
          const cy = item.y + item.h / 2;
          return (
            <div key={item.id}
              onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
              onMouseDown={e => handleMouseDown(e, item.id, "drag")}
              style={{
                position: "absolute",
                left: item.x, top: item.y,
                width: item.w, height: item.h,
                transform: `rotate(${item.rotation}rad)`,
                cursor: "grab",
                userSelect: "none",
              }}
            >
              {/* Box body */}
              <div style={{
                position: "absolute", inset: 0,
                background: `${item.color}33`,
                border: `2px solid ${isSel ? "#d4935a" : item.color + "88"}`,
                borderRadius: 4,
                boxShadow: isSel ? `0 0 0 1px #d4935a44` : "none",
              }} />

              {/* Top face illusion */}
              <div style={{
                position: "absolute", left: 8, top: -14, right: 8, height: 14,
                background: `${item.color}22`,
                border: `1px solid ${item.color}44`,
                borderBottom: "none",
                transform: "perspective(200px) rotateX(40deg)",
                transformOrigin: "bottom",
              }} />

              {/* Label */}
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, color: isSel ? "#d4935a" : "#ffffff66",
                fontWeight: 500, letterSpacing: "0.05em", pointerEvents: "none",
              }}>
                {item.name.split(" ")[0]}
              </div>

              {/* Shadow */}
              <div style={{
                position: "absolute", bottom: -8, left: "10%", right: "10%", height: 8,
                background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)",
                filter: "blur(4px)",
                pointerEvents: "none",
              }} />

              {/* Rotate handle */}
              {isSel && (
                <div
                  onMouseDown={e => { e.stopPropagation(); handleMouseDown(e, item.id, "rotate"); }}
                  style={{
                    position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)",
                    width: 16, height: 16, borderRadius: "50%",
                    background: "#d4935a", border: "2px solid #fff",
                    cursor: "grab", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 8, color: "#fff",
                  }}
                >↻</div>
              )}

              {/* Corner handles */}
              {isSel && [
                { l: -5, t: -5 }, { r: -5, t: -5 },
                { l: -5, b: -5 }, { r: -5, b: -5 },
              ].map((pos, i) => (
                <div key={i} style={{
                  position: "absolute", width: 10, height: 10,
                  borderRadius: "50%", background: "#fff",
                  border: "2px solid #d4935a",
                  cursor: "nwse-resize",
                  ...pos
                }} />
              ))}

              {/* Dimension label */}
              {isSel && (
                <div style={{
                  position: "absolute", bottom: -22, left: "50%", transform: "translateX(-50%)",
                  background: "#000c", borderRadius: 4, padding: "2px 8px",
                  fontSize: 10, color: "#d4935a", whiteSpace: "nowrap", letterSpacing: "0.05em",
                }}>
                  {Math.round(item.w / 1.2)} × {Math.round(item.h / 0.6)} cm
                </div>
              )}
            </div>
          );
        })}
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#666", fontSize: 14 }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⚠</div>
        <div>Failed to load room image</div>
        <div style={{ fontSize: 12, marginTop: 8 }}>Please go back and try uploading again</div>
      </div>
    )}

    {/* Top toolbar */}
    <div style={{
      position: "absolute", top: 14, left: 14, right: 14,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      pointerEvents: "none",
    }}>
      <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
        {!showPalette && (
          <button onClick={() => setShowPalette(true)} style={{ background: "#111", border: "1px solid #222", borderRadius: 8, color: "#888", fontSize: 12, padding: "7px 12px", cursor: "pointer" }}>
            ☰ Palette
          </button>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, pointerEvents: "auto" }}>
        <button style={{ background: "#111a", border: "1px solid #222", borderRadius: 8, color: "#888", fontSize: 14, padding: "6px 12px", cursor: "pointer" }}>↩</button>
        <button style={{ background: "#111a", border: "1px solid #222", borderRadius: 8, color: "#888", fontSize: 14, padding: "6px 12px", cursor: "pointer" }}>↪</button>
      </div>
    </div>

    {/* Perspective control */}
    <div className="perspective-control">
      <div className="control-title">Perspective Control</div>
      {[["X", "x", -2, 2], ["Y", "y", -2, 2], ["W", "w", -50, 50], ["R", "r", -90, 90]].map(([label, key, min, max]) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: "#555", width: 12 }}>{label}</span>
          <input type="range" min={min} max={max} step={0.01} value={perspCtrl[key]}
            onChange={e => setPerspCtrl(p => ({ ...p, [key]: Number(e.target.value) }))}
            style={{ flex: 1, accentColor: "#d4935a", height: 2 }}
          />
          <span style={{ fontSize: 10, color: "#555", width: 36, textAlign: "right" }}>{perspCtrl[key].toFixed(1)}</span>
        </div>
      ))}
    </div>

    {/* Status bar */}
    {placedItems.length === 0 && (
      <div style={{
        position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
        background: "#111", border: "1px solid #222", borderRadius: 20,
        padding: "10px 20px", fontSize: 12, color: "#666", letterSpacing: "0.05em",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4935a", animation: "pulse 1.5s infinite" }} />
        Add furniture from the Design Palette
      </div>
    )}
  </div>

  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap');
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `}</style>
</div>
);
}

export default function SpatialHomes() {
const [step, setStep] = useState("upload");
const [roomData, setRoomData] = useState({
photo: null, corners: [], scale: null, light: null, occlusion: null,
});

const goTo = (s, data = {}) => {
setRoomData(prev => ({ ...prev, ...data }));
setStep(s);
};

return (
<div style={{
height: "100%", width: "100%", background: "#080808",
display: "flex", flexDirection: "column",
fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
color: "#f5f0e8",
overflow: "hidden",
}}>
<style>{`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500;600&display=swap');

* { 
  box-sizing: border-box; 
  margin: 0; 
  padding: 0; 
}

input[type=range] { 
  -webkit-appearance: none; 
  background: #1e1e1e; 
  border-radius: 2px; 
}

input[type=range]::-webkit-slider-thumb { 
  -webkit-appearance: none; 
  width: 12px; 
  height: 12px; 
  border-radius: 50%; 
  background: #d4935a; 
  cursor: pointer; 
}

::-webkit-scrollbar { 
  width: 4px; 
}

::-webkit-scrollbar-track { 
  background: #0a0a0a; 
}

::-webkit-scrollbar-thumb { 
  background: #222; 
  border-radius: 2px; 
}

body { 
  overflow-x: hidden; 
}

/* Header Styles */
.app-header {
  padding: 0 32px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #111;
  background: #080808;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 28px;
  height: 28px;
  background: #d4935a;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.logo-text {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  letter-spacing: 0.05em;
}

.header-nav {
  display: flex;
  gap: 0;
}

.nav-item {
  background: none;
  border: none;
  color: #444;
  font-size: 12px;
  letter-spacing: 0.08em;
  padding: 0 16px;
  cursor: pointer;
  text-transform: uppercase;
  font-family: inherit;
  border-bottom: 1px solid transparent;
  transition: all 0.2s;
}

.nav-item:hover {
  color: #f5f0e8;
}

.nav-item.active {
  color: #f5f0e8;
  border-bottom: 1px solid #d4935a;
}

.desktop-only {
  display: block;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1a1a1a;
  border: 1px solid #222;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #444;
}

/* Design Palette */
.design-palette {
  width: 240px;
  background: #0a0a0a;
  border-right: 1px solid #1e1e1e;
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-shrink: 0;
  border-radius: 12px 0 0 12px;
  overflow: hidden;
}

.palette-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #1e1e1e;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.palette-title {
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #666;
}

.close-btn {
  background: none;
  border: none;
  color: #444;
  cursor: pointer;
  font-size: 16px;
}

/* Perspective Control */
.perspective-control {
  position: absolute;
  top: 14px;
  right: 14px;
  background: #0d0d0dee;
  border: 1px solid #1e1e1e;
  border-radius: 10px;
  padding: 12px 14px;
  min-width: 160px;
  max-width: 180px;
}

.control-title {
  font-size: 10px;
  letter-spacing: 0.15em;
  color: #444;
  text-transform: uppercase;
  margin-bottom: 8px;
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.designer-container {
  flex: 1;
  padding: 16px;
  display: flex;
  min-height: 0;
}

.step-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  overflow: hidden;
}

.step-content {
  width: 100%;
  max-width: 640px;
}

/* Canvas Area */
.canvas-area {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #080808;
  border-radius: 12px;
  overflow: hidden;
}

.canvas-area.palette-visible {
  border-radius: 0 12px 12px 0;
}

.room-canvas {
  position: relative;
  border-radius: 8px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .app-header {
    padding: 0 16px;
  }
  
  .logo-text {
    font-size: 14px;
  }
  
  .nav-item {
    font-size: 10px;
    padding: 0 8px;
  }
  
  .desktop-only {
    display: none;
  }
  
  .design-palette {
    display: none;
  }
  
  .perspective-control {
    padding: 8px 10px;
    min-width: 140px;
    max-width: 140px;
  }
  
  .control-title {
    font-size: 9px;
  }
  
  .designer-container {
    padding: 8px;
  }
  
  .step-container {
    padding: 16px 12px;
  }
  
  .step-content {
    max-width: 600px;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 12px;
  }
  
  .design-palette {
    width: 180px;
  }
  
  .perspective-control {
    min-width: 120px;
    max-width: 120px;
    padding: 6px 8px;
  }
  
  .step-content {
    max-width: 100%;
  }
}

@keyframes pulse { 
  0%,100%{opacity:1} 
  50%{opacity:0.3} 
}
`}</style>

  {/* Header */}
  <header style={{
    padding: "0 32px", height: 56,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    borderBottom: "1px solid #111",
    background: "#080808",
    flexShrink: 0,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 28, height: 28, background: "#d4935a",
        borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14,
      }}>⬡</div>
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, letterSpacing: "0.05em" }}>
        <strong>SPATIAL</strong> HOMES
      </span>
    </div>

    <nav style={{ display: "flex", gap: 0 }}>
      <button className={`nav-item ${step === "upload" ? "active" : ""}`}>Upload Room</button>
      <button className={`nav-item ${step === "designer" ? "active" : ""}`}>Designer</button>
      <button className="nav-item desktop-only">Saved Projects</button>
      <button className="nav-item desktop-only">Export</button>
    </nav>

    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      {step !== "upload" && step !== "designer" && <StepDots current={step} />}
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#444" }}>?</div>
    </div>
  </header>

  {/* Main content */}
  <main className="main-content">
    {step === "designer" ? (
      <div className="designer-container">
        <DesignerView
          photo={roomData.photo}
          roomData={roomData}
          onBack={() => setStep("occlusion")}
        />
      </div>
    ) : (
      <div className="step-container">
        <div className="step-content">
          {step === "upload" && (
            <UploadStep onNext={(photo) => goTo("floor", { photo })} />
          )}
          {step === "floor" && (
            <FloorStep photo={roomData.photo} onNext={(corners) => goTo("scale", { corners })} onBack={() => setStep("upload")} />
          )}
          {step === "scale" && (
            <ScaleStep photo={roomData.photo} corners={roomData.corners} onNext={(scale) => goTo("light", { scale })} onBack={() => setStep("floor")} />
          )}
          {step === "light" && (
            <LightStep photo={roomData.photo} onNext={(light) => goTo("occlusion", { light })} onBack={() => setStep("scale")} />
          )}
          {step === "occlusion" && (
            <OcclusionStep photo={roomData.photo} onNext={(occlusion) => goTo("designer", { occlusion })} onBack={() => setStep("light")} />
          )}
        </div>
      </div>
    )}
  </main>
</div>
);
}
