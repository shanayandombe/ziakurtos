/* ─────────────────────────────────────────────────────────────────────────────
   Zia Kürtös — assets/js/main.js — Version finale consolidée
   Changements vs version précédente :
   ① Normalisation accents : les filtres (saveurs / saisons / galerie) et les
      libellés de saison fonctionnent désormais quels que soient les accents
      utilisés côté HTML (data-*) ou côté CMS (content/*.yml).
   ② applyTheme() n'injecte plus de variables CSS en JS : les palettes summer /
      winter vivent uniquement dans styles.css via [data-theme]. main.js se
      contente de poser l'attribut data-theme.
   ③ applySettings() utilise ZIA_CONTACT_SETTINGS en priorité pour l'email et
      les réseaux sociaux affichés, avec repli sur ZIA_SETTINGS si absent.
   ④ initContactForm() applique réellement le success_message du CMS.
   ⑤ Migration dans main.js de setStep() (Nos Kürtös) et toggleFaq() +
      navigation catégories (FAQ), exposées globalement (window.setStep /
      window.toggleFaq) pour rester compatibles avec les attributs onclick
      déjà présents dans le HTML.
───────────────────────────────────────────────────────────────────────────── */
'use strict';

/* ══ UTILS ══════════════════════════════════════════════════════════════════ */
function $(id) { return document.getElementById(id); }

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/** Supprime les accents/diacritiques et met en minuscules.
 *  Permet de comparer en toute sécurité des valeurs qui peuvent arriver
 *  accentuées côté HTML (data-filter-season="été") ou non accentuées côté
 *  CMS (season: ete), sans avoir à synchroniser les deux à la main. */
