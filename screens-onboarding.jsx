/* ============================================================
   Writed. — onboarding (first run)
   ============================================================ */
function Onboarding({ onDone }) {
  const [step, setStep] = useState(-1);   /* -1 = language pick */
  const [lang, setLang] = useState(() => navigator.language && navigator.language.startsWith("ru") ? "ru" : "en");
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("light");
  const [leaving, setLeaving] = useState(false);
  const nameRef = useRef(null);
  const tl = T(lang);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { if (step === 1) setTimeout(() => nameRef.current && nameRef.current.focus(), 500); }, [step]);

  const go = (n) => setStep(n);
  async function finish() {
    setLeaving(true);
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
    setTimeout(() => onDone(name.trim() || tl("default_author"), theme, lang), 760);
  }

  const dotScale = 1 + Math.min(name.trim().length, 16) * 0.08;
  const totalSteps = 3;
  const stepIdx = step + 1; /* 0..3 for display */

  return (
    <div className={"onb" + (leaving ? " onb--leave" : "")}>
      <div className="onb-grid" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ left: (12.5 + i * 18.75) + "%" }} />)}
      </div>

      <div className="onb-top">
        <Logo size={20} alive />
        <div className="onb-steps mono">
          {[-1, 0, 1, 2].map((i) => <span key={i} className={"onb-pip" + (i <= step ? " on" : "")} />)}
          <span style={{ marginLeft: 12, color: "var(--ink-faint)" }}>{String(stepIdx + 1).padStart(2, "0")} / 04</span>
        </div>
      </div>

      {/* STEP -1 — language */}
      {step === -1 && (
        <div className="onb-stage screen-enter" key="lang">
          <h2 className="onb-q">
            {lang === "ru" ? "Выберите язык" : "Choose your language"}
          </h2>
          <div className="onb-langs">
            <button className={"onb-lang-btn" + (lang === "en" ? " on" : "")} onClick={() => setLang("en")}>
              <span className="onb-lang-flag">🇬🇧</span>
              <span>English</span>
            </button>
            <button className={"onb-lang-btn" + (lang === "ru" ? " on" : "")} onClick={() => setLang("ru")}>
              <span className="onb-lang-flag">🇷🇺</span>
              <span>Русский</span>
            </button>
          </div>
          <p className="onb-hint mono">{lang === "ru" ? "Язык можно сменить в настройках" : "You can change this in settings"}</p>
          <button className="btn btn--solid onb-cta" onClick={() => go(0)}>
            {lang === "ru" ? "Продолжить" : "Continue"} <Icon name="forward" size={16} />
          </button>
        </div>
      )}

      {/* STEP 0 — welcome */}
      {step === 0 && (
        <div className="onb-stage screen-enter" key="s0">
          <div className="eyebrow onb-kicker">{tl("onb_kicker_0")}</div>
          <h1 className="onb-hero">
            {tl("onb_hero_0_1")}<br />{tl("onb_hero_0_2")}<br />{tl("onb_hero_0_3")}<span className="onb-dot" />
          </h1>
          <p className="onb-lede">{tl("onb_lede_0")}</p>
          <button className="btn btn--solid onb-cta" onClick={() => go(1)}>
            {tl("onb_cta_0")} <Icon name="forward" size={16} />
          </button>
        </div>
      )}

      {/* STEP 1 — name */}
      {step === 1 && (
        <div className="onb-stage screen-enter" key="s1">
          <div className="eyebrow onb-kicker">{tl("onb_kicker_1")}</div>
          <h2 className="onb-q">{tl("onb_q_1").split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}</h2>
          <div className="onb-namewrap">
            <input ref={nameRef} className="onb-name" value={name} spellCheck={false}
              placeholder={tl("onb_name_placeholder")} maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && go(2)} />
            <span className="onb-name-dot" style={{ transform: `scale(${dotScale})` }} />
          </div>
          <p className="onb-hint mono">{tl("onb_hint_1")}</p>
          <div className="onb-actions">
            <button className="btn btn--ghost" onClick={() => go(0)}><Icon name="back" size={15} /> {tl("onb_back")}</button>
            <button className="btn btn--solid" onClick={() => go(2)}>{tl("onb_next")} <Icon name="forward" size={15} /></button>
          </div>
        </div>
      )}

      {/* STEP 2 — theme */}
      {step === 2 && (
        <div className="onb-stage screen-enter" key="s2">
          <div className="eyebrow onb-kicker">{tl("onb_kicker_2")}</div>
          <h2 className="onb-q">{tl("onb_q_2").split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}</h2>
          <div className="onb-themes">
            <button className={"onb-theme" + (theme === "light" ? " on" : "")} onClick={() => setTheme("light")}>
              <div className="onb-theme-pic onb-theme-pic--light">
                <span className="l l1" /><span className="l l2" /><span className="l l3" />
              </div>
              <div className="onb-theme-meta"><span>{tl("onb_theme_light")}</span><Icon name={theme === "light" ? "check" : "sun"} size={16} /></div>
            </button>
            <button className={"onb-theme" + (theme === "dark" ? " on" : "")} onClick={() => setTheme("dark")}>
              <div className="onb-theme-pic onb-theme-pic--dark">
                <span className="l l1" /><span className="l l2" /><span className="l l3" />
              </div>
              <div className="onb-theme-meta"><span>{tl("onb_theme_dark")}</span><Icon name={theme === "dark" ? "check" : "moon"} size={16} /></div>
            </button>
          </div>
          <p className="onb-hint mono">{tl("onb_hint_2")}</p>
          <div className="onb-actions">
            <button className="btn btn--ghost" onClick={() => go(1)}><Icon name="back" size={15} /> {tl("onb_back")}</button>
            <button className="btn btn--accent onb-finish" onClick={finish}>
              {tl("onb_finish")} <Icon name="forward" size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

window.Onboarding = Onboarding;
