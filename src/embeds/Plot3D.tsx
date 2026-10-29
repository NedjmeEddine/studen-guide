import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCw, Grid, RotateCcw } from "lucide-react";

// Safe zero-eval 1D math evaluator (t) -> number
function parseMath1D(expr: string): (t: number) => number {
  const s = expr.replace(/\s+/g, "").toLowerCase();
  let pos = 0;

  function parseExpr(t: number): number {
    let val = parseTerm(t);
    while (pos < s.length && (s[pos] === "+" || s[pos] === "-")) {
      const op = s[pos++];
      const right = parseTerm(t);
      val = op === "+" ? val + right : val - right;
    }
    return val;
  }

  function parseTerm(t: number): number {
    let val = parseFactor(t);
    while (pos < s.length && (s[pos] === "*" || s[pos] === "/")) {
      const op = s[pos++];
      const right = parseFactor(t);
      val = op === "*" ? val * right : val / right;
    }
    return val;
  }

  function parseFactor(t: number): number {
    let val = parseUnary(t);
    if (pos < s.length && s[pos] === "^") {
      pos++;
      const right = parseFactor(t);
      val = Math.pow(val, right);
    }
    return val;
  }

  function parseUnary(t: number): number {
    if (pos < s.length && s[pos] === "-") {
      pos++;
      return -parseUnary(t);
    }
    if (pos < s.length && s[pos] === "+") {
      pos++;
      return parseUnary(t);
    }
    return parsePrimary(t);
  }

  function parsePrimary(t: number): number {
    if (s[pos] === "(") {
      pos++;
      const val = parseExpr(t);
      if (s[pos] === ")") pos++;
      return val;
    }
    const numMatch = s.slice(pos).match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/);
    if (numMatch) {
      pos += numMatch[0].length;
      return parseFloat(numMatch[0]);
    }
    const idMatch = s.slice(pos).match(/^[a-z_]\w*/);
    if (idMatch) {
      const id = idMatch[0];
      pos += id.length;
      if (id === "t" || id === "x") return t;
      if (id === "pi") return Math.PI;
      if (id === "e") return Math.E;
      if (s[pos] === "(") {
        pos++;
        const args: number[] = [];
        if (s[pos] !== ")") {
          args.push(parseExpr(t));
          while (pos < s.length && s[pos] === ",") {
            pos++;
            args.push(parseExpr(t));
          }
        }
        if (s[pos] === ")") pos++;
        switch (id) {
          case "sin":
            return Math.sin(args[0]);
          case "cos":
            return Math.cos(args[0]);
          case "tan":
            return Math.tan(args[0]);
          case "asin":
            return Math.asin(args[0]);
          case "acos":
            return Math.acos(args[0]);
          case "atan":
            return Math.atan(args[0]);
          case "exp":
            return Math.exp(args[0]);
          case "log":
          case "ln":
            return Math.log(args[0]);
          case "sqrt":
            return Math.sqrt(args[0]);
          case "abs":
            return Math.abs(args[0]);
          case "max":
            return Math.max(...args);
          case "min":
            return Math.min(...args);
          case "pow":
            return Math.pow(args[0], args[1]);
          default:
            return NaN;
        }
      }
    }
    pos++;
    return NaN;
  }

  return (t: number) => {
    pos = 0;
    try {
      const res = parseExpr(t);
      return Number.isFinite(res) ? res : 0;
    } catch {
      return 0;
    }
  };
}

