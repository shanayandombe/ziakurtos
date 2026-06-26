#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  Zia Kürtös — build.js
//  Netlify Build Command : node build.js
//  Publish Directory     : .
//  Output                : assets/js/zia-data.js
//
//  Zero external dependencies — Node.js built-ins only. Compatible Node 14+
//
//  COMPORTEMENT :
//  - Si content/evenements/ est vide → window.ZIA_EVENTS = []
//  - Si content/saveurs/ est vide    → window.ZIA_FLAVORS = []
//  - Si content/galerie/ est vide    → window.ZIA_GALLERY = []
//  - content/settings/site.yml est créé automatiquement s'il est absent.
//  - content/settings/contact.yml est créé automatiquement s'il est absent.
//  - Aucun seeding automatique des événements, saveurs ou galerie.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const fs   = require('fs');
const path = require('path');

// ── MINI YAML PARSER ─────────────────────────────────────────────────────────
function parseYAML(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const obj   = {};
  let i       = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith('#')) { i++; continue; }

    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)\s*:\s*(.*)/);
    if (!m) { i++; continue; }

    const key = m[1];
    let   val = m[2].replace(/\s+#[^'"]*$/, '').trim();

    if (val === '|' || val === '>') {
      i++;
      const baseIndent = (lines[i] || '').match(/^(\s*)/)[1].length;
      const block = [];
      while (i < lines.length) {
        const l = lines[i];
        if (l.trim() === '') { block.push(''); i++; continue; }
        const indent = l.match(/^(\s*)/)[1].length;
        if (indent < baseIndent) break;
        block.push(l.slice(baseIndent));
        i++;
      }
      obj[key] = block.join('\n').trimEnd();
      continue;
    }

    if (/^"(.*)"$/.test(val))        { obj[key] = val.slice(1,-1).replace(/\\"/g,'"'); }
    else if (/^'(.*)'$/.test(val))   { obj[key] = val.slice(1,-1); }
    else if (val === 'true')          { obj[key] = true; }
    else if (val === 'false')         { obj[key] = false; }
    else if (val === 'null' || val === '~' || val === '') { obj[key] = null; }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) { obj[key] = val; }
    else if (val !== '' && !isNaN(val)) { obj[key] = Number(val); }
    else { obj[key] = val; }

    i++;
  }
  return obj;
}

// ── FS HELPERS ────────────────────────────────────────────────────────────────
function readYAMLDir(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => /\.(yml|yaml)$/.test(f))
    .map(f => parseYAML(fs.readFileSync(path.join(dir, f), 'utf8')));
}

function readYAMLFile(file) {
  if (!fs.existsSync(file)) return {};
  return parseYAML(fs.readFileSync(file, 'utf8'));
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
      return `${k}: "${v.replace(/"/g, '\\"')}"`;
    return `${k}: ${v}`;
  }).join('\n') + '\n';
}

// ── RÉGLAGES PAR DÉFAUT ───────────────────────────────────────────────────────
// Utilisés uniquement pour créer content/settings/site.yml si absent.
// NE JAMAIS injecter comme fallback pour les événements, saveurs ou galerie.
const DEFAULT_SETTINGS = {
  email:              'info@ziakurtos.com',
  instagram_url:      'https://www.instagram.com/ziakurtos/',
  facebook_url:       'https://www.facebook.com/zia.kurtos/',
  tiktok_url:         '',
  active_theme:       'summer',
  main_cta_label:     'Découvrir nos kürtös artisanaux',
  contact_cta_label:  'Inviter Zia Kürtös',
  announcement_text:  '',
  footer_credit_text: 'Site créé par Web On It !',
  footer_credit_url:  'https://www.instagram.com/web.onit/'
};