function normalize(str) {
  return String(str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim();
}

/* ══ IMAGES STATIQUES OPTIONNELLES (hors CMS) ═══════════════════════════════
   Certaines images du site (stand, équipe, étapes du processus…) ne sont pas
   encore fournies par la cliente. Plutôt que de bricoler un onerror différent
   à chaque endroit, un seul mécanisme générique gère les deux sens :
     - l'image charge  → le composant s'affiche normalement ;
     - l'image échoue  → le conteneur porteur de [data-img-box] se masque
       proprement (jamais de chemin de fichier affiché, jamais de cadre vide) ;
       le CSS associé (voir styles.css) réorganise la mise en page si besoin.
   Chaque <img> concernée appelle imgFallback(this) sur onload ET onerror :
   si le fichier est déposé plus tard au même chemin, l'image et sa mise en
   page reviennent automatiquement, sans toucher au HTML. ════════════════════ */
window.imgFallback = function imgFallback(img) {
  const box = img.closest('[data-img-box], [data-logo-box]');
  if (!box) return;
  const ok = img.complete && img.naturalWidth > 0;
  box.classList.toggle('is-missing', !ok);
};

function formatDateRange(s, e) {
  if (!s) return '';
  const months = ['jan.','fév.','mars','avr.','mai','juin','juil.','août','sep.','oct.','nov.','déc.'];
  const fmt = d => {
    const [,m,j] = String(d).split('-');
    return j.replace(/^0/,'') + '\u202f' + months[+m - 1];
  };
  if (!e || s === e) return fmt(s);
  return fmt(s) + ' – ' + fmt(e);
}

/* ── Saisons événements : libellés + classes, tolérants aux accents ── */
const SEASON_LABELS = { printemps:'Printemps', ete:'Été', automne:'Automne', hiver:'Hiver', annuel:'Annuel' };
const SEASON_BADGE_CLS = { printemps:'badge-printemps', ete:'badge-ete', automne:'badge-automne', hiver:'badge-hiver', annuel:'badge-annuel' };

function seasonLabel(s) {
  const n = normalize(s);
  return SEASON_LABELS[n] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
}
function seasonBadgeCls(s) {
  return SEASON_BADGE_CLS[normalize(s)] || 'badge-annuel';
}

/* ── Saveurs : catégories internes → libellé public, tolérant aux accents ──
   sucre / tartinage / signature / ete → "Sucré" (ou "Été" pour l'affichage)
   sale                                → "Salé"
   Côté filtres publics il n'existe que deux boutons : Sucré / Salé. */
const FLAVOR_LABELS      = { sucre:'Sucré', tartinage:'Sucré', signature:'Sucré', sale:'Salé', ete:'Été' };
const FLAVOR_SUCRE_GROUP = ['sucre','tartinage','signature','ete'];
const FLAVOR_SALE_GROUP  = ['sale'];

function flavorPublicLabel(cat) { return FLAVOR_LABELS[normalize(cat)] || ''; }
function flavorTagCls(cat)      { return normalize(cat) === 'sale' ? 'tag-sale' : 'tag-sucre'; }

const AR = ['tall','sq','xtall','wide','tall','sq','wide','tall','sq','xtall'];

/* ══ EMPTY STATES ════════════════════════════════════════════════════════════ */

const _emptyEvents = () => `
<div class="empty-state">
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true"
    style="margin:0 auto 1.5rem;display:block;opacity:.35">
    <circle cx="28" cy="28" r="20" stroke="#B66A2C" stroke-width="1.5" fill="none"/>
    <rect x="20" y="16" width="16" height="2" rx="1" fill="#D89B28"/>
    <rect x="20" y="26" width="16" height="2" rx="1" fill="#B66A2C" opacity=".5"/>
    <rect x="20" y="36" width="10" height="2" rx="1" fill="#B66A2C" opacity=".3"/>
  </svg>
  <h3 style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;margin-bottom:.8rem">Les prochains rendez-vous arrivent bientôt</h3>
  <p>Zia Kürtös prépare doucement sa prochaine tournée gourmande. Revenez bientôt ou suivez-nous sur Instagram pour découvrir les prochains festivals, marchés et événements où nous retrouver.</p>
  <a href="https://www.instagram.com/ziakurtos/" target="_blank" rel="noopener noreferrer"
    class="btn btn-primary" style="margin-top:1.5rem;display:inline-block">Suivre @ziakurtos</a>
</div>`;

const _emptyFlavors = () => `
<div class="empty-state" style="grid-column:1/-1">
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true"
    style="margin:0 auto 1.5rem;display:block;opacity:.35">
    <rect x="16" y="8" width="24" height="40" rx="12" stroke="#D89B28" stroke-width="1.5" fill="none"/>
  </svg>
  <h3 style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;margin-bottom:.8rem;color:var(--blanc,#FFFBF3)">Les saveurs arrivent bientôt</h3>
  <p style="color:rgba(255,255,255,.55)">Notre carte de kürtös est en préparation. Sucrées, gourmandes, croustillantes ou réconfortantes… les prochaines saveurs seront bientôt ajoutées ici.</p>
  <a href="evenements.html" class="btn btn-ghost"
    style="margin-top:1.5rem;display:inline-block">Découvrir nos événements</a>
</div>`;

const _emptyGallery = () => `
<div class="empty-state">
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true"
    style="margin:0 auto 1.5rem;display:block;opacity:.3">
    <rect x="6" y="14" width="44" height="30" rx="3" stroke="#D89B28" stroke-width="1.5" fill="none"/>
    <circle cx="20" cy="26" r="5" stroke="#B66A2C" stroke-width="1.2" fill="none"/>
    <path d="M6 36 L18 26 L28 34 L36 28 L50 38" stroke="#D89B28" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  </svg>
  <h3 style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;margin-bottom:.8rem;color:var(--blanc,#FFFBF3)">Les images arrivent bientôt</h3>
  <p style="color:rgba(255,255,255,.5)">Les coulisses, les kürtös dorés à la broche et les moments de festival seront bientôt partagés ici. En attendant, retrouvez Zia Kürtös sur Instagram.</p>
  <a href="https://www.instagram.com/ziakurtos/" target="_blank" rel="noopener noreferrer"
    class="btn btn-ghost" style="margin-top:1.5rem;display:inline-block">Suivre @ziakurtos</a>
</div>`;

/* ══ CONTACT INFO — fusion ZIA_CONTACT_SETTINGS (priorité) + ZIA_SETTINGS (repli) ══ */

function getContactInfo() {
  const S  = window.ZIA_SETTINGS || {};
  const CS = window.ZIA_CONTACT_SETTINGS || {};
  return {
    email:           CS.contact_display_email || S.email || '',
    instagram_url:   CS.instagram_url || S.instagram_url || '',
    facebook_url:    CS.facebook_url  || S.facebook_url  || '',
    success_message: CS.success_message || ''
  };
}

/* ══ SETTINGS ════════════════════════════════════════════════════════════════ */

function applySettings() {
  const S  = window.ZIA_SETTINGS || {};
  const CI = getContactInfo();

  if (CI.email) {
    document.querySelectorAll('[data-email]').forEach(el => {
      el.href = 'mailto:' + CI.email;
      if (!el.querySelector('*')) el.textContent = CI.email;
    });
  }
  if (S.tiktok_url) {
    document.querySelectorAll('[data-tiktok]').forEach(el => {
      el.href = S.tiktok_url;
      el.style.display = 'flex';
    });
  }
  if (CI.instagram_url) document.querySelectorAll('[data-instagram]').forEach(el => { el.href = CI.instagram_url; });
  if (CI.facebook_url)  document.querySelectorAll('[data-facebook]').forEach(el => { el.href = CI.facebook_url; });

  if (S.main_cta_label)    document.querySelectorAll('[data-cta-main]').forEach(el => { el.textContent = S.main_cta_label; });
  if (S.contact_cta_label) document.querySelectorAll('[data-cta-contact]').forEach(el => { el.textContent = S.contact_cta_label; });

  const ann = $('announcement');
  if (ann && S.announcement_text) {
    ann.textContent = S.announcement_text;
    ann.classList.add('visible');
  }

  const fc = $('footerCredit');
  if (fc) {
    const url  = S.footer_credit_url  || 'https://la-malice.ch/';
    const text = S.footer_credit_text || 'la-malice.ch';
    fc.innerHTML = `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
  }
}

/* ══ THEME ═══════════════════════════════════════════════════════════════════
   Les palettes summer / winter vivent uniquement dans styles.css, via
   :root et [data-theme="summer"] / [data-theme="winter"].
   main.js se contente de poser l'attribut — aucune couleur n'est dupliquée
   ni injectée en JS ici. ══════════════════════════════════════════════════ */

function applyTheme() {
  const S = window.ZIA_SETTINGS || {};
  const theme = (S.active_theme === 'winter') ? 'winter' : 'summer';
  document.documentElement.setAttribute('data-theme', theme);
}

/* ══ EVENTS — HELPERS ════════════════════════════════════════════════════════ */

function getVisibleEvents() {
  return (window.ZIA_EVENTS || [])
    .filter(ev => ev.visible !== false)
    .sort((a, b) => {
      const oa = a.order ?? 999, ob = b.order ?? 999;
      if (oa !== ob) return oa - ob;
      return String(a.start_date || '').localeCompare(String(b.start_date || ''));
    });
}

/** Date du jour au format YYYY-MM-DD, en heure LOCALE (et non UTC). */
function todayStr() {
  const n = new Date(), p = x => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

/** Index du prochain événement : parmi les événements non terminés (end_date, ou
 *  start_date à défaut, >= aujourd'hui), celui dont la date de début est la plus proche.
 *  Le calcul ne dépend PAS du champ "order" du CMS. Retourne -1 s'il n'y en a plus. */
function getNextEventIndex(events) {
  const today = todayStr();
  let best = -1;
  events.forEach((ev, i) => {
    const start = ev.start_date || '';
    const end   = ev.end_date || start;
    if (!start && !end) return;
    if ((end || start) < today) return;
    if (best === -1) { best = i; return; }
    const b  = events[best];
    const bs = b.start_date || '';
    const be = b.end_date || bs;
    if (start < bs || (start === bs && end < be)) best = i;
  });
  return best;
}

function _imgOrPlaceholder(img, title) {
  if (img) return `<img src="${esc(img)}" alt="${esc(title)} — Zia Kürtös" loading="lazy" width="260" height="200" onerror="this.style.display='none'">`;
  return `<div class="img-placeholder" aria-hidden="true">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity=".25"><rect x="4" y="12" width="32" height="22" rx="2" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M4 12 L20 4 L36 12" stroke="currentColor" stroke-width="1" fill="none"/></svg>
  </div>`;
}

/* ══ EVENTS — TIMELINE ═══════════════════════════════════════════════════════
   Affiche une bande de points chronologiques au-dessus de la liste.
   Le prochain événement à venir est mis en avant (point doré).
   Calcul 100% automatique à partir de start_date / end_date + date du jour —
   aucune case "prochain événement" côté CMS.
═══════════════════════════════════════════════════════════════════════════════ */

function renderEventsTimeline(events) {
  const strip = $('eventsTimeline');
  if (!strip || !events.length) return;

  const today   = todayStr();
  const nextIdx = getNextEventIndex(events);

  const dots = events.map((ev, i) => {
    const endOrStart = ev.end_date || ev.start_date || '';
    const isPast      = endOrStart < today && endOrStart !== '';
    const isNext       = i === nextIdx;
    const cls          = isPast ? 'tl-past' : isNext ? 'tl-next' : 'tl-future';
    const d             = formatDateRange(ev.start_date, ev.end_date);
    return `<div class="tl-dot-wrap ${cls}" aria-label="${esc(ev.title)}${isNext ? ' — Prochain événement' : ''}">
      <div class="tl-dot"></div>
      ${isNext ? `<span class="tl-next-badge">Prochain</span>` : ''}
      <span class="tl-dot-label">${esc(ev.city || ev.title)}</span>
      ${d ? `<span class="tl-dot-date">${d}</span>` : ''}
    </div>`;
  }).join('');

  strip.innerHTML = `<div class="tl-track" role="list">${dots}</div>`;
}

/* ══ EVENTS — RENDER ═════════════════════════════════════════════════════════ */

function eventCardHome(ev) {
  const d = formatDateRange(ev.start_date, ev.end_date);
  return `<article class="event-card reveal${ev.featured ? ' featured' : ''}" data-season="${esc(ev.season||'')}">
    <div class="event-card-img" role="img" aria-label="${esc(ev.title)}">
      <div class="event-card-img-overlay" aria-hidden="true"></div>
      ${_imgOrPlaceholder(ev.image, ev.title)}
    </div>
    <div class="event-body">
      <span class="event-tag">${esc(ev.category||'')} · ${esc(ev.city||'')}</span>
      ${d ? `<div class="event-dates">${d}</div>` : ''}
      <h3>${esc(ev.title||'')}</h3>
      <p>${esc(ev.description||'')}</p>
      <a href="evenements.html" class="event-card-arrow">Voir tous les événements
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </a>
    </div>
  </article>`;
}

function eventCardPage(ev, isNext) {
  const d = formatDateRange(ev.start_date, ev.end_date);
  const sLabel = seasonLabel(ev.season);
  const cityTag = ev.city ? `<span class="event-city-tag">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1 C3.5 1 1.5 3 1.5 5.5 C1.5 8.5 6 11 6 11 C6 11 10.5 8.5 10.5 5.5 C10.5 3 8.5 1 6 1Z" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="6" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1" fill="none"/></svg>
    ${esc(ev.city)}</span>` : '';
  const link = ev.link_url ? `<a href="${esc(ev.link_url)}" target="_blank" rel="noopener noreferrer" class="event-link">${esc(ev.link_label||'Voir le site')}
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
  </a>` : '';

  return `<article class="event-card-h reveal${ev.featured ? ' featured' : ''}${isNext ? ' is-next-event' : ''}" data-season="${esc(ev.season||'')}">
    ${isNext ? `<div class="next-event-banner" aria-label="Prochain événement">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="5" fill="currentColor" opacity=".3"/><circle cx="6" cy="6" r="3" fill="currentColor"/></svg>
      Prochain événement
    </div>` : ''}
    <div class="event-img" role="img" aria-label="${esc(ev.title)}">${_imgOrPlaceholder(ev.image, ev.title)}</div>
    <div class="event-body">
      <div class="event-header">
        <span class="event-tag">${esc(ev.category||'')} · ${esc(ev.city||'')}</span>
        ${sLabel ? `<span class="event-season-badge ${seasonBadgeCls(ev.season)}">${sLabel}</span>` : ''}
      </div>
      ${d ? `<div class="event-dates">${d}</div>` : ''}
      <h3>${esc(ev.title||'')}</h3>
      <p>${esc(ev.description||'')}</p>
      <div class="event-footer">
        ${cityTag}
        ${link}
      </div>
    </div>
  </article>`;
}

function renderEventsHome() {
  const c = $('eventsHome');
  if (!c) return;
  let evs = getVisibleEvents().filter(ev => ev.featured);
  if (!evs.length) evs = getVisibleEvents();
  c.innerHTML = evs.slice(0,4).length ? evs.slice(0,4).map(ev => eventCardHome(ev)).join('') : _emptyEvents();
  _initRevealIn(c);
}

function renderEventsPage() {
  const c = $('eventsList');
  if (!c) return;
  const evs     = getVisibleEvents();
  const nextIdx = getNextEventIndex(evs);

  if (!evs.length) {
    c.innerHTML = _emptyEvents();
    const cnt = $('eventCountNum');
    if (cnt) cnt.textContent = '0';
    return;
  }

  c.innerHTML = evs.map((ev, i) => eventCardPage(ev, i === nextIdx)).join('');

  const cnt = $('eventCountNum');
  if (cnt) cnt.textContent = evs.length;

  renderEventsTimeline(evs);

  _initRevealIn(c);
}

/* ══ FLAVORS — HELPERS ═══════════════════════════════════════════════════════ */

function getVisibleFlavors() {
  return (window.ZIA_FLAVORS || [])
    .filter(f => f.visible !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

function flavorCard(f) {
  const publicLabel  = flavorPublicLabel(f.category);
  const tagCls       = flavorTagCls(f.category);
  const badgeCls     = 'badge-' + normalize(f.badge || 'classique');
  const imgHtml      = f.image
    ? `<img src="${esc(f.image)}" alt="${esc(f.title)} — kürtős Zia Kürtös" loading="lazy" width="200" height="200" onerror="this.style.display='none'">`
    : '';
  const badgeHtml     = f.badge ? `<span class="saveur-badge ${badgeCls}">${esc(f.badge)}</span>` : '';
  const upcomingNote  = f.upcoming ? `<p class="upcoming-note">Prochainement disponible</p>` : '';
  const revealTxt     = f.upcoming ? 'Bientôt disponible' : `${esc(f.title)} — kürtős artisanal`;

  return `<article class="saveur-card${f.upcoming?' is-upcoming':''} reveal"
    data-type="${esc(f.category||'')}" role="listitem">
    ${imgHtml}
    ${badgeHtml}
    <span class="saveur-tag ${tagCls}">${publicLabel}</span>
    <h3>${esc(f.title||'')}</h3>
    <p>${esc(f.description||'')}</p>
    ${upcomingNote}
    <div class="saveur-reveal">${revealTxt}</div>
  </article>`;
}

function renderFlavorsHome() {
  const c = $('flavorsHome');
  if (!c) return;
  const fl = getVisibleFlavors().filter(f => !f.upcoming);
  c.innerHTML = fl.length ? fl.map(flavorCard).join('') : _emptyFlavors();
  _initRevealIn(c);
}

function renderFlavorsPage() {
  const c = $('flavorsList');
  if (!c) return;
  const fl = getVisibleFlavors();
  c.innerHTML = fl.length ? fl.map(flavorCard).join('') : _emptyFlavors();
  _initRevealIn(c);
}

/* ══ GALLERY ═════════════════════════════════════════════════════════════════ */

function getVisibleGallery() {
  return (window.ZIA_GALLERY || [])
    .filter(g => g.visible !== false)
    .sort((a, b) => {
      const oa = a.order ?? 999, ob = b.order ?? 999;
      if (oa !== ob) return oa - ob;
      return String(b.date || '').localeCompare(String(a.date || ''));
    });
}

function galleryItemHtml(item, idx) {
  const aspect   = AR[idx % AR.length];
  const polaroid = item.featured ? ' polaroid' : '';
  const caption  = item.featured && item.caption
    ? `<p class="polaroid-caption">${esc(item.caption)}</p>` : '';
  return `<div class="masonry-item${polaroid}" data-cat="${esc(item.category||'')}" data-index="${idx}"
    role="listitem" tabindex="0"
    aria-label="${esc(item.alt||item.title||'Photo Zia Kürtös')} — ouvrir en grand">
    <div class="item-img ar-${aspect}">
      <img src="${esc(item.image)}" alt="${esc(item.alt||item.title||'Photo Zia Kürtös')}" loading="lazy" width="400" height="400" onerror="this.style.display='none'">
      <div class="item-overlay">
        <span class="item-cat">${esc(item.category||'')}</span>
        <span class="item-label">${esc(item.caption||item.title||'')}</span>
      </div>
    </div>
    ${caption}
  </div>`;
}

function _setGalleryCount(n) {
  const el = $('visibleCount');
  if (el) el.textContent = n;
}

function renderGalleryPage() {
  const c = $('galleryGrid');
  if (!c) return;
  const imgs = getVisibleGallery();
  if (!imgs.length) { c.innerHTML = _emptyGallery(); _setGalleryCount(0); return; }
  c.innerHTML = imgs.map(galleryItemHtml).join('');
  _setGalleryCount(imgs.length);
  initGalleryLightbox(imgs);
  _initRevealIn(c);
}

function renderGalleryMosaic() {
  const c = $('galleryMosaic');
  if (!c) return;
  const imgs = getVisibleGallery().slice(0,5);
  if (!imgs.length) return;
  c.innerHTML = imgs.map((item, i) => `<div class="gm-item${i===0?' tall':''}"
    role="img" aria-label="${esc(item.alt||item.title||'Photo Zia Kürtös')}">
    <img src="${esc(item.image)}" alt="${esc(item.alt||item.title||'Photo Zia Kürtös')}"
      loading="lazy" width="${i===0?560:280}" height="${i===0?560:280}" onerror="this.style.display='none'">
    <div class="gm-overlay"><span class="gm-legend">${esc(item.caption||item.title||'')}</span></div>
  </div>`).join('');
}

/* ══ INSTAGRAM PREVIEW ═══════════════════════════════════════════════════════ */

function renderInstagramPreview() {
  const c = $('instaGrid');
  if (!c) return;
  const CI   = getContactInfo();
  const url  = CI.instagram_url || 'https://www.instagram.com/ziakurtos/';
  const feed = (window.ZIA_INSTA && window.ZIA_INSTA.length)
    ? window.ZIA_INSTA.slice(0,6)
    : getVisibleGallery().filter(g => g.featured).slice(0,6);
  if (!feed.length) return;
  c.innerHTML = feed.map(item => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer"
    class="insta-item" aria-label="${esc(item.alt||item.title||'Instagram Zia Kürtös')}">
    <img src="${esc(item.image)}" alt="${esc(item.alt||item.title||'Zia Kürtös')}" loading="lazy" width="220" height="220" onerror="this.style.display='none'">
  </a>`).join('');
}

/* ══ LIGHTBOX ════════════════════════════════════════════════════════════════ */

let _lbImgs = [], _lbIdx = 0;

function initGalleryLightbox(images) {
  _lbImgs = images;
  const lb = $('lightbox');
  if (!lb) return;
  document.querySelectorAll('[data-index]').forEach(el => {
    el.onclick   = () => openLightbox(+(el.dataset.index));
    el.onkeydown = e => { if (e.key==='Enter'||e.key===' ') openLightbox(+(el.dataset.index)); };
  });
  lb.onclick = e => { if (e.target===lb) closeLightbox(); };
  lb.onkeydown = e => {
    if (e.key==='Escape')    closeLightbox();
    if (e.key==='ArrowLeft') lbNav(-1);
    if (e.key==='ArrowRight')lbNav(1);
  };
  const p=$('lbPrev'),n=$('lbNext'),cl=$('lbClose');
  if (p)  p.onclick  = ()=>lbNav(-1);
  if (n)  n.onclick  = ()=>lbNav(1);
  if (cl) cl.onclick = closeLightbox;
}

function openLightbox(i) {
  _lbIdx = Math.max(0, Math.min(i, _lbImgs.length-1));
  _updateLb();
  const lb = $('lightbox');
  if (lb) { lb.classList.add('open'); document.body.style.overflow='hidden'; }
  const cl = $('lbClose');
  if (cl) cl.focus();
}
function closeLightbox() {
  const lb=$('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow='';
}
function lbNav(dir) {
  _lbIdx = (_lbIdx + dir + _lbImgs.length) % _lbImgs.length;
  _updateLb();
}
function _updateLb() {
  const item=_lbImgs[_lbIdx]; if (!item) return;
  const fr=$('lbFrame'),ca=$('lbCaption'),co=$('lbCounter');
  if (fr) fr.innerHTML=`<img src="${esc(item.image)}" alt="${esc(item.alt||item.title||'Photo Zia Kürtös')}" style="width:100%;height:100%;object-fit:contain;">`;
  if (ca) ca.textContent=item.caption||item.title||'';
  if (co) co.textContent=`${_lbIdx+1} / ${_lbImgs.length}`;
}

/* ══ FILTERS ═════════════════════════════════════════════════════════════════
   ① Saveurs : "Sucré" = sucre+tartinage+signature+ete | "Salé" = sale
   ② Saisons : filtrage des cartes événements
   ③ Galerie : filtrage par catégorie
   Toutes les comparaisons passent par normalize() : peu importe que le HTML
   utilise "été" ou que le CMS stocke "ete", ça matche.
═══════════════════════════════════════════════════════════════════════════════ */

function initFilters() {

  // ─ Saveurs ─
  document.querySelectorAll('[data-filter-flavors]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-flavors]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      const type = normalize(btn.dataset.filterFlavors);
      document.querySelectorAll('.saveur-card').forEach(card => {
        const cat  = normalize(card.dataset.type);
        const show = type === 'all'
          || (type === 'sucre' && FLAVOR_SUCRE_GROUP.includes(cat))
          || (type === 'sale'  && FLAVOR_SALE_GROUP.includes(cat));
        card.style.display = show ? '' : 'none';
      });
    });
  });

  // ─ Saisons événements ─
  document.querySelectorAll('[data-filter-season]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-season]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      const s = normalize(btn.dataset.filterSeason);
      let n = 0;
      document.querySelectorAll('#eventsList .event-card-h, #eventsList .event-card').forEach(card => {
        const show = s==='all' || normalize(card.dataset.season)===s;
        card.style.display = show ? '' : 'none';
        if (show) n++;
      });
      const cnt = $('eventCountNum');
      if (cnt) cnt.textContent = n;
    });
  });

  // ─ Galerie ─
  document.querySelectorAll('[data-filter-gallery]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-gallery]').forEach(b => {
        b.classList.remove('active'); b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      const cat = normalize(btn.dataset.filterGallery);
      let n = 0;
      document.querySelectorAll('#galleryGrid .masonry-item').forEach(item => {
        const show = cat==='all' || normalize(item.dataset.cat)===cat;
        item.style.display = show ? '' : 'none';
        if (show) n++;
      });
      _setGalleryCount(n);
    });
  });
}

