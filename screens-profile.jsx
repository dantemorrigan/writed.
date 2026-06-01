/* ============================================================
   Writed. — Profile
   ============================================================ */
function Profile({ store, user, nav, onTheme, onToast }) {
  const stats = store.stats();
  const [name, setName] = useState(user.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef(null);
  const avatarRef = useRef(null);

  function onAvatarChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxSize = 400;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      store.setUser({ avatar: canvas.toDataURL("image/jpeg", 0.88) });
      onToast("Фото обновлено");
    };
    img.src = url;
    e.target.value = "";
  }

  function saveName() { const v = name.trim() || "Автор"; store.setUser({ name: v }); onToast("Имя сохранено"); }
  function exportBackup() {
    downloadBlob("writed-backup-" + new Date().toISOString().slice(0,10) + ".json", "application/json", store.exportAll());
    onToast("Бэкап скачан");
  }
  function onImport(e) {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { if (store.importAll(r.result)) { onToast("Данные восстановлены"); nav.dashboard(); } else onToast("Не удалось прочитать файл"); };
    r.readAsText(f); e.target.value = "";
  }
  function reset() {
    store.reset(); onToast("Данные сброшены"); nav.dashboard();
  }

  const STAT = [
    [stats.words.toLocaleString("ru-RU"), "слов написано"],
    [stats.projects, plural(stats.projects,"проект","проекта","проектов")],
    [stats.chapters, plural(stats.chapters,"глава","главы","глав")],
    [stats.notes, plural(stats.notes,"заметка","заметки","заметок")],
  ];

  return (
    <div className="app-shell screen-enter">
      <TopBar user={user} nav={nav} onTheme={onTheme} />
      <div className="scroll-area">
        <div className="wrap wrap--narrow">
          <button className="backlink mono" onClick={() => nav.dashboard()}><Icon name="back" size={14} /> на главную</button>

          <section className="prof-hero">
            <button className="prof-ava-wrap" onClick={() => avatarRef.current.click()} title="Загрузить фото">
              {user.avatar
                ? <img src={user.avatar} alt="Аватар" className="prof-ava-img" />
                : <span className="prof-ava mono">{(user.name||"А").trim().charAt(0).toUpperCase()}</span>
              }
              <span className="prof-ava-overlay"><Icon name="upload" size={20} /></span>
              <input ref={avatarRef} type="file" accept="image/*" style={{display:"none"}} onChange={onAvatarChange} />
            </button>
            <div>
              <div className="eyebrow">Профиль</div>
              <h1 className="prof-name">{user.name || "Автор"}</h1>
              <div className="prof-since mono">с нами с {new Date(user.createdAt).toLocaleDateString("ru-RU",{month:"long",year:"numeric"})}</div>
            </div>
          </section>

          <div className="prof-stats">
            {STAT.map(([n,l],i) => (
              <div className="prof-stat fade-up" key={i} style={{animationDelay:i*70+"ms"}}>
                <div className="prof-stat-n mono">{n}</div>
                <div className="prof-stat-l mono">{l}</div>
              </div>
            ))}
          </div>

          <div className="section-head"><span className="eyebrow">Настройки</span><span className="rule-thin section-rule" /></div>

          <div className="prof-set">
            <span className="prof-set-l">Имя</span>
            <div className="prof-set-c prof-name-edit">
              <input value={name} onChange={(e)=>setName(e.target.value)} onBlur={saveName}
                onKeyDown={(e)=>e.key==="Enter"&&e.target.blur()} maxLength={40} className="prof-input" />
            </div>
          </div>

          <div className="prof-set">
            <span className="prof-set-l">Тема</span>
            <div className="prof-set-c">
              <div className="seg seg--sm">
                <button className={"seg-btn"+(user.theme==="light"?" on":"")} onClick={()=>onTheme("light")}><Icon name="sun" size={14}/> Светлая</button>
                <button className={"seg-btn"+(user.theme==="dark"?" on":"")} onClick={()=>onTheme("dark")}><Icon name="moon" size={14}/> Тёмная</button>
              </div>
            </div>
          </div>

          <div className="section-head"><span className="eyebrow">Данные</span><span className="rule-thin section-rule" /></div>
          <p className="prof-note mono">Всё хранится только на этом устройстве. Сделайте резервную копию, чтобы не потерять написанное.</p>
          <div className="prof-data">
            <button className="btn btn--ghost" onClick={exportBackup}><Icon name="download" size={16}/> Экспорт бэкапа (JSON)</button>
            <button className="btn btn--ghost" onClick={()=>fileRef.current.click()}><Icon name="upload" size={16}/> Импорт бэкапа</button>
            <input ref={fileRef} type="file" accept="application/json,.json" style={{display:"none"}} onChange={onImport} />
            <button className="btn btn--danger" onClick={() => setConfirmReset(true)}><Icon name="reset" size={16}/> Сбросить всё</button>
          </div>
          <div style={{height:60}} />
        </div>
      </div>
      {confirmReset && (
        <ConfirmDelete
          title="все проекты, заметки и настройки"
          what="всё"
          onConfirm={() => { setConfirmReset(false); reset(); }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}
window.Profile = Profile;
