<script>
  import { onMount } from "svelte";
  import JSZip from "jszip";
  import statutes from "./lib/statuttar.json";

  let toastText = $state("");
  let savedText = $state("");
  let menuOpen = $state(false);
  let onlyChanges = $state(false);
  let fileInput;
  let barElement;
  let toastTimer;
  let savedTimer;
  let authorHinted = false;

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const filled = s => typeof s === "string" && s.trim() !== "";
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
const roman = n => ROMAN[n] || String(n);
const newId = prefix => prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ============================================================
   Gjeldande statuttar
   ============================================================ */
const BASE_CHAPTERS = [];
const BASE_PARAS = [];
let currentChapter = null;
for (const item of statutes) {
  if (item.type === "kap") {
    currentChapter = item.tittel.split(".")[0];
    BASE_CHAPTERS.push({ key: currentChapter, title: item.tittel });
  } else {
    BASE_PARAS.push({ ...item, kap: currentChapter });
  }
}
const base = Object.fromEntries(BASE_PARAS.map((p) => [p.id, p]));
const isBaseChapter = (key) => BASE_CHAPTERS.some((c) => c.key === key);
const STORE_KEY = "statuttendringar-h26";
let state = $state({ proposals: {}, chapters: {}, author: "" });
let editing = $state(null);

function sanitize(raw) {
  const out = { proposals: {}, chapters: {}, author: "" };
  if (!raw || typeof raw !== "object") return out;
  const src = raw.forslag && typeof raw.forslag === "object" ? raw.forslag : raw;
  if (typeof raw.stiller === "string") out.author = raw.stiller;

  const chapters = raw.kapittel && typeof raw.kapittel === "object" ? raw.kapittel : {};
  for (const [key, c] of Object.entries(chapters)) {
    if (!/^nk-[a-z0-9]+$/.test(key) || !c || typeof c !== "object") continue;
    out.chapters[key] = {
      tittel: typeof c.tittel === "string" ? c.tittel : "",
      grunngjeving: typeof c.grunngjeving === "string" ? c.grunngjeving : "",
      etter: typeof c.etter === "string" ? c.etter : null,
      oppretta: typeof c.oppretta === "number" ? c.oppretta : 0,
    };
  }
  for (const [id, p] of Object.entries(src)) {
    if (!p || typeof p !== "object") continue;
    const isNew = !!p.ny && /^ny-[a-z0-9]+$/.test(id);
    if (!base[id] && !isNew) continue;
    const c = {};
    for (const f of ["tekst", "tittel", "grunngjeving", "kap", "etter"]) {
      if (typeof p[f] === "string") c[f] = p[f];
    }
    if (TYPES.includes(p.type)) c.type = p.type;
    if (isNew) {
      if (!isBaseChapter(c.kap) && !out.chapters[c.kap]) continue;
      c.ny = true;
      c.oppretta = typeof p.oppretta === "number" ? p.oppretta : 0;
    }
    if (p.oppheva) c.oppheva = true;
    out.proposals[id] = c;
  }
  return out;
}

function load() {
  try {
    state = sanitize(JSON.parse(localStorage.getItem(STORE_KEY) || "null"));
  } catch {
    state = { proposals: {}, chapters: {}, author: "" };
  }
}

let saveTimer = null;
function save(now = false) {
  clearTimeout(saveTimer);
  if (!now) {
    saveTimer = setTimeout(() => save(true), 400);
    return;
  }
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ stiller: state.author, forslag: state.proposals, kapittel: state.chapters }));
    flashSaved();
  } catch {
    toast("Nettlesaren lagrar ikkje. Lagre arbeidet som fil i staden.");
  }
}

/* ============================================================
   Struktur: kapittel, rekkjefølgje og nummerering
   ============================================================ */
const byCreated = src => (a, b) => (src[a].oppretta || 0) - (src[b].oppretta || 0);

function chapterList() {
  const out = [], placed = new Set();
  const chapterTitle = key => state.chapters[key].tittel.trim() || "Nytt kapittel";
  const placeAfter = after => {
    Object.keys(state.chapters)
      .filter(k => state.chapters[k].etter === after && !placed.has(k))
      .sort(byCreated(state.chapters))
      .forEach(k => { placed.add(k); out.push({ key: k, title: chapterTitle(k), isNew: true }); placeAfter(k); });
  };
  for (const c of BASE_CHAPTERS) { out.push(c); placeAfter(c.key); }
  Object.keys(state.chapters).filter(k => !placed.has(k)).sort(byCreated(state.chapters))
    .forEach(k => { placed.add(k); out.push({ key: k, title: chapterTitle(k), isNew: true }); placeAfter(k); });
  return out;
}

const newParasIn = kap => Object.keys(state.proposals)
  .filter(id => state.proposals[id].ny && state.proposals[id].kap === kap)
  .sort(byCreated(state.proposals));

// Rekkjefølgja av paragrafar i eit kapittel, med dei nye der dei er sette inn
function rowIds(kap) {
  const news = newParasIn(kap), ids = [], placed = new Set();
  const placeAfter = after => news
    .filter(id => (state.proposals[id].etter || null) === after && !placed.has(id))
    .forEach(id => { placed.add(id); ids.push(id); placeAfter(id); });
  for (const p of BASE_PARAS) if (p.kap === kap) { ids.push(p.id); placeAfter(p.id); }
  news.filter(id => !placed.has(id)).forEach(id => { placed.add(id); ids.push(id); placeAfter(id); });
  return ids;
}

function chapterNumber(kap) {
  const first = BASE_PARAS.find(p => p.kap === kap && p.nr);
  if (first) return first.nr.split(".")[0];
  return String(chapterList().findIndex(c => c.key === kap) + 1);
}

// Ein ny paragraf tek nummeret til plassen sin; dei etter rykkjer eitt steg ned
function numbering(kap) {
  const cn = chapterNumber(kap), map = {};
  let i = 0;
  for (const id of rowIds(kap)) {
    if (base[id] && !base[id].nr) continue;   // innleiinga til kap. XII har ikkje nummer
    map[id] = `${cn}.${++i}`;
  }
  return map;
}
const kapOf = id => base[id] ? base[id].kap : state.proposals[id]?.kap;
const numberOf = id => numbering(kapOf(id))[id] || "";

/* ============================================================
   Endringar
   ============================================================ */
function isChanged(id) {
  const p = state.proposals[id];
  if (!p) return false;
  if (p.ny || p.oppheva) return true;
  const o = base[id];
  return (p.tekst != null && p.tekst !== o.tekst)
      || (p.tittel != null && p.tittel !== o.tittel)
      || filled(p.grunngjeving);
}