/* ══ MOBILE MENU ═════════════════════════════════════════════════════════════ */

function initMobileMenu() {
  const menu   = $('mobileMenu');
  const burger = document.querySelector('.burger');
  if (!menu || !burger) return;
  function open()  { menu.classList.add('open');    burger.setAttribute('aria-expanded','true');  document.body.style.overflow='hidden'; }
  function close() { menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); document.body.style.overflow=''; }
  burger.addEventListener('click', () => menu.classList.contains('open') ? close() : open());
  menu.addEventListener('keydown', e => { if (e.key==='Escape') close(); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  const mc = menu.querySelector('.mobile-menu-close');
  if (mc) mc.addEventListener('click', close);
}

/* ══ SCROLL NAVBAR ═══════════════════════════════════════════════════════════ */

function initScrollNavbar() {
  const nav = $('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50), { passive:true });
}

/* ══ REVEAL ANIMATIONS ═══════════════════════════════════════════════════════ */

const _reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

const _revObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); _revObs.unobserve(e.target); }
  });
}, { threshold:0.08, rootMargin:'0px 0px -40px 0px' });

function initRevealAnimations() {
  if (_reducedMotion) {
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => el.classList.add('visible'));
    return;
  }
  document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach((el, i) => {
    el.style.transitionDelay = `${(i%4)*0.07}s`;
    _revObs.observe(el);
  });
}

