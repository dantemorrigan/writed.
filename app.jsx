/* ============================================================
   Writed. — custom cursor
   ============================================================ */
function CustomCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);
  const pos = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const raf  = useRef(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ringEl = ringRef.current;
    if (!dot || !ringEl) return;

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      ring.current.x = lerp(ring.current.x, pos.current.x, 0.12);
      ring.current.y = lerp(ring.current.y, pos.current.y, 0.12);
      dot.style.transform  = `translate(calc(${pos.current.x}px - 50%), calc(${pos.current.y}px - 50%))`;
      ringEl.style.transform = `translate(calc(${ring.current.x}px - 50%), calc(${ring.current.y}px - 50%))`;
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);

    function onMove(e) { pos.current.x = e.clientX; pos.current.y = e.clientY; }

    function onOver(e) {
      const t = e.target.closest('button, a, [role="button"], label, .icon-btn, .btn');
      const isText = e.target.matches('input[type="text"], input[type="email"], input:not([type]), textarea, [contenteditable]');
      document.body.classList.toggle('cursor-hover', !!t && !isText);
      document.body.classList.toggle('cursor-text', isText);
    }

    function onDown() { document.body.classList.add('cursor-click'); }
    function onUp()   { document.body.classList.remove('cursor-click'); }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mousedown', onDown, { passive: true });
    window.addEventListener('mouseup',   onUp,   { passive: true });

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

/* ============================================================
   Writed. — splash screen
   ============================================================ */
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('out'), 900);
    const t2 = setTimeout(() => onDone(), 1500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className={`splash splash--${phase}`}>
      <div className="splash-mark">
        <span className="brand alive" style={{ fontSize: 52 }}>
          Writed<span className="dot" />
        </span>
        <div className="splash-line" />
        <span className="splash-sub">редактор для писателей</span>
      </div>
    </div>
  );
}

/* ============================================================
   Writed. — app shell + routing
   ============================================================ */
function App() {
  const store = useStore();
  const s = store.get();
  const user = s.user;
  const [splashDone, setSplashDone] = useState(false);
  const [route, setRoute] = useState(() => s.onboarded ? { name: "dashboard" } : { name: "onboarding" });
  const [exportFor, setExportFor] = useState(null);
  const [toastNode, toast] = useToast();
  const editorApi = useRef(null);

  // apply theme
  useEffect(() => { document.documentElement.setAttribute("data-theme", user.theme || "light"); }, [user.theme]);

  const setTheme = (t) => store.setUser({ theme: t });

  const nav = useMemo(() => ({
    dashboard: () => setRoute({ name: "dashboard" }),
    project: (id) => setRoute({ name: "project", id }),
    doc: (id) => setRoute({ name: "doc", id }),
    profile: () => setRoute({ name: "profile" }),
    createProject: () => { const id = store.createProject("Новый проект"); setRoute({ name: "project", id }); toast("Проект создан"); },
    createNote: () => { const id = store.createNote("Новая заметка"); setRoute({ name: "doc", id }); },
    export: (pid, fmt) => setExportFor({ pid, fmt }),
  }), [store]);

  // global shortcut: ⌘/Ctrl+S saves the open document
  useEffect(() => {
    function onKey(e) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); if (editorApi.current) editorApi.current.run("save"); }
      else if (e.key === "Escape" && exportFor) setExportFor(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exportFor]);

  if (!splashDone) {
    return (
      <>
        <CustomCursor />
        <SplashScreen onDone={() => setSplashDone(true)} />
      </>
    );
  }

  if (!s.onboarded || route.name === "onboarding") {
    return <>{toastNode}<CustomCursor /><Onboarding onDone={(name, theme) => { store.completeOnboarding(name, theme); setRoute({ name: "dashboard" }); }} /></>;
  }

  let screen;
  if (route.name === "dashboard") screen = <Dashboard store={store} user={user} nav={nav} onTheme={setTheme} />;
  else if (route.name === "project") screen = <ProjectView store={store} user={user} nav={nav} onTheme={setTheme} projectId={route.id} />;
  else if (route.name === "doc") screen = <Editor key={route.id} store={store} user={user} nav={nav} onTheme={setTheme} docId={route.id} apiRef={editorApi} />;
  else if (route.name === "profile") screen = <Profile store={store} user={user} nav={nav} onTheme={setTheme} onToast={toast} />;

  return (
    <>
      <CustomCursor />
      {screen}
      {exportFor && <ExportModal store={store} projectId={exportFor.pid} initialFormat={exportFor.fmt}
        onClose={() => setExportFor(null)} onToast={toast} />}
      {s.onboarded && !s.tourDone && route.name !== "profile" && (
        <Tour store={store} nav={nav} onFinish={() => store.completeTour()} />
      )}
      {toastNode}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