function proposed(id) {
  const p = state.proposals[id] || {}, o = base[id] || { tittel: "", tekst: "" };
  return {
    tittel: p.tittel ?? o.tittel,
    tekst: p.oppheva ? "" : (p.tekst ?? o.tekst),
  };
}

// Ord-for-ord-skilnad (lengste felles delfølgje)
function diff(a, b) {
  const split = s => s.split(/(\s+|[.,;:()«»"])/).filter(Boolean);
  const A = split(a), B = split(b), n = A.length, m = B.length, W = m + 1;
  const L = new Uint32Array((n + 1) * W);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i * W + j] = A[i] === B[j] ? L[(i + 1) * W + j + 1] + 1 : Math.max(L[(i + 1) * W + j], L[i * W + j + 1]);
    }
  }
  const ops = [];
  const push = (t, s) => { const last = ops[ops.length - 1]; if (last && last.t === t) last.s += s; else ops.push({ t, s }); };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { push("eq", A[i++]); j++; }
    else if (L[(i + 1) * W + j] >= L[i * W + j + 1]) push("del", A[i++]);
    else push("ins", B[j++]);
  }
  while (i < n) push("del", A[i++]);
  while (j < m) push("ins", B[j++]);
  return mergeShort(ops);
}

// Éi side av skilnaden som HTML; mellomrom kjem utanfor merkinga
function diffSide(ops, side) {
  return ops.map(({ t, s }) => {
    if (t === "eq") return esc(s);
    if (t !== side) return "";
    const [, lead, core, trail] = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return core ? `${esc(lead)}<${side}>${esc(core)}</${side}>${esc(trail)}` : esc(s);
  }).join("");
}

// Slå saman små urørte bitar (eitt eller to ord) mellom to endringar, så ei
// omskriven setning blir vist som éin stroken og éin ny bit i staden for
// annakvart ord.
const isShort = s => !s.includes("\n") && s.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length <= 2;
function mergeShort(ops) {
  const groups = [];
  for (const o of ops) {
    if (o.t === "eq") { groups.push({ t: "eq", s: o.s }); continue; }
    let last = groups[groups.length - 1];
    if (!last || last.t !== "chg") groups.push(last = { t: "chg", del: "", ins: "" });
    last[o.t] += o.s;
  }
  const out = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i], prev = out[out.length - 1], next = groups[i + 1];
    if (g.t === "eq" && prev?.t === "chg" && next?.t === "chg" && isShort(g.s)) {
      prev.del += g.s + next.del;
      prev.ins += g.s + next.ins;
      i++;
      continue;
    }
    out.push(g);
  }
  return out.flatMap(g => g.t === "eq" ? [g]
    : [g.del && { t: "del", s: g.del }, g.ins && { t: "ins", s: g.ins }].filter(Boolean));
}

/* ---------- Bokstavpunkt (a., b., c. …) ----------
   Punkta blir samanlikna på innhald, ikkje på bokstav. Då ser vi at eit punkt
   er stroke og at resten berre har fått ny bokstav, i staden for å merkja
   kvar einaste bokstav som endra. */
const POINT = /^([a-zæøå])\.\s+(.*)$/;

// Linjer utan bokstav etter første punkt blir rekna som punkt; bokstaven får dei ut frå plassen.
function splitPoints(text) {
  const points = [], rest = [];
  for (const line of text.split("\n")) {
    const m = line.match(POINT);
    if (m) points.push({ letter: m[1], body: m[2] });
    else if (points.length) { if (line.trim()) points.push({ letter: null, body: line.trim() }); }
    else rest.push(line);
  }
  return { points, rest: rest.join("\n") };
}
const LETTERS = "abcdefghijklmnopqrstuvwxyzæøå";

// Kor like to punkt er, 0 til 1, målt i ord dei har sams
function likeness(a, b) {
  const words = s => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const A = words(a), B = words(b);
  if (!A.length || !B.length) return 0;
  const common = diff(A.join(" "), B.join(" ")).filter(o => o.t === "eq").reduce((n, o) => n + words(o.s).length, 0);
  return common / Math.max(A.length, B.length);
}

// Liste over punkt i rekkjefølgje: same, moved (ny bokstav), edited, removed, added.
// Gir null når teksten ikkje er bygd opp av bokstavpunkt.
function alignPoints(oldText, newText) {
  const A = splitPoints(oldText), B = splitPoints(newText);
  if (!A.points.length || !B.points.length || A.rest !== B.rest) return null;
  const a = A.points, b = B.points, n = a.length, m = b.length, W = m + 1;
  const L = new Uint16Array((n + 1) * W);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i * W + j] = a[i].body === b[j].body ? L[(i + 1) * W + j + 1] + 1 : Math.max(L[(i + 1) * W + j], L[i * W + j + 1]);
    }
  }
  const out = [];
  let gapA = [], gapB = [];
  const flush = () => {
    let i = 0, j = 0;
    while (i < gapA.length && j < gapB.length) {
      // Like mange att på kvar side: punkta står på same plass og er omskrivne
      const paired = gapA.length - i === gapB.length - j || likeness(gapA[i].body, gapB[j].body) >= 0.4;
      if (paired) out.push({ kind: "edited", old: gapA[i++], new: gapB[j++] });
      else if (gapA.length - i >= gapB.length - j) out.push({ kind: "removed", old: gapA[i++] });
      else out.push({ kind: "added", new: gapB[j++] });
    }
    while (i < gapA.length) out.push({ kind: "removed", old: gapA[i++] });
    while (j < gapB.length) out.push({ kind: "added", new: gapB[j++] });
    gapA = []; gapB = [];
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i].body === b[j].body) {
      flush();
      out.push({ kind: a[i].letter === b[j].letter ? "same" : "moved", old: a[i++], new: b[j++] });
    } else if (L[(i + 1) * W + j] >= L[i * W + j + 1]) gapA.push(a[i++]);
    else gapB.push(b[j++]);
  }
  while (i < n) gapA.push(a[i++]);
  while (j < m) gapB.push(b[j++]);
  flush();
  // Bokstaven eit punkt endar opp med, ut frå plassen, same kva brukaren skreiv
  let k = 0;
  for (const e of out) {
    if (!e.new) continue;
    e.final = LETTERS[k++] || "?";
    if (e.kind === "same" || e.kind === "moved") e.kind = e.old.letter === e.final ? "same" : "moved";
  }
  return { rest: A.rest, points: out };
}