// ── RÉGLAGES CONTACT PAR DÉFAUT ──────────────────────────────────────────────
// Email affiché sur le site uniquement.
// L'email qui reçoit les notifications Netlify Forms se règle dans Netlify.
const DEFAULT_CONTACT_SETTINGS = {
  contact_display_email: 'ndombe.shanaya@gmail.com',
  instagram_url:          'https://www.instagram.com/ziakurtos/',
  facebook_url:           'https://www.facebook.com/zia.kurtos/',
  success_message:        'Merci pour votre demande. Nous vous répondons dans les plus brefs délais.'
};

// ── THÈMES ────────────────────────────────────────────────────────────────────
const THEMES = {
  summer: {
    '--creme':  '#FEFEE2', '--beige':  '#F5F0C4', '--dore':   '#D89B28',
    '--caramel':'#B66A2C', '--brun':   '#4A2B1A', '--sapin':  '#2D5A3D',
    '--rouge':  '#A6422A', '--rouge2': '#7F2F20', '--blanc':  '#FFFFFB',
    '--texte':  '#2C1810', '--gris':   '#6B4435'
  },
  winter: {
    '--creme':  '#FFF6E8', '--beige':  '#EAD7B7', '--dore':   '#D89B28',
    '--caramel':'#B66A2C', '--brun':   '#4A2B1A', '--sapin':  '#173F35',
    '--rouge':  '#A6422A', '--rouge2': '#7F2F20', '--blanc':  '#FFFBF3',
    '--texte':  '#2C1810', '--gris':   '#6B4435'
  }
};

// ── INIT RÉGLAGES ─────────────────────────────────────────────────────────────
// Crée content/settings/site.yml avec les valeurs par défaut si absent.
// Ne touche PAS aux dossiers evenements/, saveurs/, galerie/.
function initSettings() {
  ensureDir('content/settings');
  if (!fs.existsSync('content/settings/site.yml')) {
    fs.writeFileSync('content/settings/site.yml', toYAML(DEFAULT_SETTINGS));
    log('  [init] content/settings/site.yml créé avec les réglages par défaut');
  }
}

// Crée content/settings/contact.yml avec les valeurs par défaut si absent.
function initContactSettings() {
  ensureDir('content/settings');
  if (!fs.existsSync('content/settings/contact.yml')) {
    fs.writeFileSync('content/settings/contact.yml', toYAML(DEFAULT_CONTACT_SETTINGS));
    log('  [init] content/settings/contact.yml créé avec les réglages contact par défaut');
  }
}

// ── BUILD DATA — sans fallback ────────────────────────────────────────────────
// Si le dossier est vide, retourne [] — main.js affiche l'état vide approprié.

function buildEvents() {
  const raw = readYAMLDir('content/evenements');
  if (!raw.length) return [];
  return raw
    .filter(e => e.visible !== false)
    .sort((a, b) => {
      const oa = a.order ?? 999, ob = b.order ?? 999;
      if (oa !== ob) return oa - ob;
      return String(a.start_date || '').localeCompare(String(b.start_date || ''));
    });
}

function buildFlavors() {
  const raw = readYAMLDir('content/saveurs');
  if (!raw.length) return [];
  return raw
    .filter(f => f.visible !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

function buildGallery() {
  const raw = readYAMLDir('content/galerie');
  if (!raw.length) return [];
  return raw
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
    ...Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== null && v !== undefined)
    )
  };
}

function buildContactSettings() {
  const raw = readYAMLFile('content/settings/contact.yml');
  return {
    ...DEFAULT_CONTACT_SETTINGS,
    ...Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== null && v !== undefined && v !== '')
    )
  };
}

// ── LOGGER ───────────────────────────────────────────────────────────────────
function log(msg) { process.stdout.write(msg + '\n'); }

