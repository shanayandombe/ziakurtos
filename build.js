#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  Zia Kürtös — build.js
//  Netlify Build Command : node build.js
//  Publish Directory     : .
//  Output                : assets/js/zia-data.js
//
//  Aucune dépendance externe — Node.js uniquement (Node 14+).
//
//  COMPORTEMENT :
//  - Si content/evenements/ est vide → window.ZIA_EVENTS = []
//  - Si content/saveurs/ est vide    → window.ZIA_FLAVORS = []
//  - Si content/galerie/ est vide ou absent → window.ZIA_GALLERY = []
//  - content/settings/site.yml et contact.yml sont créés s'ils sont absents.
//  - Aucun seeding automatique des événements, saveurs ou galerie.
//  - Les palettes de couleurs (summer / winter) ne sont PAS générées ici :
//    elles vivent uniquement dans assets/css/styles.css, via [data-theme].
//    build.js transmet seulement active_theme dans ZIA_SETTINGS.
//
//  PARSEUR YAML :
//  Mini-parseur maison qui couvre le YAML écrit par Decap CMS pour les
//  fichiers de ce projet (clés à la racine, valeurs scalaires) :
//    • texte simple, y compris apostrophes, accents et ":" au milieu d'un texte
//    • texte entre "guillemets" ou 'apostrophes' (échappements gérés)
//    • valeurs REPLIÉES sur plusieurs lignes (texte simple ou entre guillemets)
//    • blocs littéraux | et repliés > (avec -, + et indentation explicite)
//    • nombres, booléens, null / ~ / champ vide, dates
//    • listes simples de scalaires ("- valeur")
//  Les structures imbriquées (objets dans objets) ne sont pas utilisées par ce
//  projet et ne sont pas interprétées.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const fs   = require('fs');
const path = require('path');

// ── MINI YAML PARSER ─────────────────────────────────────────────────────────

// Décode les échappements d'une chaîne entre guillemets doubles.
// `parts` = lignes de la valeur (déjà trimées), la 1re commence par le guillemet ouvrant.
function decodeDoubleQuoted(parts) {
  let out = '';
  let li  = 0;
  let s   = parts[0].slice(1);
  for (;;) {
    let j = 0, escapedBreak = false;
    while (j < s.length) {
      const c = s[j];
      if (c === '"') return out;                       // guillemet fermant
      if (c === '\\') {
        if (j + 1 >= s.length) { escapedBreak = true; j++; break; } // "\" en fin de ligne
        const n = s[j + 1];
        j += 2;
        switch (n) {
          case 'n':  out += '\n'; break;
          case 't':  out += '\t'; break;
          case 'r':  out += '\r'; break;
          case '0':  out += '\0'; break;
          case 'b':  out += '\b'; break;
          case 'f':  out += '\f'; break;
          case 'v':  out += '\v'; break;
          case 'a':  out += '\x07'; break;
          case 'e':  out += '\x1b'; break;
          case 'N':  out += '\u0085'; break;
          case '_':  out += '\u00a0'; break;
          case 'L':  out += '\u2028'; break;
          case 'P':  out += '\u2029'; break;
          case ' ':  out += ' '; break;
          case '/':  out += '/'; break;
          case '"':  out += '"'; break;
          case '\\': out += '\\'; break;
          case 'x': { out += String.fromCharCode(parseInt(s.substr(j, 2), 16)); j += 2; break; }
          case 'u': { out += String.fromCharCode(parseInt(s.substr(j, 4), 16)); j += 4; break; }
          case 'U': { out += String.fromCodePoint(parseInt(s.substr(j, 8), 16)); j += 8; break; }
          default:   out += n;
        }
        continue;
      }
      out += c; j++;
    }
    // fin de ligne sans guillemet fermant → suite sur la ligne suivante
    if (li + 1 >= parts.length) return out;            // valeur non terminée : on rend ce qu'on a
    if (escapedBreak) {
      li++;                                            // "\" + saut de ligne : collage direct
    } else {
      let blanks = 0;
      li++;
      while (li < parts.length && parts[li] === '') { blanks++; li++; }
      if (li >= parts.length) return out;
      out += blanks ? '\n'.repeat(blanks) : ' ';       // 1 saut = espace ; lignes vides = \n
    }
    s = parts[li];
  }
}

