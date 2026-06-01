/* ============================================================
   Writed. — Editor (focus mode)
   ============================================================ */
function useDebouncedSave(docId, store) {
  const t = useRef(null);
  useEffect(() => () => clearTimeout(t.current), [docId]);
  return useCallback((content) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => store.updateDoc(docId, { content }), 500);
  }, [docId, store]);
}

const FONT_MAP = { book: "var(--book)", article: "var(--book-alt)", mono: "var(--mono)" };

function Editor({ store, user, nav, onTheme, docId, apiRef, onToast }) {
  const lang = user.lang || "en";
  const tl = T(lang);
  const found = store.findDoc(docId);
  const ref = useRef(null);
  const scrollRef = useRef(null);
  const saved = useRef("");
  const [focusMode, setFocusMode] = useState(false);
  const [mode, setMode] = useState("edit");
  const [edition] = useState("novel");
  const [active, setActive] = useState({});
  const [words, setWords] = useState(0);
  const [renaming, setRenaming] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [noteExport, setNoteExport] = useState(false);
  const [kbOffset, setKbOffset] = useState(0);
  const doSave = useDebouncedSave(docId, store);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const off = window.innerHeight - vv.offsetTop - vv.height;
      setKbOffset(Math.max(0, Math.round(off)));
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => { vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update); };
  }, []);

  const doc = found && found.doc;
  const project = found && found.project;

  useEffect(() => {
    if (ref.current && doc) {
      const html = doc.content || "";
      saved.current = html;
      ref.current.innerHTML = html;
      try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) {}
      setWords(store.countWords(html));
      setTimeout(() => ref.current && ref.current.focus(), 60);
    }
  }, [docId]);

  useEffect(() => {
    if (mode === "edit" && ref.current) {
      ref.current.innerHTML = saved.current;
      setTimeout(() => ref.current && ref.current.focus(), 40);
    }
  }, [mode]);

  function switchMode(m) {
    if (mode === "edit" && ref.current) {
      saved.current = ref.current.innerHTML;
      store.updateDoc(docId, { content: saved.current });
    }
    setMode(m);
  }

  const editorFontVar = FONT_MAP[user.editorFont] || FONT_MAP.book;

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

  function handleDelete() {
    store.deleteDoc(docId);
    if (project) nav.project(project.id);
    else nav.dashboard();
  }

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

  const readMins = Math.max(1, Math.round(words / 200));

  if (!doc) return <div className="app-shell"><div className="empty mono">{tl("doc_not_found")}</div></div>;

  const tools = [
    { g: [["bold","bold"],["italic","italic"],["underline","underline"],["strike","strike"]] },
    { g: [["h1","h1"],["h2","h2"],["h3","h3"]] },
    { g: [["quote","quote"],["ul","ul"],["ol","ol"],["hr","hr"]] },
  ];

  const FONT_MAP_FAMILY = { book: "var(--book)", article: "var(--book-alt)", mono: "var(--mono)" };

  return (
    <div className={"editor-root" + (focusMode ? " focus" : "")}>
      <header className="ed-head">
        <div className="ed-head-l">
          <button className="icon-btn" onClick={() => project ? nav.project(project.id) : nav.dashboard()} title={tl("ed_back")}><Icon name="back" size={18} /></button>
          <div className="ed-crumb">
            {project && <span className="ed-crumb-proj" onClick={() => nav.project(project.id)}>{project.title}</span>}
            {project && <span className="ed-crumb-sep mono">/</span>}
            {renaming ? (
              <input className="ed-rename" autoFocus defaultValue={doc.title}
                onBlur={(e) => { store.updateDoc(docId, { title: e.target.value.trim() || doc.title }); setRenaming(false); }}
                onKeyDown={(e) => e.key === "Enter" && e.target.blur()} />
            ) : (
              <span className="ed-crumb-doc" onClick={() => setRenaming(true)} title={tl("ed_rename")}>{doc.title}</span>
            )}
          </div>
        </div>
        <div className="ed-head-r">
          <div className="modeswitch">
            <button className={"modeswitch-b" + (mode==="edit"?" on":"")} onClick={() => switchMode("edit")}><Icon name="edit" size={15} /> {tl("mode_edit")}</button>
            <button className={"modeswitch-b" + (mode==="preview"?" on":"")} onClick={() => switchMode("preview")}><Icon name="eye" size={15} /> {tl("mode_preview")}</button>
          </div>
          <button className={"icon-btn" + (savedFlash ? " icon-btn--flash" : "")} onClick={saveNow} title={tl("ed_save")}><Icon name="save" size={18} /></button>
          {project
            ? <button className="icon-btn" onClick={() => nav.export(project.id)} title={tl("ed_export_book")}><Icon name="export" size={18} /></button>
            : <button className="icon-btn" onClick={() => setNoteExport(true)} title={tl("ed_export_note")}><Icon name="export" size={18} /></button>
          }
          <button className="icon-btn icon-btn--danger" onClick={() => setConfirmDelete(true)} title={tl("ed_delete_doc")}><Icon name="trash" size={18} /></button>
          <ThemeToggle theme={user.theme} onChange={onTheme} lang={lang} />
        </div>
      </header>

      <div className="ed-body">
        <aside className={"ed-tools" + (mode !== "edit" ? " ed-tools--preview" : "")}
          style={kbOffset > 0 ? { bottom: kbOffset } : undefined}>
          {mode === "edit" && tools.map((grp, gi) => (
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
          {mode === "edit" && (
            <div className="ed-tools-grp ed-tools-fonts">
              {["book","article","mono"].map((f) => (
                <button key={f} className={"tool tool--font" + (user.editorFont===f?" on":"")}
                  title={FONT_LABEL[f]}
                  style={{ fontFamily: FONT_MAP_FAMILY[f], fontSize: 13, letterSpacing: f==="mono"?"-0.03em":"0.01em" }}
                  onMouseDown={(e) => { e.preventDefault(); store.setUser({ editorFont: f }); }}>
                  Aa
                </button>
              ))}
            </div>
          )}
          <div className="ed-tools-grp ed-tools-modes">
            <button className={"tool tool--focusdot" + (focusMode?" on":"")} title={tl("focus_mode_btn")}
              onClick={() => setFocusMode((f)=>!f)}>
              <span className={"brand-dot-btn" + (focusMode?" active":"")} />
            </button>
          </div>
          <div className="ed-tools-grp ed-tools-modetab">
            <button className={"tool" + (mode==="edit"?" on":"")} title={tl("mode_edit")}
              onMouseDown={(e) => { e.preventDefault(); switchMode("edit"); }}>
              <Icon name="edit" size={18} />
            </button>
            <button className={"tool" + (mode==="preview"?" on":"")} title={tl("mode_preview")}
              onMouseDown={(e) => { e.preventDefault(); switchMode("preview"); }}>
              <Icon name="eye" size={18} />
            </button>
          </div>
        </aside>

        <div className="ed-scroll" ref={scrollRef}
          style={{ display: mode === "edit" ? "" : "none" }}>
          <div className="sheet" style={{ "--ed-font": editorFontVar }}>
            <div className="sheet-edge" />
            <div ref={ref} className="ed-area" contentEditable suppressContentEditableWarning
              spellCheck={true}
              onInput={onInput} onKeyUp={refreshActive}
              onMouseUp={refreshActive} onFocus={refreshActive} />
          </div>
          <div style={{ height: "120px" }} />
        </div>
        {mode === "preview" && (
          <BookPreview html={saved.current || doc.content} title={doc.title} edition={edition} lang={lang} />
        )}
      </div>

      <footer className="ed-foot">
        <div className="ed-foot-meta mono">
          {project ? project.title : tl("note_label")} <span className="ed-foot-sep">·</span> {doc.title}
          {savedFlash && <span className="ed-foot-saved">{tl("saved_flash")}</span>}
        </div>
        <div className="ed-count mono">
          <span className={"wc" + (savedFlash?" wc--saved":"")}>{wordsLabel(words, lang)}</span>
          {words > 0 && <><span className="ed-foot-sep">·</span><span>≈ {readMins} {tl("read_min")}</span></>}
        </div>
      </footer>

      {focusMode && (
        <>
          <div className="focus-hint mono">{tl("focus_exit_hint")}</div>
          <button className="focus-exit-btn" onClick={() => setFocusMode(false)} title={tl("focus_exit_btn")}>
            <Icon name="close" size={18} />
          </button>
        </>
      )}

      {confirmDelete && (
        <ConfirmDelete
          title={doc.title}
          what={tl(project ? "what_chapter" : "what_note")}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          lang={lang}
        />
      )}
      {noteExport && !project && (
        <NoteExportModal
          note={{ ...doc, content: saved.current || doc.content }}
          onClose={() => setNoteExport(false)}
          onToast={onToast || (() => {})}
          lang={lang}
        />
      )}
    </div>
  );
}

window.Editor = Editor;