// «Bokstav c til h blir b til g.» Same ordlyd på nynorsk og bokmål.
function reletterNote(points) {
  const moves = points.filter(e => e.old && e.new && e.old.letter !== e.final)
    .map(e => [e.old.letter, e.final]);
  const code = c => c.charCodeAt(0), runs = [];
  for (const [from, to] of moves) {
    const r = runs[runs.length - 1];
    if (r && code(from) === code(r.from2) + 1 && code(to) === code(r.to2) + 1) { r.from2 = from; r.to2 = to; }
    else runs.push({ from, to, from2: from, to2: to });
  }
  return runs.map(r => r.from === r.from2
    ? `Bokstav ${r.from} blir ${r.to}.`
    : `Bokstav ${r.from} til ${r.from2} blir ${r.to} til ${r.to2}.`).join(" ");
}

const pointChanged = e => e.kind === "edited" || e.kind === "removed" || e.kind === "added";

// Teksten til éi side som HTML, med bokstavpunkt når det går
function textSide(oldText, newText, side) {
  const al = alignPoints(oldText, newText);
  if (!al) return diffSide(diff(oldText, newText), side);
  const key = side === "del" ? "old" : "new";
  const linesOut = al.rest ? [esc(al.rest)] : [];
  for (const e of al.points) {
    const p = e[key];
    if (!p) continue;
    const letter = side === "del" ? p.letter : e.final;
    if ((e.kind === "removed" && side === "del") || (e.kind === "added" && side === "ins")) {
      linesOut.push(`<${side}>${esc(`${letter}. ${p.body}`)}</${side}>`);
    } else if (e.kind === "edited") {
      linesOut.push(`${letter}. ${diffSide(diff(e.old.body, e.new.body), side)}`);
    } else {
      linesOut.push(esc(`${letter}. ${p.body}`));
    }
  }
  return linesOut.join("\n");
}

// Begge sider i éin tekst, til førehandsvisinga i redigeringa
function textInline(oldText, newText) {
  const both = ops => ops.map(({ t, s }) => t === "eq" ? esc(s) : `<${t}>${esc(s)}</${t}>`).join("");
  const al = alignPoints(oldText, newText);
  if (!al) return both(diff(oldText, newText));
  const linesOut = al.rest ? [esc(al.rest)] : [];
  for (const e of al.points) {
    if (e.kind === "removed") linesOut.push(`<del>${esc(`${e.old.letter}. ${e.old.body}`)}</del>`);
    else if (e.kind === "added") linesOut.push(`<ins>${esc(`${e.final}. ${e.new.body}`)}</ins>`);
    else if (e.kind === "edited") linesOut.push(`${e.final}. ${both(diff(e.old.body, e.new.body))}`);
    else linesOut.push(esc(`${e.final}. ${e.new.body}`));
  }
  return linesOut.join("\n");
}

// Tilvisingar som kan bli feil når bokstavar blir strokne eller flytta,
// både inne i paragrafen («bokstav a og b») og frå andre paragrafar («§ 9.4 a»).
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function letterFates(al) {
  const fate = {};
  for (const e of al.points) if (e.old?.letter) fate[e.old.letter] = e.new ? e.final : null;
  return fate;
}
const fateText = (l, fate) => fate[l] === null ? `bokstav ${l} blir stroken` : `bokstav ${l} blir ${fate[l]}`;
const sentence = parts => { const s = parts.length > 1 ? parts.slice(0, -1).join(", ") + ", og " + parts[parts.length - 1] : parts[0]; return s[0].toUpperCase() + s.slice(1) + "."; };

function referenceWarnings(id) {
  const o = base[id];
  if (!o || state.proposals[id]?.ny) return [];
  const al = alignPoints(o.tekst, proposed(id).tekst);
  if (!al) return [];
  const fate = letterFates(al);
  const affected = l => l in fate && fate[l] !== l;
  if (!Object.keys(fate).some(affected)) return [];
  const out = [];

  const inside = /bokstav(?:ene)?\s+([a-zæøå](?:\s*(?:,|og|eller|til)\s*[a-zæøå])*)(?![\p{L}])/giu;
  for (const e of al.points) {
    if (!e.new) continue;
    for (const m of e.new.body.matchAll(inside)) {
      const hits = m[1].split(/\s*(?:,|og|eller|til)\s*/).filter(affected);
      if (hits.length) out.push(`Bokstav ${e.final} viser til «${m[0]}». ${sentence(hits.map(l => fateText(l, fate)))}`);
    }
  }
  if (o.nr) {
    const outside = new RegExp(`§\\s*${escRe(o.nr)}\\s*(?:bokstav\\s*)?([a-zæøå])(?![\\p{L}])`, "giu");
    for (const q of BASE_PARAS) {
      if (q.id === id) continue;
      for (const m of proposed(q.id).tekst.matchAll(outside)) {
        if (affected(m[1])) out.push(`§ ${q.nr} viser til «${m[0].trim()}». ${sentence([fateText(m[1], fate)])}`);
      }
    }
  }
  return out;
}

// Er noko lagt til, teke bort, eller begge delar?
function changeKinds(oldText, newText) {
  const flags = ops => {
    const real = ops.filter(o => o.s.trim());
    return { ins: real.some(o => o.t === "ins"), del: real.some(o => o.t === "del") };
  };
  const al = alignPoints(oldText, newText);
  if (!al) return flags(diff(oldText, newText));
  const k = { ins: false, del: false };
  for (const e of al.points) {
    if (e.kind === "added") k.ins = true;
    if (e.kind === "removed") k.del = true;
    if (e.kind === "edited") { const f = flags(diff(e.old.body, e.new.body)); k.ins ||= f.ins; k.del ||= f.del; }
  }
  return k;
}

// Typane som blir brukte i skjemaet. «Ny» blir sett av seg sjølv på nye paragrafar
// og kapittel, og kan difor ikkje veljast for ein paragraf som finst frå før.
// Stryking dekkjer både delar av ein paragraf og heile paragrafen.
const TYPES = ["Endring", "Tillegg", "Stryking"];
function autoType(id) {
  const p = state.proposals[id] || {};
  if (p.ny) return "Ny";
  if (p.oppheva) return "Stryking";
  const o = base[id], n = proposed(id);
  const a = changeKinds(o.tekst, n.tekst), b = changeKinds(o.tittel, n.tittel);
  const ins = a.ins || b.ins, del = a.del || b.del;
  if (ins && !del) return "Tillegg";
  if (del && !ins) return "Stryking";
  return "Endring";
}

// Merknader til begrunnelsen om nummer som flyttar seg (på bokmål, som skjemaet)
function shiftNote(id) {
  const p = state.proposals[id];
  if (!p?.ny) return "";
  const ids = rowIds(p.kap), i = ids.indexOf(id), map = numbering(p.kap);
  const numbered = x => base[x]?.nr;
  const before = ids.slice(0, i).filter(numbered).pop();
  const after = ids.slice(i + 1).filter(numbered);
  if (!after.length) return "";
  const first = after[0], last = after[after.length - 1];
  let s = `Forslaget innfører ny § ${map[id]}${before ? `, plassert etter nåværende § ${base[before].nr}` : ", først i kapitlet"}. `;
  s += after.length === 1
    ? `Nåværende § ${base[first].nr} blir § ${map[first]}.`
    : `Nåværende § ${base[first].nr} til § ${base[last].nr} får nye nummer (§ ${map[first]} til § ${map[last]}).`;
  return s;
}