// ── MAIN ─────────────────────────────────────────────────────────────────────
function build() {
  log('\n  ━━ Zia Kürtös — Build CMS Data ━━\n');

  // 1. Créer les dossiers nécessaires s'ils n'existent pas
  [
    'assets/js',
    'assets/images/uploads',
    'admin',
    'content/evenements',
    'content/saveurs',
    'content/galerie',
    'content/settings'
  ].forEach(ensureDir);

  // 2. Initialiser les réglages si absents
  initSettings();
  initContactSettings();

  // 3. Lire les contenus CMS — retourne [] si vide, sans fallback
  const events          = buildEvents();
  const flavors         = buildFlavors();
  const gallery         = buildGallery();
  const settings        = buildSettings();
  const contactSettings = buildContactSettings();
  const theme           = THEMES[settings.active_theme] || THEMES.summer;

  // 4. Sélection Instagram : photos mises en avant (jusqu'à 6)
  const instaFeed = gallery.filter(g => g.featured).slice(0, 6);

  // 5. Générer assets/js/zia-data.js
  const output = `/* ─────────────────────────────────────────────────
   Zia Kürtös — zia-data.js
   Généré par build.js — Ne pas modifier manuellement
   Build : ${new Date().toISOString()}
   Événements : ${events.length} | Saveurs : ${flavors.length} | Photos : ${gallery.length}
───────────────────────────────────────────────── */

/* global ZIA_EVENTS, ZIA_FLAVORS, ZIA_GALLERY, ZIA_SETTINGS, ZIA_CONTACT_SETTINGS, ZIA_THEME, ZIA_INSTA */

window.ZIA_EVENTS   = ${JSON.stringify(events,   null, 2)};

window.ZIA_FLAVORS  = ${JSON.stringify(flavors,  null, 2)};

window.ZIA_GALLERY  = ${JSON.stringify(gallery,  null, 2)};

window.ZIA_SETTINGS = ${JSON.stringify(settings, null, 2)};

window.ZIA_CONTACT_SETTINGS = ${JSON.stringify(contactSettings, null, 2)};

window.ZIA_THEME    = ${JSON.stringify(theme,    null, 2)};

window.ZIA_INSTA    = ${JSON.stringify(instaFeed,null, 2)};

/* ── Applique les variables de thème sur :root ── */
(function () {
  const r = document.documentElement;
  Object.entries(window.ZIA_THEME).forEach(([k, v]) => r.style.setProperty(k, v));
})();
`;

  fs.writeFileSync('assets/js/zia-data.js', output, 'utf8');

  // 6. Rapport de build
  log(`  ✓ assets/js/zia-data.js généré`);

  if (events.length)  log(`  ✓ ${events.length} événement(s) chargé(s)`);
  else                log(`  ⚠ Aucun événement — ZIA_EVENTS = []`);

  if (flavors.length) log(`  ✓ ${flavors.filter(f => !f.upcoming).length} saveur(s) active(s) + ${flavors.filter(f => f.upcoming).length} à venir`);
  else                log(`  ⚠ Aucune saveur — ZIA_FLAVORS = []`);

  if (gallery.length) log(`  ✓ ${gallery.length} photo(s) chargée(s)`);
  else                log(`  ⚠ Aucune photo — ZIA_GALLERY = []`);

  log(`  ✓ Thème actif : ${settings.active_theme}`);

  if (settings.tiktok_url)                log(`  ✓ TikTok : ${settings.tiktok_url}`);
  if (settings.announcement_text)         log(`  ✓ Annonce : "${settings.announcement_text}"`);
  if (contactSettings.contact_display_email) log(`  ✓ Email contact affiché : ${contactSettings.contact_display_email}`);

  log('');
}

build();

// ─────────────────────────────────────────────────────────────────────────────
// MODÈLES DE RÉFÉRENCE (commentés — ne sont PAS injectés automatiquement)
// Ces tableaux peuvent servir de référence pour créer du contenu dans le CMS.
// Pour les réactiver comme seed initial : décommenter seedContent() dans build()
// ─────────────────────────────────────────────────────────────────────────────

