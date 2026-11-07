import GithubSlugger from 'github-slugger';
import MarkdownIt from 'markdown-it';
import { createCssVariablesTheme, createHighlighter } from 'shiki';

// Code is coloured at build time against CSS variables, so the same markup serves both themes and the site's
// stylesheet decides what a keyword looks like.
const theme = createCssVariablesTheme({ name: 'css-variables', variablePrefix: '--shiki-', variableDefaults: {}, fontStyle: true });
const languages = ['scala', 'bash', 'diff', 'json', 'jsonc', 'xml'];
const highlighter = await createHighlighter({ themes: [theme], langs: languages });

export const esc = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const unesc = (value) =>
  value.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

export const highlight = (code, lang) =>
  highlighter
    .codeToHtml(code, { lang: languages.includes(lang) ? lang : 'text', theme: 'css-variables' })
    .replace(/^<pre[^>]*>/, '<pre tabindex="0">');

export const codeBlock = (code, lang, label = lang) => {
  const head = label
    ? `<div class="code-head" data-pagefind-ignore><span class="code-lang">${esc(label)}</span><button class="copy" type="button">Copy</button></div>`
    : '';
  return `<div class="code">${head}${highlight(code.replace(/\n$/, ''), lang)}</div>\n`;
};

const md = new MarkdownIt({ html: true, linkify: true });

md.renderer.rules.fence = (tokens, idx, options, env) => {
  const token = tokens[idx];
  const lang = token.info.trim().split(/\s+/)[0];
  if (lang === 'mermaid') {
    env.mermaid = true;
    return `<figure class="diagram"><pre class="mermaid">${esc(token.content)}</pre></figure>\n`;
  }
  return codeBlock(token.content, lang, lang || null);
};

md.renderer.rules.code_block = (tokens, idx) => codeBlock(tokens[idx].content, 'text', null);

md.renderer.rules.heading_open = (tokens, idx) => `<${tokens[idx].tag} id="${esc(tokens[idx].attrGet('id'))}">`;

md.renderer.rules.heading_close = (tokens, idx) => {
  const id = esc(tokens[idx - 2].attrGet('id'));
  return ` <a class="anchor" href="#${id}" aria-label="Link to this section"></a></${tokens[idx].tag}>\n`;
};

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token.attrSet('href', env.resolve(token.attrGet('href')));
  return self.renderToken(tokens, idx, options);
};

const image = md.renderer.rules.image;
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  token.attrSet('src', env.resolve(token.attrGet('src'), { asset: true }));
  token.attrSet('loading', 'lazy');
  return image(tokens, idx, options, env, self);
};

const srcset = (value, env) =>
  value
    .split(',')
    .map((candidate) => candidate.trim().replace(/^\S+/, (url) => env.resolve(url, { asset: true })))
    .join(', ');

// Raw HTML in a README is mostly <picture> logos; its links and sources resolve the same way markdown's do.
const rewriteHtml = (html, env) =>
  html.replace(/\b(href|src|srcset)="([^"]*)"/g, (match, attr, value) => {
    const url = unesc(value);
    const resolved = attr === 'srcset' ? srcset(url, env) : env.resolve(url, { asset: attr === 'src' });
    return `${attr}="${esc(resolved)}"`;
  });

md.renderer.rules.html_block = (tokens, idx, options, env) => rewriteHtml(tokens[idx].content, env);
md.renderer.rules.html_inline = (tokens, idx, options, env) => rewriteHtml(tokens[idx].content, env);

md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n';
md.renderer.rules.table_close = () => '</table></div>\n';

// The text GitHub slugs a heading from: what it reads as, with code spans and link text kept and markup dropped.
export const plain = (inline) =>
  inline.children
    .filter((child) => child.type === 'text' || child.type === 'code_inline')
    .map((child) => child.content)
    .join('');