function _initRevealIn(container) {
  if (_reducedMotion) {
    container.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => el.classList.add('visible'));
    return;
  }
  container.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el => _revObs.observe(el));
}

/* ══ WORD CHANGER ════════════════════════════════════════════════════════════ */

function initWordChanger() {
  const el = $('wordChanger');
  if (!el || _reducedMotion) return;
  const words = ['gourmand','croustillant','moelleux','caramélisé','réconfortant','irrésistible'];
  let i = 0;
  el.style.transition='opacity .35s ease,transform .35s ease';
  setInterval(() => {
    el.style.opacity='0'; el.style.transform='translateY(6px)';
    setTimeout(() => {
      i=(i+1)%words.length;
      el.textContent=words[i];
      el.setAttribute('aria-label',words[i]);
      el.style.opacity='1'; el.style.transform='translateY(0)';
    }, 350);
  }, 2600);
}

/* ══ STAGGER ════════════════════════════════════════════════════════════════ */

function staggerCards() {
  if (_reducedMotion) return;
  document.querySelectorAll('.saveur-card,.event-card,.event-card-h,.invite-reason,.org-benefit').forEach((el,i) => {
    el.style.transitionDelay=`${(i%4)*0.07}s`;
  });
}

/* ══ HOME STATS ══════════════════════════════════════════════════════════════ */