/*
const DEFAULT_EVENTS = [
  {
    title:"Miam Festival — Lausanne à Table",
    start_date:"2026-05-23", end_date:"2026-05-25",
    city:"Lausanne", place:"Lausanne à Table", category:"festival",
    description:"Le rendez-vous des meilleures tables et stands street food de Suisse romande.",
    image:"assets/images/zia-kurtos-miam-festival.webp",
    visible:true, featured:true, order:1, season:"printemps"
  },
  {
    title:"Montreux Jazz Festival",
    start_date:"2026-07-03", end_date:"2026-07-19",
    city:"Montreux", place:"Bords du lac Léman", category:"festival",
    description:"L'un des festivals de musique les plus renommés d'Europe.",
    image:"assets/images/zia-kurtos-montreux-jazz.webp",
    visible:true, featured:true, order:2, season:"été"
  },
  {
    title:"Montreux Riviera Noël",
    start_date:"2026-11-20", end_date:"2026-12-24",
    city:"Montreux", place:"Quais de Montreux", category:"marché de Noël",
    description:"Le plus grand marché de Noël de Suisse, illuminé face au lac Léman.",
    image:"assets/images/zia-kurtos-montreux-noel.webp",
    visible:true, featured:true, order:3, season:"hiver"
  }
];

const DEFAULT_FLAVORS = [
  { title:"Sucre",           category:"sucré",     description:"La pureté du caramel.",                    badge:"classique", permanent:true, upcoming:false, visible:true, order:1 },
  { title:"Sucre & cannelle",category:"sucré",     description:"Chaud, épicé, réconfortant.",               badge:"classique", permanent:true, upcoming:false, visible:true, order:2 },
  { title:"Amandes grillées",category:"sucré",     description:"Caramélisé, croquant, irrésistible.",       badge:"signature", permanent:true, upcoming:false, visible:true, order:3 },
  { title:"Nutella",         category:"tartinage", description:"Fondant, intense, irrésistible.",           badge:"signature", permanent:true, upcoming:false, visible:true, order:4 },
  { title:"Spéculoos",       category:"tartinage", description:"La pâte de spéculoos dans le kürtős chaud.", badge:"gourmand", permanent:true, upcoming:false, visible:true, order:5 },
  { title:"Gruyère",         category:"salé",      description:"La Hongrie rencontre la Suisse, à la broche.", badge:"salé", permanent:true, upcoming:false, visible:true, order:6 }
];

const DEFAULT_GALLERY = [
  { title:"Stand festival gourmand", image:"assets/images/zia-kurtos-stand.webp",         alt:"Stand Zia Kürtös festival Suisse",         caption:"Le stand en action", category:"stand",      visible:true, featured:true, order:1 },
  { title:"Cuisson à la broche",     image:"assets/images/kurtos-cuisson-broche.webp",    alt:"Kürtős artisanal cuit à la broche",        caption:"La broche tourne",  category:"cuisson",    visible:true, featured:true, order:2 },
  { title:"Montreux Jazz Festival",  image:"assets/images/zia-kurtos-montreux-jazz.webp", alt:"Zia Kürtös Montreux Jazz Festival",        caption:"Montreux Jazz",     category:"événements", visible:true, featured:true, order:3 },
  { title:"Montreux Noël",           image:"assets/images/zia-kurtos-montreux-noel.webp", alt:"Stand Zia Kürtös marché de Noël Montreux", caption:"Montreux Noël",     category:"hiver",      visible:true, featured:true, order:4 }
];

// Pour réactiver le seeding initial (première mise en ligne uniquement) :
// function slugify(str) {
//   return String(str).toLowerCase()
//     .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
//     .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// }
// function seedContent() {
//   const seedDir = (dir, items) => {
//     if (fs.readdirSync(dir).length > 0) return;
//     items.forEach(item => {
//       fs.writeFileSync(path.join(dir, `${slugify(item.title)}.yml`), toYAML(item));
//     });
//     log(`  [seed] ${dir} (${items.length} fichiers)`);
//   };
//   seedDir('content/evenements', DEFAULT_EVENTS);
//   seedDir('content/saveurs',    DEFAULT_FLAVORS);
//   seedDir('content/galerie',    DEFAULT_GALLERY);
// }
*/
