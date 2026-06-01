/* ============================================================
   Writed. — Dashboard + Project (folder) view
   ============================================================ */

function TopBar({ user, store, nav, onTheme, right }) {
  return (
    <header className="topbar">
      <div className="topbar-l">
        <StatsDot store={store} nav={nav} />
      </div>
      <div className="topbar-c"></div>
      <div className="topbar-r">
        {right}
        <button className="user-chip" onClick={() => nav.profile()} title="Профиль">
          <span className="user-ava mono">
            {user.avatar
              ? <img src={user.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} />
              : (user.name || "А").trim().charAt(0).toUpperCase()
            }
          </span>
          <span className="user-name">{user.name || "Автор"}</span>
        </button>
        <ThemeToggle theme={user.theme} onChange={onTheme} />
      </div>
    </header>
  );
}

/* ---- Confirm delete dialog ---- */
function ConfirmDelete({ title, what, onConfirm, onCancel }) {
  return (
    <div className="modal-scrim" onMouseDown={onCancel}>
      <div className="confirm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="confirm-icon"><Icon name="trash" size={22} /></div>
        <div className="confirm-title">Удалить {what}?</div>
        <div className="confirm-name">«{title}»</div>
        <p className="confirm-note mono">Это действие необратимо. Все данные будут утеряны.</p>
        <div className="confirm-actions">
          <button className="btn btn--ghost" onClick={onCancel}>Отмена</button>
          <button className="btn btn--danger" onClick={onConfirm}><Icon name="trash" size={15}/> Удалить</button>
        </div>
      </div>
    </div>
  );
}

/* ---- Sort options + helper ---- */
const SORTS = [
  ["created_desc", "Сначала новые"],
  ["created_asc",  "Сначала старые"],
  ["updated_desc", "Недавно изменённые"],
  ["title_asc",    "По названию · А–Я"],
];
function sortItems(arr, sort) {
  const c = (x) => x.createdAt || x.updatedAt || 0;
  const u = (x) => x.updatedAt || x.createdAt || 0;
  const out = arr.slice();
  switch (sort) {
    case "created_asc":  out.sort((a, b) => c(a) - c(b)); break;
    case "updated_desc": out.sort((a, b) => u(b) - u(a)); break;
    case "title_asc":    out.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ru")); break;
    case "created_desc":
    default:             out.sort((a, b) => c(b) - c(a)); break;
  }
  return out;
}