function chapterNote(key) {
  const list = chapterList(), i = list.findIndex(c => c.key === key);
  const prev = list.slice(0, i).filter(c => !c.isNew).pop();
  const later = list.slice(i + 1).filter(c => !c.isNew);
  let s = `Forslaget innfører nytt kapittel ${roman(i + 1)}${prev ? `, plassert etter nåværende kapittel ${prev.key}` : ""}.`;
  if (later.length) {
    const f = later[0], l = later[later.length - 1];
    const nf = roman(list.indexOf(f) + 1), nl = roman(list.indexOf(l) + 1);
    s += later.length === 1
      ? ` Nåværende kapittel ${f.key} blir kapittel ${nf}, og paragrafnumrene endres tilsvarende.`
      : ` Nåværende kapittel ${f.key} til ${l.key} får nye nummer (${nf} til ${nl}), og paragrafnumrene endres tilsvarende.`;
  }
  return s;
}

/* ============================================================
   Teikning
   ============================================================ */
function numberCell(id) {
  const nr = numberOf(id), o = base[id];
  if (!o) return `<div class="num">§ ${esc(nr)}</div>`;
  if (!o.nr) return `<div class="num"></div>`;
  const moved = nr && nr !== o.nr ? `<small>blir § ${esc(nr)}</small>` : "";
  return `<div class="num">§ ${o.nr}${moved}</div>`;
}

function origContent(id) {
  const o = base[id], p = state.proposals[id];
  if (!o) return `<p class="faint">Ny paragraf</p>`;
  if (p?.oppheva) return `<p class="ttl"><del>${esc(o.tittel)}</del></p><p class="txt"><del>${esc(o.tekst)}</del></p>`;
  const n = proposed(id);
  return `<p class="ttl">${diffSide(diff(o.tittel, n.tittel), "del")}</p><p class="txt">${textSide(o.tekst, n.tekst, "del")}</p>`;
}

function proposalCell(id) {
  const o = base[id], p = state.proposals[id] || {}, n = proposed(id);
  const changed = isChanged(id);
  let body;
  if (p.ny) {
    body = `<span class="tag new">Ny</span>
      <p class="ttl">${filled(n.tittel) ? `<ins>${esc(n.tittel)}</ins>` : `<span class="faint">Utan tittel</span>`}</p>
      <p class="txt">${filled(n.tekst) ? `<ins>${esc(n.tekst)}</ins>` : `<span class="faint">Inga tekst enno</span>`}</p>`;
  } else if (p.oppheva) {
    body = `<span class="tag gone">Stryking</span><p class="faint">Heile paragrafen blir stroken.</p>`;
  } else if (n.tekst !== o.tekst || n.tittel !== o.tittel) {
    body = `<span class="tag edit">Endra</span>
      <p class="ttl">${diffSide(diff(o.tittel, n.tittel), "ins")}</p>
      <p class="txt">${textSide(o.tekst, n.tekst, "ins")}</p>`;
    const al = alignPoints(o.tekst, n.tekst), moved = al ? reletterNote(al.points) : "";
    if (moved) body += `<p class="note">${esc(moved)}</p>`;
    for (const w of referenceWarnings(id)) body += `<p class="note warn">Sjekk tilvisinga: ${esc(w)}</p>`;
  } else {
    body = `<div class="unchanged"><p class="ttl">${esc(o.tittel)}</p><p class="txt">${esc(o.tekst)}</p></div>`;
  }
  if (filled(p.grunngjeving)) body += `<div class="why"><b>Begrunnelse:</b> ${esc(p.grunngjeving)}</div>`;
  const note = shiftNote(id);
  if (note) body += `<div class="why">Blir lagt til i begrunnelsen: <i>${esc(note)}</i></div>`;
  if (changed) {
    body += `<div class="acts">
      ${filled(p.grunngjeving) ? "" : `<button class="link" data-act="add-why" data-id="${id}">Legg til begrunnelse</button><span class="grow"></span>`}
      <button class="btn small" data-act="download" data-id="${id}">Last ned skjema</button>
      <button class="btn quiet ${p.ny ? "danger" : ""}" data-act="${p.ny ? "delete" : "reset"}" data-id="${id}">${p.ny ? "Slett" : "Tilbakestill"}</button>
    </div>`;
  } else {
    body += `<div class="hint">Klikk for å endra</div>`;
  }
  const label = o ? (o.nr ? `§ ${o.nr}` : "innleiinga") : `§ ${numberOf(id)}`;
  return `<div class="cell prop" data-act="open" data-id="${id}" tabindex="0" role="button" aria-label="Endra ${esc(label)}">${body}</div>`;
}

const FONT = '<w:rFonts w:ascii="Roboto" w:cs="Roboto" w:eastAsia="Roboto" w:hAnsi="Roboto"/>';
const xesc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Rekkjefølgja i w:rPr er fastsett av standarden
function run(text, f = {}) {
  const props = FONT
    + (f.b ? "<w:b/><w:bCs/>" : "") + (f.i ? "<w:i/><w:iCs/>" : "")
    + (f.strike ? "<w:strike/>" : "") + (f.color ? `<w:color w:val="${f.color}"/>` : "")
    + (f.u ? '<w:u w:val="single"/>' : "");
  return `<w:r><w:rPr>${props}</w:rPr><w:t xml:space="preserve">${xesc(text)}</w:t></w:r>`;
}
const lines = (s, f) => String(s || "").split("\n").map(l => l ? run(l, f) : "");

// Skilnad som Word-avsnitt: strykt raudt eller understreka grønt
function diffParas(ops, side, bold = false) {
  const paras = [""];
  for (const { t, s } of ops) {
    if (t !== "eq" && t !== side) continue;
    const f = { b: bold };
    if (t === "del") Object.assign(f, { strike: true, color: "A4262C" });
    if (t === "ins") Object.assign(f, { u: true, color: "17613A" });
    s.split("\n").forEach((part, i) => {
      if (i) paras.push("");
      if (part) paras[paras.length - 1] += run(part, f);
    });
  }
  return paras;
}