// Décode une chaîne entre apostrophes ('' = apostrophe littérale).
function decodeSingleQuoted(parts) {
  let out = '';
  let li  = 0;
  let s   = parts[0].slice(1);
  for (;;) {
    let j = 0;
    while (j < s.length) {
      const c = s[j];
      if (c === "'") {
        if (s[j + 1] === "'") { out += "'"; j += 2; continue; }
        return out;                                    // apostrophe fermante
      }
      out += c; j++;
    }
    if (li + 1 >= parts.length) return out;
    let blanks = 0;
    li++;
    while (li < parts.length && parts[li] === '') { blanks++; li++; }
    if (li >= parts.length) return out;
    out += blanks ? '\n'.repeat(blanks) : ' ';
    s = parts[li];
  }
}

// Typage d'un scalaire SIMPLE (non quoté) : null, booléen, nombre, sinon texte.
function resolvePlain(s) {
  if (s === '' || s === '~' || /^(null|Null|NULL)$/.test(s)) return null;
  if (/^(true|True|TRUE)$/.test(s))  return true;
  if (/^(false|False|FALSE)$/.test(s)) return false;
  if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(s)) return Number(s);
  return s;                                            // dates (YYYY-MM-DD) restent du texte
}

// Scalaire simple sur plusieurs lignes : repli des sauts de ligne.
function foldPlain(parts) {
  let out = '';
  let pendingBlanks = 0;
  parts.forEach((line, idx) => {
    if (line === '') { pendingBlanks++; return; }
    if (idx > 0 && out !== '') out += pendingBlanks ? '\n'.repeat(pendingBlanks) : ' ';
    pendingBlanks = 0;
    out += line;
  });
  return out;
}

// Bloc littéral ( | ) ou replié ( > ), avec indicateurs de chomping.
function parseBlockScalar(style, indicators, cont) {
  const chomp    = indicators.includes('-') ? 'strip' : indicators.includes('+') ? 'keep' : 'clip';
  const explicit = indicators.match(/[1-9]/);
  let indent = explicit ? Number(explicit[0]) : null;
  if (indent === null) {
    const firstText = cont.find(l => l.trim() !== '');
    if (!firstText) return '';
    indent = firstText.match(/^ */)[0].length;
  }
  const lines = cont.map(l => {
    if (l.trim() === '') return '';
    const lead = l.match(/^ */)[0].length;
    return l.slice(Math.min(indent, lead));
  });

  let text;
  if (style === '|') {
    text = lines.join('\n');
  } else {
    text = '';
    lines.forEach((line, idx) => {
      if (line === '') { text += '\n'; return; }
      if (idx > 0 && text !== '' && !text.endsWith('\n')) text += ' ';
      text += line;
    });
  }
  text = text.replace(/\n+$/, '');
  if (chomp === 'strip') return text;
  return text === '' ? '' : text + '\n';               // clip / keep
}

