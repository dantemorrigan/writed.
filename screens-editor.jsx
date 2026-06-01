/* ============================================================
   Writed. — Editor (+ docked terminal, focus)
   ============================================================ */
function useDebouncedSave(docId, store) {
  const t = useRef(null);
  return useCallback((content) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => store.updateDoc(docId, { content }), 500);
  }, [docId, store]);
}

const FONT_MAP = { book: "var(--book)", article: "var(--book-alt)", mono: "var(--mono)" };
const FONT_LABEL = { book: "Newsreader", article: "Spectral", mono: "JetBrains Mono" };

function Editor({ store, user, nav, onTheme, docId, apiRef }) {
  const found = store.findDoc(docId);
  const ref = useRef(null);
  const scrollRef = useRef(null);
  const saved = useRef(null);
  const [panel, setPanel] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [mode, setMode] = useState("edit");     // edit | preview
  const [edition, setEdition] = useState("novel");
  const [active, setActive] = useState({});
  const [words, setWords] = useState(0);
  const [renaming, setRenaming] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const doSave = useDebouncedSave(docId, store);

  const doc = found && found.doc;
  const project = found && found.project;

  // initial content load (only when doc id changes)
  useEffect(() => {
    if (ref.current && doc) {
      ref.current.innerHTML = doc.content || "<p><br></p>";
      saved.current = doc.content;
      setWords(store.countWords(doc.content));
      setTimeout(() => ref.current && ref.current.focus(), 60);
    }
  }, [docId]);

  // when returning to the editor (same doc, mode toggled) the contentEditable
  // node is freshly mounted — restore the latest content so text never vanishes
  useEffect(() => {
    if (mode === "edit" && ref.current) {
      ref.current.innerHTML = saved.current || (doc && doc.content) || "<p><br></p>";
      setTimeout(() => ref.current && ref.current.focus(), 40);
    }
  }, [mode]);

  // capture current text before leaving the editor surface
  function switchMode(m) {
    if (mode === "edit" && ref.current) {
      saved.current = ref.current.innerHTML;
      store.updateDoc(docId, { content: saved.current });
    }
    setMode(m);
  }

  const editorFontVar = FONT_MAP[user.editorFont] || FONT_MAP.book;

  // leave focus mode with Escape
  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e) => { if (e.key === "Escape") setFocusMode(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode]);

  function refreshActive() {
    try {
      const st = { bold: document.queryCommandState("bold"), italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"), strike: document.queryCommandState("strikeThrough"),
        ul: document.queryCommandState("insertUnorderedList"), ol: document.queryCommandState("insertOrderedList") };
      const sel = window.getSelection();
      let block = "";
      if (sel && sel.anchorNode) {
        let n = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
        while (n && n !== ref.current) { const tg = n.tagName && n.tagName.toLowerCase();
          if (["h1","h2","h3","blockquote","p"].includes(tg)) { block = tg; break; } n = n.parentElement; }
      }
      st.block = block;
      setActive(st);
    } catch (e) {}
  }

  function onInput() {
    const html = ref.current.innerHTML;
    setWords(store.countWords(html));
    doSave(html); saved.current = html;
  }

  function exec(cmd, val) {
    ref.current.focus();
    document.execCommand(cmd, false, val);
    onInput(); refreshActive();
  }
  function block(tag) {
    const cur = active.block;
    exec("formatBlock", cur === tag ? "p" : tag);
  }
  function saveNow() {
    if (!ref.current) return;
    store.updateDoc(docId, { content: ref.current.innerHTML });
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1400);
  }

  // expose API to the global palette
  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      run(name, rest) {
        switch (name) {
          case "bold": exec("bold"); break;
          case "italic": exec("italic"); break;
          case "underline": exec("underline"); break;
          case "strike": exec("strikeThrough"); break;
          case "h1": block("h1"); break;
          case "h2": block("h2"); break;
          case "h3": block("h3"); break;
          case "quote": block("blockquote"); break;
          case "ul": exec("insertUnorderedList"); break;
          case "ol": exec("insertOrderedList"); break;
          case "hr": exec("insertHorizontalRule"); break;
          case "save": saveNow(); break;
          case "rename": rest ? store.updateDoc(docId, { title: rest }) : setRenaming(true); break;
          case "preview": setMode("preview"); break;
          case "edit": setMode("edit"); break;
          case "focus": setFocusMode((f) => !f); break;
          case "chapter": if (project) { const id = store.addChapter(project.id, rest); nav.doc(id); } break;
          case "export": if (project) nav.export(project.id, rest); break;
          default: return false;
        }
        return true;
      }
    };
    return () => { if (apiRef) apiRef.current = null; };
  });

  if (!doc) return <div className="app-shell"><div className="empty mono">Документ не найден</div></div>;

  const tools = [
    { g: [["bold","bold"],["italic","italic"],["underline","underline"],["strike","strike"]] },
    { g: [["h1","h1"],["h2","h2"],["h3","h3"]] },
    { g: [["quote","quote"],["ul","ul"],["ol","ol"],["hr","hr"]] },
  ];

  return (
    <div className={"editor-root" + (focusMode ? " focus" : "") + (panel ? "" : " nopanel")}>
      {/* slim header */}
      <header className="ed-head">
        <div className="ed-head-l">
          <button className="icon-btn" onClick={() => project ? nav.project(project.id) : nav.dashboard()} title="Назад"><Icon name="back" size={18} /></button>
          <div className="ed-crumb">
            {project && <span className="ed-crumb-proj" onClick={() => nav.project(project.id)}>{project.title}</span>}
            {project && <span className="ed-crumb-sep mono">/</span>}
            {renaming ? (
              <input className="ed-rename" autoFocus defaultValue={doc.title}
                onBlur={(e) => { store.updateDoc(docId, { title: e.target.value.trim() || doc.title }); setRenaming(false); }}
                onKeyDown={(e) => e.key === "Enter" && e.target.blur()} />
            ) : (
              <span className="ed-crumb-doc" onClick={() => setRenaming(true)} title="Переименовать">{doc.title}</span>
            )}
          </div>
        </div>
        <div className="ed-head-r">
          <div className="modeswitch">
            <button className={"modeswitch-b" + (mode==="edit"?" on":"")} onClick={() => switchMode("edit")}><Icon name="edit" size={15} /> Редактор</button>
            <button className={"modeswitch-b" + (mode==="preview"?" on":"")} onClick={() => switchMode("preview")}><Icon name="eye" size={15} /> Превью</button>
          </div>
          {mode === "preview" && (
            <div className="seg seg--sm" style={{ display: "none" }} />
          )}
          <button className={"icon-btn" + (savedFlash ? " icon-btn--flash" : "")} onClick={saveNow} title="Сохранить"><Icon name="save" size={18} /></button>
          {project && <button className="icon-btn" onClick={() => nav.export(project.id)} title="Экспорт книги"><Icon name="export" size={18} /></button>}
          <ThemeToggle theme={user.theme} onChange={onTheme} />
          <button className={"icon-btn" + (panel?" active":"")} onClick={() => setPanel((p) => !p)} title="Панель инструментов"><Icon name="panel" size={18} /></button>
        </div>
      </header>

      <div className="ed-body">
        {/* left toolbar */}
        {mode === "edit" && (
          <aside className="ed-tools">
            {tools.map((grp, gi) => (
              <div className="ed-tools-grp" key={gi}>
                {grp.g.map(([icon, cmd]) => (
                  <button key={cmd} className={"tool" + (active[cmd] || active.block===cmd ? " on" : "")}
                    title={cmd} onMouseDown={(e) => { e.preventDefault();
                      if (["h1","h2","h3","quote"].includes(cmd)) block(cmd==="quote"?"blockquote":cmd);
                      else if (cmd==="strike") exec("strikeThrough");
                      else if (cmd==="ul") exec("insertUnorderedList");
                      else if (cmd==="ol") exec("insertOrderedList");
                      else if (cmd==="hr") exec("insertHorizontalRule");
                      else exec(cmd); }}>
                    <Icon name={icon} size={19} />
                  </button>
                ))}
              </div>
            ))}
            <div className="ed-tools-grp ed-tools-modes">
              <button className={"tool" + (focusMode?" on":"")} title="Фокус" onClick={() => setFocusMode((f)=>!f)}><Icon name="focus" size={19} /></button>
            </div>
          </aside>
        )}

        {/* writing surface OR preview */}
        {mode === "edit" ? (
          <div className="ed-scroll" ref={scrollRef}>
            <div className="sheet" style={{ "--ed-font": editorFontVar }}>
              <div className="sheet-edge" />
              <div ref={ref} className="ed-area" contentEditable suppressContentEditableWarning
                spellCheck={true}
                onInput={onInput} onKeyUp={refreshActive}
                onMouseUp={refreshActive} onFocus={refreshActive} />
            </div>
            <div style={{ height: "120px" }} />
          </div>
        ) : (
          <BookPreview html={saved.current || doc.content} title={doc.title} edition={edition} />
        )}
      </div>

      {/* word count footer */}
      <footer className="ed-foot">
        <div className="ed-foot-meta mono">
          {project ? project.title : "Заметка"} <span className="ed-foot-sep">·</span> {doc.title}
          {savedFlash && <span className="ed-foot-saved">сохранено ✓</span>}
        </div>
        <div className="ed-count mono">
          <span className={"wc" + (savedFlash?" wc--saved":"")}>{wordsLabel(words)}</span>
        </div>
      </footer>

      {focusMode && <div className="focus-hint mono">Esc — выйти из фокуса</div>}
    </div>
  );
}

window.Editor = Editor;