function formFor(id) {
  const why = text => lines(text).filter(Boolean);
  const note = text => text ? [run(text, { i: true })] : [];

  if (state.chapters[id]) {
    const ch = state.chapters[id];
    const kids = rowIds(id).filter(isChanged);
    const title = ch.tittel.trim() || "Nytt kapittel";
    return {
      chapter: `${title} (nytt kapittel)`,
      paragraph: "Hele kapitlet",
      type: "Ny",
      current: [run("Nytt kapittel, har ingen gjeldende tekst.", { i: true })],
      proposed: [run(title, { b: true })].concat(kids.length
        ? kids.map(k => run(`§ ${numberOf(k)} ${state.proposals[k].tittel || "(uten tittel)"}`)).concat(run("Paragrafene står som egne forslag.", { i: true }))
        : [run("(Ingen paragrafer ennå.)", { i: true })]),
      why: why(ch.grunngjeving).concat(note(chapterNote(id))),
    };
  }

  const o = base[id], p = state.proposals[id] || {};
  const c = chapterList().find(x => x.key === kapOf(id));
  const f = {
    chapter: c ? c.title + (c.isNew ? " (nytt kapittel)" : "") : "",
    type: !p.ny && TYPES.includes(p.type) ? p.type : autoType(id),
    why: why(p.grunngjeving).concat(note(shiftNote(id))),
  };

  if (p.ny) {
    return { ...f, paragraph: `§ ${numberOf(id)} (ny)`,
      current: [run("Ny paragraf, har ingen gjeldende tekst.", { i: true })],
      proposed: [run(p.tittel || "", { b: true })].concat(lines(p.tekst)) };
  }
  const nr = o.nr ? `§ ${o.nr}` : "Innledning til kapittel XII";
  if (p.oppheva) {
    return { ...f, paragraph: nr,
      current: [run(o.tittel, { b: true })].concat(lines(o.tekst)),
      proposed: [run("Paragrafen strykes i sin helhet.")] };
  }
  const n = proposed(id), titleChanged = n.tittel !== o.tittel;
  const al = titleChanged ? null : alignPoints(o.tekst, n.tekst);
  const changed = al ? al.points.filter(pointChanged) : [];
  if (changed.length) {
    // Berre punkta som er endra kjem med; ny bokstavering står som merknad
    const red = { strike: true, color: "A4262C" }, green = { u: true, color: "17613A" };
    const current = changed.filter(e => e.old).map(e => e.kind === "removed"
      ? run(`${e.old.letter}. ${e.old.body}`, red)
      : run(`${e.old.letter}. `) + diffParas(diff(e.old.body, e.new.body), "del")[0]);
    const proposedLines = changed.map(e => e.kind === "removed" ? run(`Bokstav ${e.old.letter} strykes.`)
      : e.kind === "added" ? run(`${e.final}. ${e.new.body}`, green)
      : run(`${e.final}. `) + diffParas(diff(e.old.body, e.new.body), "ins")[0]);
    return { ...f,
      paragraph: `${nr} ${changed.map(e => e.kind === "added" ? `ny ${e.final})` : `${e.old.letter})`).join(", ")}`,
      current: current.length ? current : [run("Ny bokstav, har ingen gjeldende tekst.", { i: true })],
      proposed: proposedLines.concat(note(reletterNote(al.points))) };
  }
  const ops = diff(o.tekst, n.tekst);
  const titleOps = titleChanged ? diff(o.tittel, n.tittel) : null;
  return { ...f,
    paragraph: nr,
    current: (titleOps ? diffParas(titleOps, "del", true) : []).concat(diffParas(ops, "del")),
    proposed: (titleOps ? diffParas(titleOps, "ins", true) : [])
      .concat(diffParas(ops, "ins")) };
}

function fillParagraph(xml, marker, paras) {
  const at = xml.indexOf(marker);
  if (at < 0) return xml;
  const start = xml.lastIndexOf("<w:p ", at), end = xml.indexOf("</w:p>", at) + 6;
  const pPr = (xml.slice(start, end).match(/<w:pPr>[\s\S]*?<\/w:pPr>/) || [""])[0];
  const body = (paras.length ? paras : [""]).map(r => `<w:p>${pPr}${r}</w:p>`).join("");
  return xml.slice(0, start) + body + xml.slice(end);
}

function fillForm(block, f) {
  return [
    ["@@LYDER@@", f.current], ["@@ENDRES@@", f.proposed], ["@@BEGRUNNELSE@@", f.why],
  ].reduce((xml, [m, paras]) => fillParagraph(xml, m, paras), block
    .replace("<w:r><w:t>@@KAPITTEL@@</w:t></w:r>", run(f.chapter))
    .replace("<w:r><w:t>@@TYPE@@</w:t></w:r>", run(f.type))
    .replace("@@PARAGRAF@@", xesc(f.paragraph))
    .replace("@@STILLER@@", xesc(state.author.trim())));
}

async function buildDocx(ids) {
  const response = await fetch("/statuttendringsskjema.docx");
  if (!response.ok) throw new Error("Skjemamalen kunne ikkje lastast ned");
  const zip = await JSZip.loadAsync(await response.arrayBuffer());
  const xml = await zip.file("word/document.xml").async("string");
  const start = xml.indexOf("<w:body>") + 8, end = xml.indexOf("<w:sectPr");
  const block = xml.slice(start, end).replace(/ w14:paraId="[^"]*"/g, "");
  const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  zip.file("word/document.xml", xml.slice(0, start) + ids.map(id => fillForm(block, formFor(id))).join(pageBreak) + xml.slice(end));
  return zip.generateAsync({ type: "blob", mimeType: DOCX });
}