// Safe zero-eval 2D math evaluator (x, y) -> z
function parseMath2D(expr: string): (x: number, y: number) => number {
  const s = expr.replace(/\s+/g, "").toLowerCase();
  let pos = 0;

  function parseExpr(x: number, y: number): number {
    let val = parseTerm(x, y);
    while (pos < s.length && (s[pos] === "+" || s[pos] === "-")) {
      const op = s[pos++];
      const right = parseTerm(x, y);
      val = op === "+" ? val + right : val - right;
    }
    return val;
  }

  function parseTerm(x: number, y: number): number {
    let val = parseFactor(x, y);
    while (pos < s.length && (s[pos] === "*" || s[pos] === "/")) {
      const op = s[pos++];
      const right = parseFactor(x, y);
      val = op === "*" ? val * right : val / right;
    }
    return val;
  }

  function parseFactor(x: number, y: number): number {
    let val = parseUnary(x, y);
    if (pos < s.length && s[pos] === "^") {
      pos++;
      const right = parseFactor(x, y);
      val = Math.pow(val, right);
    }
    return val;
  }

  function parseUnary(x: number, y: number): number {
    if (pos < s.length && s[pos] === "-") {
      pos++;
      return -parseUnary(x, y);
    }
    if (pos < s.length && s[pos] === "+") {
      pos++;
      return parseUnary(x, y);
    }
    return parsePrimary(x, y);
  }

  function parsePrimary(x: number, y: number): number {
    if (s[pos] === "(") {
      pos++;
      const val = parseExpr(x, y);
      if (s[pos] === ")") pos++;
      return val;
    }
    const numMatch = s.slice(pos).match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/);
    if (numMatch) {
      pos += numMatch[0].length;
      return parseFloat(numMatch[0]);
    }
    const idMatch = s.slice(pos).match(/^[a-z_]\w*/);
    if (idMatch) {
      const id = idMatch[0];
      pos += id.length;
      if (id === "x") return x;
      if (id === "y") return y;
      if (id === "pi") return Math.PI;
      if (id === "e") return Math.E;
      if (s[pos] === "(") {
        pos++;
        const args: number[] = [];
        if (s[pos] !== ")") {
          args.push(parseExpr(x, y));
          while (pos < s.length && s[pos] === ",") {
            pos++;
            args.push(parseExpr(x, y));
          }
        }
        if (s[pos] === ")") pos++;
        switch (id) {
          case "sin":
            return Math.sin(args[0]);
          case "cos":
            return Math.cos(args[0]);
          case "tan":
            return Math.tan(args[0]);
          case "asin":
            return Math.asin(args[0]);
          case "acos":
            return Math.acos(args[0]);
          case "atan":
            return Math.atan(args[0]);
          case "exp":
            return Math.exp(args[0]);
          case "log":
          case "ln":
            return Math.log(args[0]);
          case "sqrt":
            return Math.sqrt(args[0]);
          case "abs":
            return Math.abs(args[0]);
          case "max":
            return Math.max(...args);
          case "min":
            return Math.min(...args);
          case "pow":
            return Math.pow(args[0], args[1]);
          default:
            return NaN;
        }
      }
    }
    pos++;
    return NaN;
  }

  return (x: number, y: number) => {
    pos = 0;
    try {
      const res = parseExpr(x, y);
      return Number.isFinite(res) ? res : 0;
    } catch {
      return 0;
    }
  };
}

export type Vec3D = { x: number; y: number; z: number; label?: string; color: string };
export type Curve3D = {
  xExpr: string;
  yExpr: string;
  zExpr: string;
  min: number;
  max: number;
  label?: string;
  color: string;
};
export type Surface3D = { expr: string; min: number; max: number };