function updateHomeStats() {
  const evs = getVisibleEvents();
  const fls = getVisibleFlavors().filter(f=>!f.upcoming);
  const se  = $('statEvents');
  const sf  = $('statFlavors');
  if (se) se.textContent = evs.length ? evs.length+'+' : '—';
  if (sf) sf.textContent = fls.length || '—';
}

/* ══ CONTACT FORM ════════════════════════════════════════════════════════════ */

function initEventTypeSelector() {
  document.querySelectorAll('.event-type-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.event-type-card').forEach(c => {
        c.classList.remove('selected'); c.setAttribute('aria-pressed','false');
      });
      card.classList.add('selected'); card.setAttribute('aria-pressed','true');
      const value = card.dataset.eventType;
      const sel = $('type-evenement');
      if (sel) {
        for (let i=0;i<sel.options.length;i++) {
          if (sel.options[i].value===value||sel.options[i].value.startsWith(value.split(' ')[0])) {
            sel.selectedIndex=i; break;
          }
        }
      }
      const td = $('type-demande');
      if (td && !td.value) td.value='Inviter Zia Kürtös à un événement';
    });
  });
}

function initContactForm() {
  const form = $('contactForm');
  if (!form) return;
  const successBox  = $('formSuccess');
  const successText = $('formSuccessText');
  const submitBtn   = $('contactSubmitBtn');

  // Applique le message de succès configuré depuis /admin/ (content/settings/contact.yml)
  const CI = getContactInfo();
  if (successText && CI.success_message) successText.textContent = CI.success_message;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submitBtn) { submitBtn.disabled=true; submitBtn.textContent='Envoi en cours…'; }
    try {
      const res = await fetch('/', {
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body: new URLSearchParams(new FormData(form)).toString()
      });
      if (res.ok) {
        form.style.display='none';
        if (successBox) {
          successBox.classList.add('show');
          successBox.scrollIntoView({behavior:'smooth',block:'center'});
        }
      } else { form.submit(); }
    } catch { form.submit(); }
  });
}

