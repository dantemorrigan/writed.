/* ============================================================
   Writed. — local data store
   ============================================================ */
(function () {
  const KEY = "writed:v1";
  const listeners = new Set();
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const now = () => Date.now();

  function countWords(html) {
    const t = (html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
    const m = t.trim().match(/[^\s]+/g);
    return m ? m.length : 0;
  }

  function seed() {
    const p1 = {
      id: uid("p_"), title: "Северный свет", status: "draft",
      synopsis: "Роман о смотрителе маяка, который начинает получать письма из будущего.",
      createdAt: now() - 86400000 * 40, updatedAt: now() - 3600000 * 5,
      chapters: [
        { id: uid("c_"), title: "Глава I. Туман", updatedAt: now() - 3600000 * 5,
          content: "<h1>Туман</h1><p>Маяк стоял на краю мира, и каждую ночь Эльса считала удары волн о камень — будто кто-то снаружи просился войти.</p><p>В тот вечер море пахло железом. Она поднялась по ста двадцати ступеням, зажгла лампу и впервые за семь лет услышала, как под дверью шуршит бумага.</p><blockquote>«Вы не знаете меня. Но к зиме вы будете знать слишком много.»</blockquote><p>Письмо было датировано числом, которого ещё не наступило.</p>" },
        { id: uid("c_"), title: "Глава II. Сто двадцать ступеней", updatedAt: now() - 86400000 * 2,
          content: "<h1>Сто двадцать ступеней</h1><p>Утром туман не рассеялся. Эльса спустилась к воде с фонарём и нашла на гальке вторую записку — теми же чернилами, тем же быстрым почерком, что и накануне.</p><p>Она перечитала её трижды, прежде чем поняла: почерк был её собственный.</p>" },
        { id: uid("c_"), title: "Глава III. Чужие чернила", updatedAt: now() - 86400000 * 6,
          content: "<h1>Чужие чернила</h1><p>Смотритель с соседнего острова сказал, что чернила такого оттенка перестали выпускать тридцать лет назад. Эльса промолчала о том, что её перо до сих пор пахнет ими.</p>" }
      ]
    };
    const p2 = {
      id: uid("p_"), title: "Тихие города", status: "done",
      synopsis: "Сборник рассказов о местах, которые помнят больше, чем люди.",
      createdAt: now() - 86400000 * 180, updatedAt: now() - 86400000 * 20,
      chapters: [
        { id: uid("c_"), title: "Площадь без названия", updatedAt: now() - 86400000 * 21,
          content: "<h1>Площадь без названия</h1><p>Каждый город хранит одну площадь, имя которой стёрлось со всех карт, но осталось на губах стариков.</p>" },
        { id: uid("c_"), title: "Дом напротив вокзала", updatedAt: now() - 86400000 * 20,
          content: "<h1>Дом напротив вокзала</h1><p>Поезда приходили реже, чем письма, и реже, чем сны о тех, кто уехал.</p>" }
      ]
    };
    const notes = [
      { id: uid("n_"), title: "Идеи для второй части", status: "draft", updatedAt: now() - 3600000 * 30,
        content: "<h2>Куда дальше</h2><ul><li>Письма начинают противоречить друг другу</li><li>Появляется второй смотритель — или это она сама?</li><li>Финал: лампа гаснет в полдень</li></ul>" },
      { id: uid("n_"), title: "Цитаты и эпиграфы", status: "draft", updatedAt: now() - 86400000 * 4,
        content: "<blockquote>«Время — это вода, которую держат в ладонях.»</blockquote><p>— проверить источник</p>" }
    ];
    return {
      user: { name: "", theme: "light", editorFont: "book", createdAt: now() },
      onboarded: false,
      projects: [p1, p2],
      notes
    };
  }

  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const s = seed();
    persist(s);
    return s;
  }
  function persist(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function commit() {
    persist(state);
    listeners.forEach((fn) => fn(state));
  }

  const Store = {
    get: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    /* ---- user / onboarding ---- */
    completeOnboarding(name, theme) {
      state.user.name = name || "Автор";
      state.user.theme = theme || "light";
      state.onboarded = true;
      commit();
    },
    setUser(patch) { state.user = { ...state.user, ...patch }; commit(); },

    /* ---- projects ---- */
    createProject(title) {
      const p = { id: uid("p_"), title: title || "Без названия", status: "draft",
        synopsis: "", createdAt: now(), updatedAt: now(), chapters: [] };
      state.projects.unshift(p); commit(); return p.id;
    },
    updateProject(id, patch) {
      const p = state.projects.find((x) => x.id === id);
      if (p) { Object.assign(p, patch, { updatedAt: now() }); commit(); }
    },
    deleteProject(id) { state.projects = state.projects.filter((p) => p.id !== id); commit(); },
    reorderChapters(pid, ids) {
      const p = state.projects.find((x) => x.id === pid);
      if (p) { p.chapters.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)); p.updatedAt = now(); commit(); }
    },
    addChapter(pid, title) {
      const p = state.projects.find((x) => x.id === pid);
      if (!p) return null;
      const c = { id: uid("c_"), title: title || ("Глава " + (p.chapters.length + 1)),
        content: "", updatedAt: now() };
      p.chapters.push(c); p.updatedAt = now(); commit(); return c.id;
    },
    deleteChapter(pid, cid) {
      const p = state.projects.find((x) => x.id === pid);
      if (p) { p.chapters = p.chapters.filter((c) => c.id !== cid); p.updatedAt = now(); commit(); }
    },

    /* ---- notes ---- */
    createNote(title) {
      const n = { id: uid("n_"), title: title || "Новая заметка", status: "draft",
        content: "", updatedAt: now() };
      state.notes.unshift(n); commit(); return n.id;
    },
    deleteNote(id) { state.notes = state.notes.filter((n) => n.id !== id); commit(); },

    /* ---- documents (chapter OR note) ---- */
    findDoc(docId) {
      for (const p of state.projects) {
        const c = p.chapters.find((c) => c.id === docId);
        if (c) return { doc: c, project: p, kind: "chapter" };
      }
      const n = state.notes.find((n) => n.id === docId);
      if (n) return { doc: n, project: null, kind: "note" };
      return null;
    },
    updateDoc(docId, patch) {
      const f = Store.findDoc(docId);
      if (!f) return;
      Object.assign(f.doc, patch, { updatedAt: now() });
      if (patch.content != null) f.doc.words = countWords(patch.content);
      if (f.project) f.project.updatedAt = now();
      commit();
    },
    deleteDoc(docId) {
      const f = Store.findDoc(docId);
      if (!f) return;
      if (f.kind === "note") state.notes = state.notes.filter((n) => n.id !== docId);
      else f.project.chapters = f.project.chapters.filter((c) => c.id !== docId);
      if (f.kind === "chapter" && f.project) f.project.updatedAt = now();
      commit();
    },

    /* ---- stats ---- */
    stats() {
      let words = 0, chapters = 0;
      state.projects.forEach((p) => p.chapters.forEach((c) => { words += countWords(c.content); chapters++; }));
      state.notes.forEach((n) => { words += countWords(n.content); });
      return { words, projects: state.projects.length, notes: state.notes.length, chapters };
    },
    projectWords(p) {
      return p.chapters.reduce((s, c) => s + countWords(c.content), 0);
    },

    /* ---- backup ---- */
    exportAll() { return JSON.stringify(state, null, 2); },
    importAll(json) {
      try { const s = JSON.parse(json); if (s && s.user) { state = s; commit(); return true; } }
      catch (e) {}
      return false;
    },
    reset() { localStorage.removeItem(KEY); state = seed(); commit(); },

    countWords
  };

  window.WritedStore = Store;
})();