/* ============================================================
   Filnamn og nedlasting
   ============================================================ */
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const cleanName = (s) => s.replace(/[\\/:*?"<>|]+/g, "").trim();
const bytes = (s) => new Blob([s]).size;

function nameFor(ids) {
  const prefix = "Statuttendringsforslag ", max = 235;
  const labels = ids.map(labelFor);
  for (const list of [labels, labels.map((l) => l.replace(/§ /g, "§"))]) {
    const name = prefix + list.join(", ") + ".docx";
    if (bytes(name) <= max) return name;
  }
  const tight = labels.map((l) => l.replace(/§ /g, "§"));
  let name = prefix, i = 0;
  while (i < tight.length && bytes(name + (i ? ", " : "") + tight[i] + ` og ${tight.length - i - 1} til.docx`) <= max) {
    name += (i ? ", " : "") + tight[i++];
  }
  return `${name} og ${tight.length - i} til.docx`;
}

async function saveFile(name, data, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

async function downloadForms(ids) {
  hintAuthor();
  try { await saveFile(cleanName(nameFor(ids)), await buildDocx(ids), DOCX); }
  catch { toast("Klarte ikkje å laga fila. Sjekk nettet og prøv igjen."); }
}

async function downloadZip(ids) {
  hintAuthor();
  try {
    const zip = new JSZip(), used = {};
    for (const id of ids) {
      let name = cleanName("Statuttendringsforslag " + labelFor(id));
      used[name] = (used[name] || 0) + 1;
      if (used[name] > 1) name += ` (${used[name]})`;
      zip.file(name + ".docx", await buildDocx([id]));
    }
    await saveFile(`Statuttendringsforslag (${ids.length} filer).zip`, await zip.generateAsync({ type: "blob" }), "application/zip");
  } catch { toast("Klarte ikkje å laga filene. Sjekk nettet og prøv igjen."); }
}

// Alt som er endra, i rekkjefølgje, med nye kapittel først i sitt kapittel
function everything() {
  const out = [];
  for (const c of chapterList()) {
    if (c.isNew) out.push(c.key);
    out.push(...rowIds(c.key).filter(isChanged));
  }
  return out;
}

function overviewHtml() {
  const ids = everything();
  const style = "body{font-family:Georgia,serif;max-width:960px;margin:40px auto;padding:0 20px;color:#1a1f2b;line-height:1.55}h2{margin-top:2em;padding-bottom:4px;border-bottom:1px solid #ccd;font-size:1.2rem}h3{margin:1.4em 0 .4em;font-size:1.05rem}table{width:100%;border-collapse:collapse;table-layout:fixed}td,th{border:1px solid #ccd;padding:8px 10px;vertical-align:top;text-align:left;white-space:pre-wrap}th{background:#eef1f5;font:600 .85rem Arial,sans-serif}del{background:#fbe1e1;color:#a4262c}ins{background:#d6f0df;color:#17613a;text-decoration:none}.why{margin:.5em 0 0;font:.9rem Arial,sans-serif}";
  let h = `<!DOCTYPE html><html lang="nb"><head><meta charset="utf-8"><title>Endringsforslag til statuttene</title><style>${style}</style></head><body>`;
  h += `<h1>Endringsforslag til statuttene</h1><p>Basert på statuttene per 20. juli 2026.${state.author.trim() ? " Forslagsstiller: " + esc(state.author.trim()) + "." : ""}</p>`;
  let lastChapter = null;
  for (const id of ids) {
    const kap = state.chapters[id] ? id : kapOf(id);
    if (kap !== lastChapter) {
      const c = chapterList().find(x => x.key === kap);
      h += `<h2>${esc(c.title)}${c.isNew ? " (nytt kapittel)" : ""}</h2>`;
      lastChapter = kap;
    }
    const whyBlock = (text, extra) => (filled(text) ? `<p class="why"><strong>Begrunnelse:</strong> ${esc(text)}</p>` : "") + (extra ? `<p class="why"><em>${esc(extra)}</em></p>` : "");
    if (state.chapters[id]) { h += whyBlock(state.chapters[id].grunngjeving, chapterNote(id)); continue; }
    const o = base[id], p = state.proposals[id] || {}, n = proposed(id);
    let head, left, right;
    if (p.ny) {
      head = `§ ${esc(numberOf(id))} (ny) ${esc(p.tittel || "")}`;
      left = "<em>Ny paragraf</em>";
      right = `<strong>${esc(p.tittel || "")}</strong>\n<ins>${esc(p.tekst || "")}</ins>`;
    } else if (p.oppheva) {
      head = `§ ${esc(o.nr)} ${esc(o.tittel)}`;
      left = `<del>${esc(o.tekst)}</del>`;
      right = "<em>Paragrafen strykes i sin helhet.</em>";
    } else {
      const titleOps = diff(o.tittel, n.tittel), al = alignPoints(o.tekst, n.tekst);
      const moved = al ? reletterNote(al.points) : "";
      head = `${o.nr ? "§ " + esc(o.nr) + " " : ""}${esc(o.tittel)}`;
      left = `<strong>${diffSide(titleOps, "del")}</strong>\n${textSide(o.tekst, n.tekst, "del")}`;
      right = `<strong>${diffSide(titleOps, "ins")}</strong>\n${textSide(o.tekst, n.tekst, "ins")}${moved ? `\n<em>${esc(moved)}</em>` : ""}`;
    }
    h += `<h3>${head}</h3><table><tr><th>Gjeldende tekst</th><th>Forslag til ny tekst</th></tr><tr><td>${left}</td><td>${right}</td></tr></table>`;
    h += whyBlock(p.grunngjeving, shiftNote(id));
  }
  return h + "</body></html>";
}

function draftFile() {
  return JSON.stringify({
    format: "statuttendringar-utkast", versjon: 1, grunnlag: "Statuttar per 20. juli 2026",
    stiller: state.author, lagra: new Date().toISOString(),
    forslag: state.proposals, kapittel: state.chapters,
  }, null, 2);
}

async function openDraft(file) {
  let raw = null;
  try { raw = JSON.parse(await file.text()); } catch { /* Invalid file is handled below. */ }
  if (raw?.format !== "statuttendringar-utkast") {
    toast("Fila er ikkje frå denne sida.");
    return;
  }
  const hasWork = Object.keys(state.proposals).length || Object.keys(state.chapters).length;
  if (hasWork && !confirm("Fila erstattar det du har no. Vil du halda fram?")) return;
  const next = sanitize(raw);
  state.proposals = next.proposals;
  state.chapters = next.chapters;
  state.author = next.author || state.author;
  editing = null;
  save(true);
  const n = everything().length;
  toast(n ? `Opna ${n} forslag.` : "Fila var tom.");
}

const today = () => new Date().toISOString().slice(0, 10);

function hintAuthor() {
  if (state.author.trim() || authorHinted) return;
  authorHinted = true;
  toast("Skriv namnet ditt øvst, så kjem det med i skjemaet.");
}

function summaryStats() {
  let edited = 0, added = 0;
  const perChapter = {};
  for (const id of Object.keys(base).concat(Object.keys(state.proposals).filter((key) => !base[key]))) {
    if (!isChanged(id)) continue;
    if (base[id]) edited++;
    else added++;
    const chapter = kapOf(id);
    perChapter[chapter] = (perChapter[chapter] || 0) + 1;
  }
  return { edited, added, chapters: Object.keys(state.chapters).length, perChapter };
}

function openEditor(id) {
  if (editing && editing !== id) closeEditor();
  editing = id;
}

function closeEditor() {
  if (!editing) return;
  const id = editing;
  editing = null;
  tidy(id);
  save(true);
}

function onEditorInput(field, value) {
  const id = editing;
  if (!id) return;
  const p = state.proposals[id] || (state.proposals[id] = { kap: kapOf(id) });
  if (field === "title") p.tittel = value;
  if (field === "why") p.grunngjeving = value;
  if (field === "type") {
    if (value) p.type = value;
    else delete p.type;
  }
  if (field === "text") {
    p.tekst = value;
    if (!p.ny) {
      if (filled(value)) delete p.oppheva;
      else p.oppheva = true;
    }
  }
  save();
}

const actions = {
  open: ({ id }) => openEditor(id),
  close: () => closeEditor(),
  "add-why": ({ id }) => openEditor(id),
  download: ({ id }) => {
    if (editing) closeEditor();
    if (isChanged(id)) downloadForms([id]);
    else toast("Paragrafen er ikkje endra.");
  },
  "download-chapter": ({ kap }) => downloadForms([kap]),
  "strike-all": ({ id }) => {
    state.proposals[id] = { ...state.proposals[id], kap: kapOf(id), oppheva: true, tekst: "" };
    editing = null;
    save(true);
  },
  reset: ({ id }) => {
    const label = base[id].nr ? `§ ${base[id].nr}` : "innleiinga";
    if (!confirm(`Vil du tilbakestilla ${label}? Forslaget og begrunnelsen forsvinn.`)) return;
    delete state.proposals[id];
    if (editing === id) editing = null;
    save(true);
  },
  delete: ({ id }) => {
    if (!confirm("Vil du sletta den nye paragrafen?")) return;
    delete state.proposals[id];
    editing = null;
    save(true);
  },
  add: ({ kap, after }) => {
    if (editing) closeEditor();
    const id = newId("ny-");
    state.proposals[id] = { ny: true, kap, etter: after || null, tittel: "", tekst: "", oppretta: Date.now() };
    save(true);
    openEditor(id);
  },
  "add-chapter": ({ kap }) => {
    if (editing) closeEditor();
    const position = chapterList().findIndex((chapter) => chapter.key === kap) + 2;
    const key = newId("nk-");
    state.chapters[key] = { tittel: roman(position) + ". ", grunngjeving: "", etter: kap, oppretta: Date.now() };
    save(true);
  },
  "delete-chapter": ({ kap }) => {
    const kids = newParasIn(kap);
    const message = kids.length
      ? `Vil du sletta kapitlet og ${kids.length === 1 ? "paragrafen" : `dei ${kids.length} paragrafane`} i det?`
      : "Vil du sletta kapitlet?";
    if (!confirm(message)) return;
    if (editing) closeEditor();
    kids.forEach((id) => delete state.proposals[id]);
    for (const chapter of Object.values(state.chapters)) if (chapter.etter === kap) chapter.etter = state.chapters[kap].etter;
    delete state.chapters[kap];
    save(true);
  },
  "export-docx": () => everything().length ? downloadForms(everything()) : toast("Ingen endringar å lasta ned."),
  "export-zip": () => everything().length ? downloadZip(everything()) : toast("Ingen endringar å lasta ned."),
  "export-html": () => everything().length ? saveFile("Endringsforslag statuttar.html", overviewHtml(), "text/html") : toast("Ingen endringar å lasta ned."),
  "draft-save": () => saveFile(`Statuttendringar ${today()}.json`, draftFile(), "application/json"),
  "draft-open": () => fileInput?.click(),
  "reset-all": () => {
    if (!Object.keys(state.proposals).length && !Object.keys(state.chapters).length) {
      toast("Det er ingenting å tilbakestilla.");
      return;
    }
    if (!confirm("Vil du tilbakestilla alt? Lagre arbeidet som fil først om du vil ta vare på det.")) return;
    state.proposals = {};
    state.chapters = {};
    editing = null;
    save(true);
    toast("Alt er tilbakestilt.");
  },
};

let stats = $derived(summaryStats());
let chapters = $derived(chapterList());
let hasChanges = $derived(everything().length > 0);

function toast(text) {
  toastText = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toastText = ""), 2800);
}

function flashSaved() {
  savedText = "Lagra";
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => (savedText = ""), 2000);
}