/* ══ NOS KÜRTÖS — PROCESSUS EN 5 ÉTAPES ══════════════════════════════════════
   Migré depuis le <script> inline de nos-kurtos.html.
   window.setStep reste exposé globalement car le HTML utilise encore des
   attributs onclick="setStep(i)" sur chaque étape — c'est volontaire (cf.
   passation : centraliser dans main.js sans réécrire toute la page HTML). ══ */

const TL_DATA = [
  {
    tag: 'Étape 1 sur 5',
    title: 'La pâte est enroulée autour du cylindre',
    desc: "Pâte moelleuse, qui est enroulée à la main en petites bandes autour d'un rouleau de bois ou d'inox.",
    ph: 'assets/images/kurtos-pate-enroulee.webp',
    alt: 'Pâte kürtős enroulée à la main sur un rouleau de bois'
  },
  {
    tag: 'Étape 2 sur 5',
    title: 'Le kürtős tourne lentement à la broche',
    desc: "Recouverte de sucre pour la version sucrée, elle est ensuite cuite au-dessus du grill.",
    ph: 'assets/images/kurtos-cuisson-broche.webp',
    alt: 'Kürtős artisanal qui tourne à la broche au-dessus du grill'
  },
  {
    tag: 'Étape 3 sur 5',
    title: "Moelleux à l'intérieur",
    desc: "Lors de sa cuisson, le sucre se caramélise à l'extérieur pour former un film croustillant tout en laissant place à une pâte tendre à l'intérieur.",
    ph: 'assets/images/kurtos-sucre-cannelle.webp',
    alt: 'Sucre caramélisé sur un chimney cake gâteau cheminée'
  },
  {
    tag: 'Étape 4 sur 5',
    title: 'Gourmandise au choix',
    desc: "Choisis ton extérieur : sucre, sucre-cannelle ou amandes grillées, puis ton tartinage à l'intérieur.",
    ph: 'assets/images/kurtos-nutella.webp',
    alt: 'Kürtős servi chaud avec garniture au choix'
  },
  {
    tag: 'Étape 5 sur 5',
    title: 'Version salée',
    desc: "Pour le salé, la pâte neutre est roulée dans du Gruyère ou des olives & Gruyère, puis grillée pour obtenir de délicieux petits pains salés bien gratinés.",
    ph: 'assets/images/uploads/saveur-gruyere.webp',
    alt: 'Kürtős salé au Gruyère gratiné Zia Kürtös'
  }
];