export function parsePlot3D(code: string) {
  let title = "";
  const vectors: Vec3D[] = [];
  const curves: Curve3D[] = [];
  let surface: Surface3D | null = null;

  for (const raw of code.split("\n")) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith("#")) {
      if (!title) title = l.replace(/^#\s*/, "").trim();
      continue;
    }

    // 1. Vector: vector: x, y, z [label="..."] [color="..."]
    const vecMatch = l.match(
      /^vector:\s*(-?[\d.e+-]+)\s*,\s*(-?[\d.e+-]+)\s*,\s*(-?[\d.e+-]+)(.*)$/i,
    );
    if (vecMatch) {
      const rest = vecMatch[4];
      const lbl = rest.match(/label=["'](.*?)["']/i);
      const col = rest.match(/color=["'](.*?)["']/i);
      vectors.push({
        x: parseFloat(vecMatch[1]),
        y: parseFloat(vecMatch[2]),
        z: parseFloat(vecMatch[3]),
        label: lbl ? lbl[1] : undefined,
        color: col ? col[1] : "#38bdf8",
      });
      continue;
    }

    // 2. Space Curve: curve: x = expr, y = expr, z = expr [from a to b]
    const crvMatch = l.match(
      /^curve:\s*x\s*=\s*(.+?)\s*,\s*y\s*=\s*(.+?)\s*,\s*z\s*=\s*(.+?)(?:\s+from\s+(-?[\d.e+-]+)\s+to\s+(-?[\d.e+-]+))?(.*)$/i,
    );
    if (crvMatch) {
      const rest = crvMatch[6] || "";
      const lbl = rest.match(/label=["'](.*?)["']/i);
      const col = rest.match(/color=["'](.*?)["']/i);
      curves.push({
        xExpr: crvMatch[1].trim(),
        yExpr: crvMatch[2].trim(),
        zExpr: crvMatch[3].trim(),
        min: crvMatch[4] ? parseFloat(crvMatch[4]) : 0,
        max: crvMatch[5] ? parseFloat(crvMatch[5]) : 20,
        label: lbl ? lbl[1] : undefined,
        color: col ? col[1] : "#22c55e",
      });
      continue;
    }

    // 3. Surface: z = expr [from a to b]
    const surfMatch = l.match(/^z\s*=\s*(.+?)(?:\s+from\s+(-?[\d.e+-]+)\s+to\s+(-?[\d.e+-]+))?$/i);
    if (surfMatch) {
      surface = {
        expr: surfMatch[1].trim(),
        min: surfMatch[2] ? parseFloat(surfMatch[2]) : -2,
        max: surfMatch[3] ? parseFloat(surfMatch[3]) : 2,
      };
    }
  }

  // Default fallback if no directive matched but lines exist
  if (!surface && !vectors.length && !curves.length) {
    surface = { expr: "x^2 - y^2", min: -2, max: 2 };
  }

  return { title, vectors, curves, surface };
}

export function Plot3D({ code }: { code: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [loading, setLoading] = useState(true);
  const controlsRef = useRef<unknown>(null);
  const materialsRef = useRef<unknown[]>([]);

  const { title, vectors, curves, surface } = useMemo(() => parsePlot3D(code), [code]);

  useEffect(() => {
    let dead = false;
    let animId: number;

    const initThree = async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

        if (dead || !mountRef.current) return;
        mountRef.current.innerHTML = "";

        const width = mountRef.current.clientWidth || 640;
        const height = 380;

        // Scene & Camera
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#090d16");

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(5.5, 4.5, 6.5);

        // WebGL Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 1.6;
        controlsRef.current = controls;

        // Ground Reference Grid & Axes
        const gridHelper = new THREE.GridHelper(6, 12, 0x38bdf8, 0x1e293b);
        gridHelper.position.y = -1.5;
        scene.add(gridHelper);

        const axesHelper = new THREE.AxesHelper(3);
        axesHelper.position.set(-2.5, -1.5, -2.5);
        scene.add(axesHelper);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        materialsRef.current = [];

        // 1. Render Surface (if defined)
        if (surface) {
          const segments = 55;
          const geom = new THREE.PlaneGeometry(5, 5, segments, segments);
          geom.rotateX(-Math.PI / 2);

          const evaluator = parseMath2D(surface.expr);
          const posAttr = geom.attributes.position;
          const count = posAttr.count;

          let zMin = Infinity;
          let zMax = -Infinity;
          const zVals: number[] = new Array(count);

          for (let i = 0; i < count; i++) {
            const px = posAttr.getX(i);
            const pz = posAttr.getZ(i);

            const mathX = surface.min + ((px + 2.5) / 5) * (surface.max - surface.min);
            const mathY = surface.min + ((pz + 2.5) / 5) * (surface.max - surface.min);

            const mathZ = evaluator(mathX, mathY);
            zVals[i] = mathZ;
            if (mathZ < zMin) zMin = mathZ;
            if (mathZ > zMax) zMax = mathZ;
          }

          const zRange = zMax - zMin || 1;
          const colors = new Float32Array(count * 3);

          for (let i = 0; i < count; i++) {
            const scaledY = ((zVals[i] - zMin) / zRange) * 2.2 - 1.1;
            posAttr.setY(i, scaledY);

            // Plasma/Viridis gradient
            const t = Math.max(0, Math.min(1, (zVals[i] - zMin) / zRange));
            const color = new THREE.Color();
            color.setHSL(0.7 - t * 0.7, 0.95, 0.52);

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
          }

          geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          geom.computeVertexNormals();

          const surfMaterial = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.35,
            metalness: 0.15,
            wireframe,
            side: THREE.DoubleSide,
          });
          materialsRef.current.push(surfMaterial);

          const mesh = new THREE.Mesh(geom, surfMaterial);
          scene.add(mesh);
        }

        // 2. Render Space Curves & Trajectories (if defined)
        for (const crv of curves) {
          const fx = parseMath1D(crv.xExpr);
          const fy = parseMath1D(crv.yExpr);
          const fz = parseMath1D(crv.zExpr);

          const points: InstanceType<typeof THREE.Vector3>[] = [];
          const stepCount = 120;
          for (let i = 0; i <= stepCount; i++) {
            const t = crv.min + (i / stepCount) * (crv.max - crv.min);
            points.push(new THREE.Vector3(fx(t), fz(t) * 0.5, fy(t)));
          }

          if (points.length > 2) {
            const curvePath = new THREE.CatmullRomCurve3(points);
            const tubeGeom = new THREE.TubeGeometry(curvePath, 120, 0.08, 8, false);
            const tubeMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(crv.color),
              roughness: 0.2,
              metalness: 0.4,
              wireframe,
            });
            materialsRef.current.push(tubeMat);

            const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
            scene.add(tubeMesh);
          }
        }

        // 3. Render 3D Vectors (if defined)
        if (vectors.length > 0) {
          const originGeom = new THREE.SphereGeometry(0.12, 16, 16);
          const originMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          scene.add(new THREE.Mesh(originGeom, originMat));

          for (const v of vectors) {
            const dir = new THREE.Vector3(v.x, v.z, v.y);
            const len = Math.max(0.5, dir.length());
            dir.normalize();

            const hexColor = new THREE.Color(v.color).getHex();
            const arrow = new THREE.ArrowHelper(
              dir,
              new THREE.Vector3(0, 0, 0),
              len,
              hexColor,
              0.4,
              0.25,
            );
            scene.add(arrow);
          }
        }

        setLoading(false);

        // Animation Loop
        const animate = () => {
          if (dead) return;
          animId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        // Responsive Resize
        const handleResize = () => {
          if (!mountRef.current) return;
          const newW = mountRef.current.clientWidth;
          camera.aspect = newW / height;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, height);
        };
        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
          cancelAnimationFrame(animId);
          renderer.dispose();
        };
      } catch (e) {
        console.error("Three.js init error:", e);
      }
    };

    initThree();

    return () => {
      dead = true;
      if (animId) cancelAnimationFrame(animId);
    };
  }, [surface, curves, vectors]);

  // Dynamic Controls
  const toggleWireframe = () => {
    setWireframe((prev) => {
      const next = !prev;
      for (const m of materialsRef.current) {
        if (m && typeof m === "object" && "wireframe" in m) {
          (m as { wireframe: boolean }).wireframe = next;
        }
      }
      return next;
    });
  };

  const toggleRotate = () => {
    setAutoRotate((prev) => {
      const next = !prev;
      if (controlsRef.current) {
        (controlsRef.current as { autoRotate: boolean }).autoRotate = next;
      }
      return next;
    });
  };

  const resetCamera = () => {
    if (controlsRef.current) {
      (controlsRef.current as { reset: () => void }).reset();
    }
  };

  // Caption summary
  const subCaption = useMemo(() => {
    const parts: string[] = [];
    if (surface) parts.push(`z = ${surface.expr}`);
    if (curves.length) parts.push(`${curves.length} Space Curve(s)`);
    if (vectors.length) parts.push(`${vectors.length} Vector(s)`);
    return parts.join(" · ");
  }, [surface, curves, vectors]);

  return (
    <figure className="ss-embed" data-embed="plot3d">
      <div className="ss-3d-header">
        <div>
          {title && <figcaption className="ss-embed-cap">{title}</figcaption>}
          <span className="ss-3d-expr">{subCaption}</span>
        </div>
        <div className="ss-3d-controls">
          <button
            type="button"
            className={`ss-3d-btn ${autoRotate ? "active" : ""}`}
            onClick={toggleRotate}
            title="Toggle continuous auto-rotation"
          >
            <RotateCw size={13} /> {autoRotate ? "Spin On" : "Spin Off"}
          </button>
          <button
            type="button"
            className={`ss-3d-btn ${wireframe ? "active" : ""}`}
            onClick={toggleWireframe}
            title="Toggle wireframe mesh mode"
          >
            <Grid size={13} /> {wireframe ? "Solid" : "Wireframe"}
          </button>
          <button
            type="button"
            className="ss-3d-btn"
            onClick={resetCamera}
            title="Reset 3D camera position"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>
      <div className="ss-3d-viewport-wrap">
        <div ref={mountRef} className="ss-3d-canvas" />
        {loading && <div className="ss-3d-loading">Rendering 3D WebGL Surface…</div>}
        <div className="ss-3d-hint">Drag to rotate in 3D · Scroll / Pinch to zoom</div>
      </div>
    </figure>
  );
}
