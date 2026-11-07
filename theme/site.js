(() => {
  const root = document.documentElement;

  const stored = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const store = (key, value) => {
    try { localStorage.setItem(key, value); } catch {}
  };

  const esc = (value) =>
    String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches;

  // ---------- theme ----------

  // A README's <picture> picks its logo by the system's scheme; once the reader picks a theme here, it follows that.
  const pictures = () => {
    document.querySelectorAll('picture source[media*="prefers-color-scheme"]').forEach((source) => {
      source.dataset.media ??= source.media;
      if (!root.dataset.theme) {
        source.media = source.dataset.media;
        return;
      }
      source.media = source.dataset.media.includes('dark') === isDark() ? 'all' : 'not all';
    });
  };

  const themeListeners = [pictures];
  pictures();

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      store('theme', next);
      themeListeners.forEach((listener) => listener());
    });
  });

  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (!root.dataset.theme) themeListeners.forEach((listener) => listener());
  });

  // ---------- runtime tabs: one choice, remembered across pages and libraries ----------

  const runtimes = ['cats', 'zio', 'kyo', 'rapid'];

  const selectRuntime = (runtime) => {
    document.querySelectorAll('[data-runtime-tab]').forEach((tab) => {
      tab.setAttribute('aria-selected', String(tab.dataset.runtimeTab === runtime));
    });
    document.querySelectorAll('[data-runtime-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.runtimePanel !== runtime;
    });
  };

  document.querySelectorAll('[data-runtime-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      selectRuntime(tab.dataset.runtimeTab);
      store('runtime', tab.dataset.runtimeTab);
    });
  });

  const remembered = stored('runtime');
  selectRuntime(runtimes.includes(remembered) ? remembered : 'cats');

  // ---------- copy ----------

  document.querySelectorAll('.code').forEach((block) => {
    const button = block.querySelector('.copy') ?? block.appendChild(Object.assign(document.createElement('button'), {
      type: 'button',
      className: 'copy',
      textContent: 'Copy',
    }));

    button.addEventListener('click', () => {
      const visible = [...block.querySelectorAll('pre')].find((pre) => !pre.closest('[hidden]'));
      navigator.clipboard.writeText(visible.textContent).then(() => {
        button.textContent = 'Copied';
        button.classList.add('done');
        setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('done');
        }, 1400);
      });
    });
  });

  // ---------- navigation ----------

  document.querySelectorAll('[data-nav-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      button.setAttribute('aria-expanded', String(open));
    });
  });

  const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
  const targets = tocLinks.map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter(Boolean);

  if (targets.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach((link) => link.classList.toggle('active', decodeURIComponent(link.hash.slice(1)) === entry.target.id));
      });
    }, { rootMargin: '-15% 0px -75% 0px' });

    targets.forEach((target) => spy.observe(target));
  }

  // ---------- diagrams: mermaid loads only when a diagram scrolls near, and redraws in the theme's colours ----------

  const diagrams = [...document.querySelectorAll('pre.mermaid')];

  if (diagrams.length) {
    diagrams.forEach((diagram) => { diagram.dataset.source = diagram.textContent; });
    let loading = null;

    const load = () => loading ??= new Promise((resolve, reject) => {
      const script = Object.assign(document.createElement('script'), { src: '/assets/vendor/mermaid.min.js' });
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });

    const draw = async () => {
      await load();
      const css = getComputedStyle(root);
      const token = (name) => css.getPropertyValue(name).trim();
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        fontFamily: token('--font-ui'),
        themeVariables: {
          darkMode: isDark(),
          fontFamily: token('--font-ui'),
          fontSize: '14px',
          background: token('--card'),
          primaryColor: token('--raised'),
          primaryTextColor: token('--ink'),
          primaryBorderColor: token('--line-strong'),
          secondaryColor: token('--card'),
          tertiaryColor: token('--card'),
          lineColor: token('--ink-dim'),
          textColor: token('--ink'),
          clusterBkg: token('--code'),
          clusterBorder: token('--section'),
          edgeLabelBackground: token('--card'),
        },
      });
      diagrams.forEach((diagram) => {
        diagram.removeAttribute('data-processed');
        diagram.textContent = diagram.dataset.source;
      });
      await window.mermaid.run({ nodes: diagrams });
    };

    const watch = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watch.disconnect();
      draw().catch(() => {});
    }, { rootMargin: '400px 0px' });

    diagrams.forEach((diagram) => watch.observe(diagram));
    themeListeners.push(() => { if (loading) draw().catch(() => {}); });
  }

  // ---------- search: Pagefind, loaded on first use ----------

  const dialog = document.querySelector('[data-search]');

  if (dialog) {
    const input = dialog.querySelector('[data-search-input]');
    const list = dialog.querySelector('[data-search-results]');
    const status = dialog.querySelector('[data-search-status]');
    const all = dialog.querySelector('[data-search-all]');
    const lib = dialog.dataset.lib;
    let pagefind = null;
    let latest = 0;

    const engine = async () => {
      if (!pagefind) {
        pagefind = await import('/pagefind/pagefind.js');
        await pagefind.init?.();
      }
      return pagefind;
    };

    const open = () => {
      if (!dialog.open) dialog.showModal();
      input.select();
      engine().catch(() => { status.textContent = 'Search is not available here.'; });
    };

    const run = async () => {
      const query = input.value.trim();
      const mine = ++latest;
      if (!query) {
        list.innerHTML = '';
        status.textContent = '';
        return;
      }

      const search = await (await engine()).debouncedSearch(query, lib && !all?.checked ? { filters: { lib } } : {}, 120);
      if (!search || mine !== latest) return;
      const results = await Promise.all(search.results.slice(0, 12).map((result) => result.data()));
      if (mine !== latest) return;

      list.innerHTML = results.map((result) => {
        const title = result.meta?.title ?? '';
        const sub = result.sub_results?.find((s) => s.url !== result.url && !title.endsWith(s.title));
        const from = result.filters?.lib?.[0];
        return `<li><a href="${esc(sub?.url ?? result.url)}">${from && from !== 'hub' ? `<span class="search-lib">${esc(from)}</span>` : ''}<b>${esc(title)}</b>${sub ? ` <span class="sub">› ${esc(sub.title)}</span>` : ''}<p>${sub?.excerpt ?? result.excerpt}</p></a></li>`;
      }).join('');
      status.textContent = search.results.length
        ? `${search.results.length} page${search.results.length === 1 ? '' : 's'}${lib && !all?.checked ? ` in ${lib}` : ''}`
        : `Nothing found${lib && !all?.checked ? ` in ${lib} — try all libraries` : ''}`;
    };

    document.querySelectorAll('[data-search-open]').forEach((button) => button.addEventListener('click', open));
    dialog.querySelector('[data-search-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    dialog.querySelector('[data-search-form]').addEventListener('submit', (event) => {
      event.preventDefault();
      list.querySelector('a')?.click();
    });
    input.addEventListener('input', run);
    all?.addEventListener('change', run);

    document.addEventListener('keydown', (event) => {
      const typing = /^(input|textarea|select)$/i.test(document.activeElement?.tagName ?? '') || document.activeElement?.isContentEditable;
      if (event.key === '/' && !typing && !dialog.open) {
        event.preventDefault();
        open();
      }
    });
  }
})();