function resizeTextarea(event) {
  const field = event.currentTarget;
  field.style.height = "auto";
  field.style.height = `${field.scrollHeight + 2}px`;
}

function handleRootClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest(".application")) {
    menuOpen = false;
    return;
  }
  if (menuOpen && !target.closest(".menu")) menuOpen = false;
  const control = target.closest("[data-act]");
  if (!control) return;
  const action = actions[control.dataset.act];
  if (!action) return;
  event.preventDefault();
  if (control.closest("#menu")) {
    menuOpen = false;
    if (editing) closeEditor();
  }
  action(control.dataset);
}

function handleRootKeydown(event) {
  if (event.key === "Escape") {
    if (menuOpen) {
      menuOpen = false;
      return;
    }
    if (editing) closeEditor();
    return;
  }
  const target = event.target;
  const cell = target instanceof Element ? target.closest('[data-act="open"]') : null;
  if (cell && target === cell && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    openEditor(cell.dataset.id);
  }
}

function handleFileChange(event) {
  const file = event.currentTarget.files?.[0];
  if (file) openDraft(file);
  event.currentTarget.value = "";
}

onMount(() => {
  load();
  if (!barElement || typeof ResizeObserver === "undefined") return;
  const observer = new ResizeObserver(() => {
    document.documentElement.style.setProperty("--barh", `${barElement.offsetHeight}px`);
  });
  observer.observe(barElement);
  return () => observer.disconnect();
});
</script>