/* ---- Sort dropdown menu ---- */
function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const cur = SORTS.find((s) => s[0] === value) || SORTS[0];
  return (
    <div className="sortmenu">
      <button className={"sortmenu-btn" + (open ? " on" : "")} onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open} title="Сортировка">
        <Icon name="sort" size={15} />
        <span className="sortmenu-cur">{cur[1]}</span>
        <Icon name="chevron" size={13} className={"sortmenu-chev" + (open ? " open" : "")} />
      </button>
      {open && (
        <React.Fragment>
          <div className="sortmenu-scrim" onClick={() => setOpen(false)} />
          <div className="sortmenu-pop" role="listbox">
            <div className="sortmenu-pop-h mono">Сортировать</div>
            {SORTS.map(([k, l]) => (
              <button key={k} role="option" aria-selected={value === k}
                className={"sortmenu-opt" + (value === k ? " on" : "")}
                onClick={() => { onChange(k); setOpen(false); }}>
                <span>{l}</span>
                {value === k && <Icon name="check" size={14} />}
              </button>
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function Dashboard({ store, user, nav, onTheme }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("created_desc");
  const [deleteTarget, setDeleteTarget] = useState(null); // {kind, id, title}
  const s = store.get();
  const stats = store.stats();

  const showProjects = typeFilter !== "notes";
  const showNotes = typeFilter !== "projects";

  let projects = s.projects.filter((p) => statusFilter === "all" ? true : p.status === (statusFilter === "done" ? "done" : "draft"));
  let notes = statusFilter === "done" ? [] : s.notes;
  projects = showProjects ? sortItems(projects, sort) : [];
  notes = showNotes ? sortItems(notes, sort) : [];

  const hour = new Date().getHours();
  const greet = hour < 5 ? "Доброй ночи" : hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  function handleDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "project") store.deleteProject(deleteTarget.id);
    else store.deleteNote(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="app-shell screen-enter">
      <TopBar user={user} store={store} nav={nav} onTheme={onTheme} />
      <div className="scroll-area">
        <div className="wrap">

          <section className="dash-hero">
            <div>
              <div className="eyebrow">{greet}, {user.name || "Автор"}</div>
              <h1 className="dash-title">Что напишем<br />сегодня<span style={{ color: "var(--accent)" }}>?</span></h1>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-num mono">{stats.words.toLocaleString("ru-RU")}</div>
              <div className="dash-stat-lbl mono">слов всего · {stats.projects} {plural(stats.projects,"проект","проекта","проектов")} · {stats.notes} {plural(stats.notes,"заметка","заметки","заметок")}</div>
            </div>
          </section>

          <div className="dash-actions">
            <button className="bigaction" onClick={() => nav.createProject()}>
              <Icon name="folder" size={22} />
              <div><span className="bigaction-t">Новый проект</span><span className="bigaction-s mono">книга · главы</span></div>
              <Icon name="plus" size={18} className="bigaction-plus" />
            </button>
            <button className="bigaction" onClick={() => nav.createNote()}>
              <Icon name="note" size={22} />
              <div><span className="bigaction-t">Новая заметка</span><span className="bigaction-s mono">одиночный лист</span></div>
              <Icon name="plus" size={18} className="bigaction-plus" />
            </button>
          </div>

          <div className="dash-filter">
            <div className="dash-filter-segs">
              <div className="filtergrp">
                <span className="filtergrp-l mono">тип</span>
                <div className="seg seg--sm" role="group" aria-label="Тип">
                  {[["all","Всё"],["projects","Проекты"],["notes","Заметки"]].map(([k,l]) => (
                    <button key={k} className={"seg-btn" + (typeFilter === k ? " on" : "")} onClick={() => setTypeFilter(k)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="filtergrp">
                <span className="filtergrp-l mono">статус</span>
                <div className="seg seg--sm" role="group" aria-label="Статус">
                  {[["all","Все"],["draft","Черновики"],["done","Завершённые"]].map(([k,l]) => (
                    <button key={k} className={"seg-btn" + (statusFilter === k ? " on" : "")} onClick={() => setStatusFilter(k)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
            <SortMenu value={sort} onChange={setSort} />
          </div>

          {projects.length > 0 && (
            <section className="dash-section">
              <div className="section-head"><span className="eyebrow">Проекты</span><span className="rule-thin section-rule" /></div>
              <div className="card-grid">
                {projects.map((p, i) => (
                  <ProjectCard key={p.id} p={p} store={store} nav={nav} idx={i}
                    onDelete={() => setDeleteTarget({ kind: "project", id: p.id, title: p.title })} />
                ))}
              </div>
            </section>
          )}

          {notes.length > 0 && (
            <section className="dash-section">
              <div className="section-head"><span className="eyebrow">Заметки</span><span className="rule-thin section-rule" /></div>
              <div className="card-grid">
                {notes.map((n, i) => (
                  <NoteCard key={n.id} n={n} nav={nav} idx={i}
                    onDelete={() => setDeleteTarget({ kind: "note", id: n.id, title: n.title })} />
                ))}
              </div>
            </section>
          )}

          {!projects.length && !notes.length && (
            <div className="empty mono">Здесь пока пусто. Начните с нового проекта.</div>
          )}

          <footer className="dash-foot mono">
            хранится локально на этом устройстве · <Icon name="check" size={13} style={{display:"inline",verticalAlign:"-2px"}} /> persistent storage
          </footer>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDelete
          title={deleteTarget.title}
          what={deleteTarget.kind === "project" ? "проект" : "заметку"}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function ProgressBar({ value, max, accent }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return <div className="pbar"><span style={{ width: pct + "%", background: accent ? "var(--accent)" : "var(--ink)" }} /></div>;
}

function ProjectCard({ p, store, nav, idx, onDelete }) {
  const words = store.projectWords(p);
  const goal = Math.max(2000, Math.ceil(words / 1000) * 1000 + 1000);
  return (
    <div className="card card--project fade-up" style={{ animationDelay: idx * 60 + "ms" }}>
      <div className="card-inner" role="button" tabIndex={0}
        onClick={() => nav.project(p.id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && nav.project(p.id)}>
        <div className="card-top">
          <Icon name="folder" size={18} />
          <span className={"chip mono " + (p.status === "done" ? "chip--done" : "chip--draft")}>
            {p.status === "done" ? "завершён" : "черновик"}
          </span>
          <button className="card-delete" title="Удалить проект" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Icon name="trash" size={15} />
          </button>
        </div>
        <h3 className="card-title">{p.title}</h3>
        {p.synopsis && <p className="card-syn">{p.synopsis}</p>}
        <div className="card-bottom">
          <div className="card-meta mono">
            <span>{p.chapters.length} {plural(p.chapters.length,"глава","главы","глав")}</span>
            <span className="dotsep">·</span>
            <span>{words.toLocaleString("ru-RU")} слов</span>
          </div>
          <ProgressBar value={words} max={goal} accent={p.status==="done"} />
          <div className="card-time mono"><Icon name="clock" size={12} /> {timeAgo(p.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
}

function NoteCard({ n, nav, idx, onDelete }) {
  const text = (n.content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return (
    <div className="card card--note fade-up" style={{ animationDelay: idx * 60 + "ms" }}>
      <div className="card-inner" role="button" tabIndex={0}
        onClick={() => nav.doc(n.id)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && nav.doc(n.id)}>
        <div className="card-top">
          <Icon name="note" size={18} />
          <button className="card-delete" title="Удалить заметку" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Icon name="trash" size={15} />
          </button>
        </div>
        <h3 className="card-title card-title--note">{n.title}</h3>
        <p className="card-syn card-syn--note">{text || "пустая заметка"}</p>
        <div className="card-time mono"><Icon name="clock" size={12} /> {timeAgo(n.updatedAt)}</div>
      </div>
    </div>
  );
}

/* ----------------------- PROJECT (folder) ----------------------- */
function ProjectView({ store, user, nav, onTheme, projectId }) {
  const s = store.get();
  const p = s.projects.find((x) => x.id === projectId);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [editTitle, setEditTitle] = useState(false);
  const [editSynopsis, setEditSynopsis] = useState(false);
  const [deleteChap, setDeleteChap] = useState(null); // {id, title}
  const [deleteProject, setDeleteProject] = useState(false);

  if (!p) { return <div className="app-shell"><TopBar user={user} store={store} nav={nav} onTheme={onTheme} /><div className="empty mono">Проект не найден</div></div>; }

  const words = store.projectWords(p);
  const goal = Math.max(3000, Math.ceil(words / 5000) * 5000 + 5000);

  function onDrop(targetId) {
    if (!dragId || dragId === targetId) { setDragId(null); setOverId(null); return; }
    const ids = p.chapters.map((c) => c.id);
    const from = ids.indexOf(dragId), to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    store.reorderChapters(p.id, ids);
    setDragId(null); setOverId(null);
  }

  function handleDeleteChap() {
    if (!deleteChap) return;
    store.deleteChapter(p.id, deleteChap.id);
    setDeleteChap(null);
  }

  function handleDeleteProject() {
    store.deleteProject(p.id);
    nav.dashboard();
  }

  return (
    <div className="app-shell screen-enter">
      <TopBar user={user} store={store} nav={nav} onTheme={onTheme}
        right={<button className="btn btn--ghost" onClick={() => nav.export(p.id)}><Icon name="book" size={16} /> Собрать книгу</button>} />
      <div className="scroll-area">
        <div className="wrap">
          <button className="backlink mono" onClick={() => nav.dashboard()}><Icon name="back" size={14} /> все работы</button>

          <section className="proj-hero">
            <div className="proj-hero-main">
              <div className="eyebrow">Проект · {p.status === "done" ? "завершён" : "черновик"}</div>
              {editTitle ? (
                <input className="proj-title-input" autoFocus defaultValue={p.title}
                  onBlur={(e) => { store.updateProject(p.id, { title: e.target.value.trim() || p.title }); setEditTitle(false); }}
                  onKeyDown={(e) => e.key === "Enter" && e.target.blur()} />
              ) : (
                <h1 className="proj-title" onClick={() => setEditTitle(true)} title="Нажмите, чтобы переименовать">{p.title}</h1>
              )}
              {editSynopsis ? (
                <textarea className="proj-syn-input" autoFocus defaultValue={p.synopsis} rows={3}
                  onBlur={(e) => { store.updateProject(p.id, { synopsis: e.target.value.trim() }); setEditSynopsis(false); }}
                  onKeyDown={(e) => { if (e.key === "Escape") setEditSynopsis(false); }} />
              ) : p.synopsis ? (
                <p className="proj-syn" onClick={() => setEditSynopsis(true)} title="Нажмите для редактирования">{p.synopsis}</p>
              ) : (
                <button className="proj-syn-add mono" onClick={() => setEditSynopsis(true)}>+ добавить синопсис</button>
              )}
            </div>
            <div className="proj-hero-side">
              <div className="proj-bignum mono">{words.toLocaleString("ru-RU")}</div>
              <div className="proj-bignum-lbl mono">слов · цель {goal.toLocaleString("ru-RU")}</div>
              <ProgressBar value={words} max={goal} accent={p.status==="done"} />
              <button className={"status-toggle mono" + (p.status==="done"?" on":"")}
                onClick={() => store.updateProject(p.id, { status: p.status === "done" ? "draft" : "done" })}>
                <Icon name="check" size={14} /> {p.status === "done" ? "завершён" : "отметить завершённым"}
              </button>
              <button className="status-toggle mono proj-delete-btn" onClick={() => setDeleteProject(true)}>
                <Icon name="trash" size={14} /> удалить проект
              </button>
            </div>
          </section>

          <div className="section-head"><span className="eyebrow">Главы</span><span className="rule-thin section-rule" />
            <button className="addchap mono" onClick={() => { const id = store.addChapter(p.id); nav.doc(id); }}><Icon name="plus" size={14} /> Добавить главу</button>
          </div>

          <ol className="chap-list">
            {p.chapters.map((c, i) => {
              const cw = store.countWords(c.content);
              return (
                <li key={c.id} draggable
                  className={"chap" + (dragId === c.id ? " dragging" : "") + (overId === c.id ? " over" : "")}
                  onDragStart={() => setDragId(c.id)}
                  onDragOver={(e) => { e.preventDefault(); setOverId(c.id); }}
                  onDragLeave={() => setOverId((o) => o === c.id ? null : o)}
                  onDrop={() => onDrop(c.id)}
                  onDragEnd={() => { setDragId(null); setOverId(null); }}
                  onClick={() => nav.doc(c.id)}>
                  <span className="chap-grip" onClick={(e)=>e.stopPropagation()}><Icon name="drag" size={16} /></span>
                  <span className="chap-num mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="chap-title">{c.title}</span>
                  <span className="chap-words mono">{cw.toLocaleString("ru-RU")} слов</span>
                  <span className="chap-time mono">{timeAgo(c.updatedAt)}</span>
                  <span className="chap-del" onClick={(e) => { e.stopPropagation(); setDeleteChap({ id: c.id, title: c.title }); }}
                    title="Удалить главу"><Icon name="trash" size={15} /></span>
                  <span className="chap-open"><Icon name="forward" size={16} /></span>
                </li>
              );
            })}
            {!p.chapters.length && (
              <li className="chap-empty mono">Ни одной главы. <button onClick={() => { const id = store.addChapter(p.id); nav.doc(id); }}>Создайте первую →</button></li>
            )}
          </ol>
          <div style={{ height: 60 }} />
        </div>
      </div>

      {deleteChap && (
        <ConfirmDelete
          title={deleteChap.title}
          what="главу"
          onConfirm={handleDeleteChap}
          onCancel={() => setDeleteChap(null)}
        />
      )}
      {deleteProject && (
        <ConfirmDelete
          title={p.title}
          what="проект"
          onConfirm={handleDeleteProject}
          onCancel={() => setDeleteProject(false)}
        />
      )}
    </div>
  );
}

Object.assign(window, { TopBar, Dashboard, ProjectView, ProgressBar, ConfirmDelete });
