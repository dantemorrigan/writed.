/* ============================================================
   Writed. — onboarding (first run)
   ============================================================ */
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("light");
  const [leaving, setLeaving] = useState(false);
  const nameRef = useRef(null);

  // preview theme live on the document
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { if (step === 1) setTimeout(() => nameRef.current && nameRef.current.focus(), 500); }, [step]);

  const go = (n) => setStep(n);
  async function finish() {
    setLeaving(true);
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
    setTimeout(() => onDone(name.trim() || "Автор", theme), 760);
  }

  // dot scale grows with the name length — "растёт от слов"
  const dotScale = 1 + Math.min(name.trim().length, 16) * 0.08;

  return (
    <div className={"onb" + (leaving ? " onb--leave" : "")}>
      {/* ambient marks */}
      <div className="onb-grid" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ left: (12.5 + i * 18.75) + "%" }} />)}
      </div>

      <div className="onb-top">
        <Logo size={20} alive />
        <div className="onb-steps mono">
          {[0, 1, 2].map((i) => <span key={i} className={"onb-pip" + (i <= step ? " on" : "")} />)}
          <span style={{ marginLeft: 12, color: "var(--ink-faint)" }}>{String(step + 1).padStart(2, "0")} / 03</span>
        </div>
      </div>

      {/* STEP 0 — welcome */}
      {step === 0 && (
        <div className="onb-stage screen-enter" key="s0">
          <div className="eyebrow onb-kicker">локально · приватно · ваше</div>
          <h1 className="onb-hero">
            Чистый лист,<br />и больше<br />ничего<span className="onb-dot" />
          </h1>
          <p className="onb-lede">
            Writed<span style={{ color: "var(--accent)" }}>.</span> — редактор для тех, кто пишет вдолгую.
            Никакого облака, никакого бэкенда. Текст остаётся на вашем устройстве — и только.
          </p>
          <button className="btn btn--solid onb-cta" onClick={() => go(1)}>
            Начать <Icon name="forward" size={16} />
          </button>
        </div>
      )}

      {/* STEP 1 — name */}
      {step === 1 && (
        <div className="onb-stage screen-enter" key="s1">
          <div className="eyebrow onb-kicker">шаг первый</div>
          <h2 className="onb-q">Как к вам<br />обращаться?</h2>
          <div className="onb-namewrap">
            <input ref={nameRef} className="onb-name" value={name} spellCheck={false}
              placeholder="ваше имя" maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go(2)} />
            <span className="onb-name-dot" style={{ transform: `scale(${dotScale})` }} />
          </div>
          <p className="onb-hint mono">точка растёт от ваших слов — это вы её оживляете</p>
          <div className="onb-actions">
            <button className="btn btn--ghost" onClick={() => go(0)}><Icon name="back" size={15} /> Назад</button>
            <button className="btn btn--solid" onClick={() => go(2)}>Дальше <Icon name="forward" size={15} /></button>
          </div>
        </div>
      )}

      {/* STEP 2 — theme */}
      {step === 2 && (
        <div className="onb-stage screen-enter" key="s2">
          <div className="eyebrow onb-kicker">шаг второй</div>
          <h2 className="onb-q">При каком свете<br />вы пишете?</h2>
          <div className="onb-themes">
            <button className={"onb-theme" + (theme === "light" ? " on" : "")} onClick={() => setTheme("light")}>
              <div className="onb-theme-pic onb-theme-pic--light">
                <span className="l l1" /><span className="l l2" /><span className="l l3" />
              </div>
              <div className="onb-theme-meta"><span>Тёплая бумага</span><Icon name={theme === "light" ? "check" : "sun"} size={16} /></div>
            </button>
            <button className={"onb-theme" + (theme === "dark" ? " on" : "")} onClick={() => setTheme("dark")}>
              <div className="onb-theme-pic onb-theme-pic--dark">
                <span className="l l1" /><span className="l l2" /><span className="l l3" />
              </div>
              <div className="onb-theme-meta"><span>Ночное письмо</span><Icon name={theme === "dark" ? "check" : "moon"} size={16} /></div>
            </button>
          </div>
          <p className="onb-hint mono">тему всегда можно сменить в настройках</p>
          <div className="onb-actions">
            <button className="btn btn--ghost" onClick={() => go(1)}><Icon name="back" size={15} /> Назад</button>
            <button className="btn btn--accent onb-finish" onClick={finish}>
              Начать писать <Icon name="forward" size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

window.Onboarding = Onboarding;
