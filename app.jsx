/* ============================================================
   Writed. — app shell + routing
   ============================================================ */
function App() {
  const store = useStore();
  const s = store.get();
  const user = s.user;
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

  if (!s.onboarded || route.name === "onboarding") {
    return <>{toastNode}<Onboarding onDone={(name, theme) => { store.completeOnboarding(name, theme); setRoute({ name: "dashboard" }); }} /></>;
  }

  let screen;
  if (route.name === "dashboard") screen = <Dashboard store={store} user={user} nav={nav} onTheme={setTheme} />;
  else if (route.name === "project") screen = <ProjectView store={store} user={user} nav={nav} onTheme={setTheme} projectId={route.id} />;
  else if (route.name === "doc") screen = <Editor key={route.id} store={store} user={user} nav={nav} onTheme={setTheme} docId={route.id} apiRef={editorApi} />;
  else if (route.name === "profile") screen = <Profile store={store} user={user} nav={nav} onTheme={setTheme} onToast={toast} />;

  return (
    <>
      {screen}
      {exportFor && <ExportModal store={store} projectId={exportFor.pid} initialFormat={exportFor.fmt}
        onClose={() => setExportFor(null)} onToast={toast} />}
      {toastNode}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