function initProcessusTimeline() {
  const steps = document.querySelectorAll('.tl-step');
  if (!steps.length) return;

  window.setStep = function setStep(i) {
    document.querySelectorAll('.tl-step').forEach((s, j) => {
      s.classList.toggle('active', j === i);
      s.setAttribute('aria-selected', j === i ? 'true' : 'false');
    });
    const d = TL_DATA[i];
    if (!d) return;
    const tag   = $('tl-detail-tag');
    const title = $('tl-detail-title');
    const desc  = $('tl-detail-desc');
    const photo = $('tl-detail-photo');
    const img   = $('tl-detail-img');
    if (tag)   tag.textContent   = d.tag;
    if (title) title.textContent = d.title;
    if (desc)  desc.textContent  = d.desc;
    if (photo) { photo.src = d.ph; photo.alt = d.alt; }
    if (img)   img.setAttribute('aria-label', d.alt);
  };
}

/* ══ FAQ ══════════════════════════════════════════════════════════════════════
   Migré depuis le <script> inline de faq.html.
   window.toggleFaq reste exposé globalement car le HTML utilise encore des
   attributs onclick="toggleFaq(this)" sur chaque question. ═══════════════════ */

function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  window.toggleFaq = function toggleFaq(btn) {
    const item = btn.closest('.faq-item');
    if (!item) return;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => {
      i.classList.remove('open');
      const q = i.querySelector('.faq-q');
      if (q) q.setAttribute('aria-expanded','false');
    });
    if (!isOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
  };
}