// Heading ids are GitHub's, counted over the whole file as GitHub counts them, so an anchor that works on GitHub
// works here once its page is known.
export const parseDocument = (source) => {
  const tokens = md.parse(source, {});
  const slugger = new GithubSlugger();

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'heading_open') tokens[i].attrSet('id', slugger.slug(plain(tokens[i + 1])));
  }

  const h1 = tokens.findIndex((token) => token.type === 'heading_open' && token.tag === 'h1' && token.level === 0);
  const doc = {
    title: h1 >= 0 ? plain(tokens[h1 + 1]) : null,
    titleHtml: h1 >= 0 ? renderInline(tokens[h1 + 1]) : null,
    id: h1 >= 0 ? tokens[h1].attrGet('id') : null,
    intro: [],
    sections: [],
  };

  let current = doc.intro;
  for (let i = h1 >= 0 ? h1 + 3 : 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'heading_open' && token.tag === 'h2' && token.level === 0) {
      const section = {
        title: plain(tokens[i + 1]),
        titleHtml: renderInline(tokens[i + 1]),
        id: token.attrGet('id'),
        heading: tokens.slice(i, i + 3),
        tokens: [],
      };
      doc.sections.push(section);
      current = section.tokens;
      i += 2;
    } else {
      current.push(token);
    }
  }

  return doc;
};

// A section on a page of its own has its H2 as the page title, so what was under it moves up a level.
export const promote = (tokens) => {
  for (const token of tokens) {
    if ((token.type === 'heading_open' || token.type === 'heading_close') && token.tag !== 'h1' && token.tag !== 'h2') {
      token.tag = `h${Number(token.tag.slice(1)) - 1}`;
    }
  }
  return tokens;
};

const closing = (tokens, from) => {
  const { type, level } = tokens[from];
  const close = type.replace(/_open$/, '_close');
  return tokens.findIndex((token, i) => i > from && token.type === close && token.level === level);
};

const inlines = (tokens, from, to) => tokens.slice(from, to).filter((token) => token.type === 'inline');

const onlyImages = (inline) =>
  inline.children.every(
    (child) =>
      ['link_open', 'link_close', 'image', 'softbreak'].includes(child.type) || (child.type === 'text' && !child.content.trim()),
  );

// A README opens with what the site already shows another way: badges become the chips under the title, and the
// list of section links becomes the sidebar. The first paragraph becomes the tagline.
export const splitIntro = (tokens) => {
  const kept = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === 'paragraph_open' && token.level === 0 && onlyImages(tokens[i + 1])) {
      i += 2;
    } else if (token.type === 'bullet_list_open' && token.level === 0) {
      const end = closing(tokens, i);
      const items = inlines(tokens, i, end);
      if (items.length && items.every((inline) => inline.children[0]?.type === 'link_open')) i = end;
      else kept.push(token);
    } else {
      kept.push(token);
    }
  }

  const first = kept.findIndex((token) => token.type === 'paragraph_open');
  if (first < 0) return { tagline: null, tokens: kept };
  return { tagline: kept[first + 1], tokens: [...kept.slice(0, first), ...kept.slice(first + 3)] };
};

export const headingsOf = (tokens, tag) =>
  tokens
    .map((token, i) => (token.type === 'heading_open' && token.tag === tag ? { id: token.attrGet('id'), text: plain(tokens[i + 1]) } : null))
    .filter(Boolean);

// Headings, and the <a id="…"> anchors a README sometimes places by hand.
export const idsOf = (tokens) =>
  tokens.flatMap((token) => {
    if (token.type === 'heading_open') return [token.attrGet('id')];
    const html = token.type === 'html_block' ? [token] : token.type === 'inline' ? token.children.filter((child) => child.type === 'html_inline') : [];
    return html.flatMap((node) => [...node.content.matchAll(/<a\s[^>]*\b(?:id|name)="([^"]+)"/g)].map((m) => m[1]));
  });

export const render = (tokens, env) => md.renderer.render(tokens, md.options, env);

export function renderInline(inline, env = { resolve: (href) => href }) {
  return md.renderer.renderInline(inline.children, md.options, env);
}