// Liste simple de scalaires : "- a", "- 'b'", "- \"c\"".
function parseList(cont) {
  const items = [];
  cont.forEach(l => {
    const m = l.match(/^\s*-(?:[ \t]+(.*))?$/);
    if (!m) return;
    const raw = (m[1] || '').trim();
    if (raw.startsWith('"'))      items.push(decodeDoubleQuoted([raw]));
    else if (raw.startsWith("'")) items.push(decodeSingleQuoted([raw]));
    else                          items.push(resolvePlain(raw.replace(/\s+#.*$/, '').trim()));
  });
  return items;
}

// Interprète la valeur d'une clé : `first` = texte après "clé:", `cont` = lignes suivantes.
function parseValue(first, cont) {
  let head = first.trim();
  cont = cont.slice();

  // "clé:" seul → valeur sur la ligne suivante, liste, ou vide
  if (head === '' || head.startsWith('#')) {
    head = '';
    const next = cont.findIndex(l => l.trim() !== '');
    if (next === -1) return null;
    if (/^\s*-(\s|$)/.test(cont[next])) return parseList(cont);
    head = cont[next].trim();
    cont.splice(0, next + 1);
  }

  // blocs | et >
  const bm = head.match(/^([|>])([1-9+-]{0,2})(?:\s+#.*)?$/);
  if (bm) return parseBlockScalar(bm[1], bm[2], cont);

  const parts = [head, ...cont.map(l => l.trim())];

  if (head.startsWith('"')) return decodeDoubleQuoted(parts);
  if (head.startsWith("'")) return decodeSingleQuoted(parts);

  // scalaire simple : on retire les commentaires " # ..." ligne par ligne
  const cleaned = parts.map(l => l.replace(/(^|\s)#.*$/, '').trim());
  while (cleaned.length && cleaned[cleaned.length - 1] === '') cleaned.pop();
  return resolvePlain(foldPlain(cleaned));
}

function parseYAML(text) {
  const lines = String(text).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const obj   = {};
  const KEY_RE = /^([A-Za-z_][A-Za-z0-9_-]*)[ \t]*:(?:[ \t]+(.*))?$/;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line) || /^(---|\.\.\.)\s*$/.test(line)) { i++; continue; }

    const m = line.match(KEY_RE);        // seules les clés à la racine (sans indentation)
    if (!m) { i++; continue; }

    const key   = m[1];
    const first = m[2] === undefined ? '' : m[2];
    i++;

    // lignes de continuation : indentées, vides, ou éléments de liste à la racine
    const cont = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === '' || /^\s/.test(l) || /^-(\s|$)/.test(l)) { cont.push(l); i++; continue; }
      break;
    }
    while (cont.length && cont[cont.length - 1].trim() === '') cont.pop();

    obj[key] = parseValue(first, cont);
  }
  return obj;
}

// ── FS HELPERS ────────────────────────────────────────────────────────────────
function readYAMLFile(file) {
  if (!fs.existsSync(file)) return {};
  return parseYAML(fs.readFileSync(file, 'utf8'));
}

// Ne lit que les .yml / .yaml (.gitkeep et autres fichiers sont ignorés).
function readYAMLDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(yml|yaml)$/i.test(f))
    .sort()
    .map(f => {
      try {
        return parseYAML(fs.readFileSync(path.join(dir, f), 'utf8'));
      } catch (e) {
        warn(`${dir}/${f} illisible (${e.message}) — fichier ignoré`);
        return null;
      }
    })
    .filter(Boolean);
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function toYAML(obj) {
  return Object.entries(obj).map(([k, v]) => {
    if (v === null || v === undefined) return `${k}: `;
    if (typeof v === 'boolean')        return `${k}: ${v}`;
    if (typeof v === 'number')         return `${k}: ${v}`;
    if (typeof v === 'string' && v.includes('\n'))
      return `${k}: |\n  ${v.replace(/\n/g, '\n  ')}`;
    if (typeof v === 'string' && /[:#"']/.test(v))
      return `${k}: "${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    return `${k}: ${v}`;
  }).join('\n') + '\n';
}

// ── LOGGER ───────────────────────────────────────────────────────────────────
function log(msg)  { process.stdout.write(msg + '\n'); }
function warn(msg) { process.stdout.write('  ⚠ ' + msg + '\n'); }

// ── RÉGLAGES PAR DÉFAUT ───────────────────────────────────────────────────────
// Utilisés uniquement pour créer content/settings/site.yml si absent (et comme
// valeurs de secours). NE JAMAIS s'en servir pour les événements, saveurs, galerie.
const DEFAULT_SETTINGS = {
  email:              'info@ziakurtos.com',
  instagram_url:      'https://www.instagram.com/ziakurtos/',
  facebook_url:       'https://www.facebook.com/zia.kurtos/',
  tiktok_url:         '',
  active_theme:       'summer',
  main_cta_label:     'Découvrir nos kürtös artisanaux',
  contact_cta_label:  'Inviter Zia Kürtös',
  announcement_text:  '',
  footer_credit_text: 'la-malice.ch',
  footer_credit_url:  'https://la-malice.ch/'
};

// Email AFFICHÉ sur le site uniquement.
// L'email qui reçoit les notifications Netlify Forms se règle dans Netlify.
const DEFAULT_CONTACT_SETTINGS = {
  contact_display_email: 'info@ziakurtos.com',
  instagram_url:          'https://www.instagram.com/ziakurtos/',
  facebook_url:           'https://www.facebook.com/zia.kurtos/',
  success_message:        'Merci beaucoup pour votre message. Nous avons bien reçu votre demande et nous réjouissons de vous répondre très bientôt.'
};

// Valeurs comprises par main.js (sert uniquement à émettre des avertissements)
const KNOWN = {
  flavorCategories: ['sucre', 'tartinage', 'signature', 'sale'],
  flavorBadges:     ['classique', 'gourmand', 'reconfortant', 'signature', 'sale'],
  seasons:          ['printemps', 'ete', 'automne', 'hiver', 'annuel'],
  themes:           ['summer', 'winter']
};

const norm = s => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Decap peut écrire une date avec heure : main.js attend YYYY-MM-DD.
function normalizeDate(v) {
  return (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) ? v.slice(0, 10) : v;
}

// ── INIT RÉGLAGES ─────────────────────────────────────────────────────────────
function initSettings() {
  ensureDir('content/settings');
  if (!fs.existsSync('content/settings/site.yml')) {
    fs.writeFileSync('content/settings/site.yml', toYAML(DEFAULT_SETTINGS));
    log('  [init] content/settings/site.yml créé avec les réglages par défaut');
  }
}

function initContactSettings() {
  ensureDir('content/settings');
  if (!fs.existsSync('content/settings/contact.yml')) {
    fs.writeFileSync('content/settings/contact.yml', toYAML(DEFAULT_CONTACT_SETTINGS));
    log('  [init] content/settings/contact.yml créé avec les réglages contact par défaut');
  }
}

// ── BUILD DATA — sans fallback ────────────────────────────────────────────────
function buildEvents() {
  return readYAMLDir('content/evenements')
    .map(e => ({ ...e, start_date: normalizeDate(e.start_date), end_date: normalizeDate(e.end_date) }))
    .filter(e => e.visible !== false)
    .sort((a, b) => {
      const oa = a.order ?? 999, ob = b.order ?? 999;
      if (oa !== ob) return oa - ob;
      return String(a.start_date || '').localeCompare(String(b.start_date || ''));
    });
}

function buildFlavors() {
  return readYAMLDir('content/saveurs')
    .filter(f => f.visible !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

function buildGallery() {
  return readYAMLDir('content/galerie')
    .map(g => ({ ...g, date: normalizeDate(g.date) }))
    .filter(g => g.visible !== false)
    .sort((a, b) => {
      const oa = a.order ?? 999, ob = b.order ?? 999;
      if (oa !== ob) return oa - ob;
      return String(b.date || '').localeCompare(String(a.date || ''));
    });
}

function buildSettings() {
  const raw = readYAMLFile('content/settings/site.yml');
  return {
    ...DEFAULT_SETTINGS,
    ...Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null && v !== undefined))
  };
}

// Priorité : contact.yml ; si une valeur y est vide, repli sur site.yml, puis sur les défauts.
function buildContactSettings(settings) {
  const raw = readYAMLFile('content/settings/contact.yml');
  const fallback = {
    ...DEFAULT_CONTACT_SETTINGS,
    contact_display_email: settings.email         || DEFAULT_CONTACT_SETTINGS.contact_display_email,
    instagram_url:         settings.instagram_url || DEFAULT_CONTACT_SETTINGS.instagram_url,
    facebook_url:          settings.facebook_url  || DEFAULT_CONTACT_SETTINGS.facebook_url
  };
  return {
    ...fallback,
    ...Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null && v !== undefined && v !== ''))
  };
}

// ── VÉRIFICATIONS (avertissements uniquement, ne bloquent jamais le build) ───
function checkContent(events, flavors, gallery, settings) {
  const seen = new Set();
  flavors.forEach(f => {
    if (!f.title) warn('Une saveur n\'a pas de titre');
    const t = norm(f.title);
    if (seen.has(t)) warn(`Saveur en double : "${f.title}"`);
    seen.add(t);
    if (!KNOWN.flavorCategories.includes(f.category))
      warn(`Saveur "${f.title}" : catégorie "${f.category}" non reconnue par main.js`);
    if (f.badge && !KNOWN.flavorBadges.includes(f.badge))
      warn(`Saveur "${f.title}" : badge "${f.badge}" non reconnu par main.js`);
  });
  events.forEach(e => {
    if (!e.title) warn('Un événement n\'a pas de titre');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.start_date || ''))
      warn(`Événement "${e.title}" : start_date invalide (${e.start_date})`);
    if (e.end_date && e.start_date && e.end_date < e.start_date)
      warn(`Événement "${e.title}" : end_date antérieure à start_date`);
    if (e.season && !KNOWN.seasons.includes(e.season))
      warn(`Événement "${e.title}" : saison "${e.season}" non reconnue par main.js`);
  });
  gallery.forEach(g => { if (!g.image) warn(`Photo "${g.title}" : aucune image`); });
  if (!KNOWN.themes.includes(settings.active_theme))
    warn(`active_theme "${settings.active_theme}" inconnu — "summer" sera utilisé`);
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
function build() {
  log('\n  ━━ Zia Kürtös — Build CMS Data ━━\n');

  [
    'assets/js',
    'assets/images/uploads',
    'admin',
    'content/evenements',
    'content/saveurs',
    'content/galerie',
    'content/settings'
  ].forEach(ensureDir);

  initSettings();
  initContactSettings();

  const events          = buildEvents();
  const flavors         = buildFlavors();
  const gallery         = buildGallery();
  const settings        = buildSettings();
  const contactSettings = buildContactSettings(settings);

  const instaFeed = gallery.filter(g => g.featured).slice(0, 6);

  const output = `/* ─────────────────────────────────────────────────
   Zia Kürtös — zia-data.js
   Généré par build.js — Ne pas modifier manuellement
   Build : ${new Date().toISOString()}
   Événements : ${events.length} | Saveurs : ${flavors.length} | Photos : ${gallery.length}
───────────────────────────────────────────────── */

/* global ZIA_EVENTS, ZIA_FLAVORS, ZIA_GALLERY, ZIA_SETTINGS, ZIA_CONTACT_SETTINGS, ZIA_INSTA */

window.ZIA_EVENTS   = ${JSON.stringify(events,   null, 2)};

window.ZIA_FLAVORS  = ${JSON.stringify(flavors,  null, 2)};

window.ZIA_GALLERY  = ${JSON.stringify(gallery,  null, 2)};

window.ZIA_SETTINGS = ${JSON.stringify(settings, null, 2)};

window.ZIA_CONTACT_SETTINGS = ${JSON.stringify(contactSettings, null, 2)};

window.ZIA_INSTA    = ${JSON.stringify(instaFeed,null, 2)};
`;

  fs.writeFileSync('assets/js/zia-data.js', output, 'utf8');

  log(`  ✓ assets/js/zia-data.js généré`);

  if (events.length)  log(`  ✓ ${events.length} événement(s) chargé(s)`);
  else                log(`  ⚠ Aucun événement — ZIA_EVENTS = []`);

  if (flavors.length) log(`  ✓ ${flavors.filter(f => !f.upcoming).length} saveur(s) active(s) + ${flavors.filter(f => f.upcoming).length} à venir (${flavors.length} au total)`);
  else                log(`  ⚠ Aucune saveur — ZIA_FLAVORS = []`);

  if (gallery.length) log(`  ✓ ${gallery.length} photo(s) chargée(s)`);
  else                log(`  ⚠ Aucune photo — ZIA_GALLERY = []`);

  log(`  ✓ Réglages généraux chargés (thème actif : ${settings.active_theme} — palette définie dans styles.css)`);
  log(`  ✓ Réglages contact chargés (email affiché : ${contactSettings.contact_display_email})`);

  if (settings.tiktok_url)        log(`  ✓ TikTok : ${settings.tiktok_url}`);
  if (settings.announcement_text) log(`  ✓ Annonce : "${settings.announcement_text}"`);

  checkContent(events, flavors, gallery, settings);

  log('');
}

if (require.main === module) {
  build();
} else {
  module.exports = { parseYAML, parseValue, build, readYAMLDir, readYAMLFile };
}