function initFaqCatScroll() {
  const groupIds = ['produit','evenements-faq','pratique'];
  const groups   = {};
  groupIds.forEach(id => { const el = $(id); if (el) groups[id] = el; });
  const pills = document.querySelectorAll('.cat-pill');
  if (!Object.keys(groups).length || !pills.length) return;

  window.addEventListener('scroll', () => {
    let active = groupIds[0];
    Object.entries(groups).forEach(([k, el]) => { if (el.getBoundingClientRect().top < 200) active = k; });
    pills.forEach(p => p.classList.toggle('active', p.getAttribute('href') === '#' + active));
  }, { passive: true });
}

/* ══ INIT ════════════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  applySettings();
  applyTheme();

  renderEventsHome();
  renderEventsPage();
  renderFlavorsHome();
  renderFlavorsPage();
  renderGalleryPage();
  renderGalleryMosaic();
  renderInstagramPreview();
  updateHomeStats();

  initMobileMenu();
  initScrollNavbar();
  initRevealAnimations();
  initFilters();
  initWordChanger();
  staggerCards();
  initEventTypeSelector();
  initContactForm();

  // Page-specific — guards intégrés, s'activent uniquement si l'élément existe
  initProcessusTimeline();
  initFaqAccordion();
  initFaqCatScroll();
});