<svelte:window onclick={handleRootClick} onkeydown={handleRootKeydown} />
<div class="application" role="application" aria-label="Statuttendringar">
  <header class="bar" bind:this={barElement}>
    <div class="bar-in">
      <h1>Statuttendringar<small>Studentersamfunnet, statuttane per 20. juli 2026</small></h1>
      <div class="grow"></div>
      <span class="summary" aria-live="polite">
        {#if stats.edited || stats.added || stats.chapters}
          {#if stats.edited}<b>{stats.edited}</b> endra{/if}
          {#if stats.added}{#if stats.edited}, {/if}<b>{stats.added}</b> {stats.added === 1 ? "ny paragraf" : "nye paragrafar"}{/if}
          {#if stats.chapters}{#if stats.edited || stats.added}, {/if}<b>{stats.chapters}</b> {stats.chapters === 1 ? "nytt kapittel" : "nye kapittel"}{/if}
        {:else}
          Ingen endringar
        {/if}
      </span>
      <label class="check"><input type="checkbox" bind:checked={onlyChanges}> Vis berre endringar</label>
      <span class="saved" aria-live="polite">{savedText}</span>
      <label class="author">Forslagsstillar <input placeholder="Namnet ditt" autocomplete="name" value={state.author} oninput={(event) => { state.author = event.currentTarget.value; save(); }}></label>
      <div class="menu">
        <button class="btn primary" aria-haspopup="true" aria-expanded={menuOpen} aria-controls="menu" onclick={() => (menuOpen = !menuOpen)}>Filer</button>
        {#if menuOpen}
          <div class="menu-list" id="menu" role="menu">
            <h2>Last ned alle forslaga</h2>
            <button role="menuitem" data-act="export-docx">Som eitt dokument (.docx)<small>Eitt skjema per side</small></button>
            <button role="menuitem" data-act="export-zip">Som separate filer (.zip)<small>Eitt dokument per forslag</small></button>
            <button role="menuitem" data-act="export-html">Som oversikt (.html)<small>Gjeldande og ny tekst side om side</small></button>
            <hr>
            <h2>Arbeidet ditt</h2>
            <button role="menuitem" data-act="draft-save">Lagre som fil<small>Ta det med til ei anna maskin, eller send det til nokon</small></button>
            <button role="menuitem" data-act="draft-open">Opne fil<small>Hent inn noko du har lagra før</small></button>
            <hr>
            <button role="menuitem" data-act="reset-all" class="danger">Tilbakestill alt</button>
          </div>
        {/if}
      </div>
      <input bind:this={fileInput} type="file" accept=".json,application/json" hidden onchange={handleFileChange}>
    </div>
  </header>

  <div class="wrap">
    <nav class="toc" aria-label="Kapittel">
      {#each chapters as chapter (chapter.key)}
        <a href={`#kap-${chapter.key}`}><span>{chapter.title}</span><span class="n">{stats.perChapter[chapter.key] || ""}</span></a>
      {/each}
    </nav>
    <main>
      <p class="intro">Klikk på ein paragraf i høgre kolonne for å skriva eit forslag. Det du skriv, blir lagra i nettlesaren din.</p>
      <div class="cols" aria-hidden="true"><span>Gjeldande</span><span>Forslag</span></div>
      <div class="document">
        {#each chapters as chapter (chapter.key)}
          {#if chapter.isNew}
            {@const newChapter = state.chapters[chapter.key]}
            <div class="chap new" id={`kap-${chapter.key}`}>
              <span class="tag new">Nytt kapittel</span>
              <div class="line">
                <input value={newChapter.tittel} placeholder="Til dømes V. Frivillige" aria-label="Tittel på kapitlet" oninput={(event) => { newChapter.tittel = event.currentTarget.value; save(); }}>
                <button class="btn small" data-act="download-chapter" data-kap={chapter.key}>Last ned skjema</button>
                <button class="btn quiet danger" data-act="delete-chapter" data-kap={chapter.key}>Slett kapitlet</button>
              </div>
              <p class="note">Blir lagt til i begrunnelsen: <i>{chapterNote(chapter.key)}</i></p>
              <label for={`why-${chapter.key}`}>Begrunnelse</label>
              <textarea id={`why-${chapter.key}`} value={newChapter.grunngjeving} oninput={(event) => { newChapter.grunngjeving = event.currentTarget.value; resizeTextarea(event); save(); }}></textarea>
            </div>
          {:else}
            <h2 class="chap" id={`kap-${chapter.key}`}>{chapter.title}</h2>
          {/if}
          {@const ids = rowIds(chapter.key)}
          {#each ids as id, rowIndex (id)}
            {#if !onlyChanges || isChanged(id)}
              <section class:changed={isChanged(id)} class:editing={editing === id} class="row" id={id}>
                {@html numberCell(id)}
                <div class="cell orig">{@html origContent(id)}</div>
                {#if editing === id}
                  {@const original = base[id]}
                  {@const proposal = state.proposals[id] || {}}
                  {@const next = proposed(id)}
                  <div class="cell prop">
                    <div class="ed">
                      {#if proposal.ny}
                        <p class="note" style="margin:0 0 10px">Blir § {numberOf(id)}.{#if shiftNote(id)} Dette blir lagt til i begrunnelsen: <i>{shiftNote(id)}</i>{/if}</p>
                      {/if}
                      <label for="ed-title">Tittel</label>
                      <input id="ed-title" value={next.tittel} oninput={(event) => onEditorInput("title", event.currentTarget.value)}>
                      {#if !proposal.ny}
                        <label for="ed-type">Type endring</label>
                        <select id="ed-type" value={proposal.type || ""} onchange={(event) => onEditorInput("type", event.currentTarget.value)}>
                          <option value="">Automatisk ({autoType(id)})</option>
                          {#each TYPES as type}<option value={type}>{type}</option>{/each}
                        </select>
                      {/if}
                      <label for="ed-text">Tekst</label>
                      <textarea id="ed-text" value={next.tekst} oninput={(event) => { onEditorInput("text", event.currentTarget.value); resizeTextarea(event); }}></textarea>
                      <label for="ed-why">Begrunnelse</label>
                      <textarea id="ed-why" class="why-in" value={proposal.grunngjeving || ""} oninput={(event) => { onEditorInput("why", event.currentTarget.value); resizeTextarea(event); }}></textarea>
                      <div class="acts">
                        <button class="btn primary" data-act="close">Ferdig</button>
                        <button class="btn" data-act="download" data-id={id}>Last ned skjema</button>
                        <span class="grow"></span>
                        {#if proposal.ny}
                          <button class="btn quiet danger" data-act="delete" data-id={id}>Slett</button>
                        {:else}
                          <button class="btn quiet" data-act="reset" data-id={id}>Tilbakestill</button>
                          {#if !proposal.oppheva}<button class="btn quiet danger" data-act="strike-all" data-id={id}>Stryk heile paragrafen</button>{/if}
                        {/if}
                      </div>
                      {#if original}
                        <div class="preview"><p>Endringa</p><p class="txt">{@html textInline(original.tekst, next.tekst) || '<span class="faint">Tom</span>'}</p>
                          {#if referenceWarnings(id).length}<div id="ed-notes">{#each referenceWarnings(id) as warning}<p class="note warn">Sjekk tilvisinga: {warning}</p>{/each}</div>{/if}
                        </div>
                      {/if}
                    </div>
                  </div>
                {:else}
                  {@html proposalCell(id)}
                {/if}
              </section>
            {/if}
            {#if rowIndex < ids.length - 1}
              <div class="ins"><button data-act="add" data-kap={chapter.key} data-after={id}>+ Ny paragraf her</button></div>
            {/if}
          {/each}
          <div class="foot"><div>
            <button class="btn quiet" data-act="add" data-kap={chapter.key}>+ Ny paragraf sist i {chapter.isNew ? "det nye kapitlet" : `kapittel ${chapter.key}`}</button>
            <button class="btn quiet" data-act="add-chapter" data-kap={chapter.key}>+ Nytt kapittel etter {chapter.isNew ? "det nye kapitlet" : `kapittel ${chapter.key}`}</button>
          </div></div>
        {/each}
      </div>
      {#if onlyChanges && !hasChanges}<p class="empty-note">Ingen endringar enno.</p>{/if}
    </main>
  </div>
  <div class="toast" class:show={toastText} role="status">{toastText}</div>
</div>
