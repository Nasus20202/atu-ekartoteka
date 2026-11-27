'use strict';

const MAIL_URL = '/mail';
const REFRESH_INTERVAL_MS = 2000;
const BASE_TAG = '<base target="_blank">';
const DOCTYPE_PATTERN = /^\s*<!doctype[^>]*>/i;
const URL_PATTERN = /https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)]/gi;
const VIEW_HTML = 'html';
const VIEW_TEXT = 'text';
const EMPTY_TEXT = 'No mail captured yet.';
const NO_MATCH_TEXT = 'No messages match the filter.';
const NO_SUBJECT = '(no subject)';
const CLEAR_CONFIRM = 'Delete all captured messages?';
const LOAD_ERROR = 'Cannot reach the mock server.';

const state = { mails: [], raw: '', selectedId: null, shownId: null };

const byId = (id) => document.getElementById(id);
const els = {
  filter: byId('filter'),
  clear: byId('clear'),
  status: byId('status'),
  list: byId('messages'),
  empty: byId('empty'),
  placeholder: byId('placeholder'),
  detail: byId('detail'),
  from: byId('from'),
  to: byId('to'),
  date: byId('date'),
  subject: byId('subject'),
  viewHtml: byId('view-html'),
  viewText: byId('view-text'),
  html: byId('html-view'),
  text: byId('text-view'),
};

/** Builds an element with DOM APIs only; string children become text nodes. */
function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }
  node.append(...children);
  return node;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

/** Keeps a leading doctype first so the mail renders in the mode it was written for. */
function toSrcdoc(html) {
  const doctype = DOCTYPE_PATTERN.exec(html)?.[0] ?? '';
  return `${doctype}${BASE_TAG}${html.slice(doctype.length)}`;
}

function linkify(text) {
  const nodes = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const link = el(
      'a',
      { href: match[0], target: '_blank', rel: 'noopener' },
      match[0]
    );
    nodes.push(link);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function matchesFilter(mail, query) {
  if (!query) return true;
  return `${mail.subject} ${mail.to.join(' ')}`.toLowerCase().includes(query);
}

function renderItem(mail) {
  const button = el(
    'button',
    { type: 'button', class: 'item', 'data-id': String(mail.id) },
    el('span', { class: 'item-subject' }, mail.subject || NO_SUBJECT),
    el('span', { class: 'item-meta' }, mail.to.join(', ')),
    el(
      'time',
      { class: 'item-meta', datetime: mail.date },
      formatDate(mail.date)
    )
  );
  button.addEventListener('click', () => select(mail.id));
  return el('li', {}, button);
}

/** Toggles the selected state in place so the focused item keeps focus. */
function markSelected() {
  for (const button of els.list.querySelectorAll('button.item')) {
    const selected = button.dataset.id === String(state.selectedId);
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-current', String(selected));
  }
}

function renderList() {
  const query = els.filter.value.trim().toLowerCase();
  const visible = state.mails.filter((mail) => matchesFilter(mail, query));
  els.list.replaceChildren(...visible.map(renderItem));
  els.empty.textContent = state.mails.length === 0 ? EMPTY_TEXT : NO_MATCH_TEXT;
  els.empty.hidden = visible.length > 0;
  markSelected();
}

function fill(mail) {
  els.from.textContent = mail.from;
  els.to.textContent = mail.to.join(', ');
  els.date.textContent = formatDate(mail.date);
  els.subject.textContent = mail.subject || NO_SUBJECT;
  els.html.srcdoc = toSrcdoc(mail.html);
  els.text.replaceChildren(...linkify(mail.text));
}

/** Reloads the preview only when the shown message changed. */
function showSelected() {
  const mail = state.mails.find((item) => item.id === state.selectedId);
  const shownId = mail?.id ?? null;
  if (shownId === state.shownId) return;
  state.shownId = shownId;
  els.detail.hidden = !mail;
  els.placeholder.hidden = Boolean(mail);
  if (mail) fill(mail);
}

function select(id) {
  state.selectedId = id;
  showSelected();
  markSelected();
}

function setView(view) {
  const showHtml = view === VIEW_HTML;
  els.html.hidden = !showHtml;
  els.text.hidden = showHtml;
  els.viewHtml.setAttribute('aria-pressed', String(showHtml));
  els.viewText.setAttribute('aria-pressed', String(!showHtml));
}

async function refresh() {
  try {
    const response = await fetch(MAIL_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const raw = await response.text();
    els.status.textContent = '';
    if (raw === state.raw) return;
    state.raw = raw;
    state.mails = JSON.parse(raw);
    if (!state.mails.some((mail) => mail.id === state.selectedId)) {
      state.selectedId = null;
    }
    showSelected();
    renderList();
  } catch {
    els.status.textContent = LOAD_ERROR;
  }
}

async function clearAll() {
  if (!window.confirm(CLEAR_CONFIRM)) return;
  await fetch(MAIL_URL, { method: 'DELETE' }).catch(() => undefined);
  await refresh();
}

els.filter.addEventListener('input', renderList);
els.clear.addEventListener('click', clearAll);
els.viewHtml.addEventListener('click', () => setView(VIEW_HTML));
els.viewText.addEventListener('click', () => setView(VIEW_TEXT));
setView(VIEW_HTML);
refresh();
setInterval(refresh, REFRESH_INTERVAL_MS);
