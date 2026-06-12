/* ─────────────────────────────────────────────────
   Zia Kürtös — zia-data.js
   Généré par build.js — Ne pas modifier manuellement
   Build : 2026-06-12T21:41:33.301Z
   Événements : 0 | Saveurs : 0 | Photos : 0
───────────────────────────────────────────────── */

/* global ZIA_EVENTS, ZIA_FLAVORS, ZIA_GALLERY, ZIA_SETTINGS, ZIA_THEME, ZIA_INSTA */

window.ZIA_EVENTS   = [];

window.ZIA_FLAVORS  = [];

window.ZIA_GALLERY  = [];

window.ZIA_SETTINGS = {
  "email": "info@ziakurtos.com",
  "instagram_url": "https://www.instagram.com/ziakurtos/",
  "facebook_url": "https://www.facebook.com/zia.kurtos/",
  "tiktok_url": "",
  "active_theme": "summer",
  "main_cta_label": "Découvrir nos kürtös artisanaux",
  "contact_cta_label": "Inviter Zia Kürtös",
  "announcement_text": "",
  "footer_credit_text": "Site créé par Web On It !",
  "footer_credit_url": "https://www.instagram.com/web.onit/"
};

window.ZIA_THEME    = {
  "--creme": "#FEFEE2",
  "--beige": "#F5F0C4",
  "--dore": "#D89B28",
  "--caramel": "#B66A2C",
  "--brun": "#4A2B1A",
  "--sapin": "#2D5A3D",
  "--rouge": "#A6422A",
  "--rouge2": "#7F2F20",
  "--blanc": "#FFFFFB",
  "--texte": "#2C1810",
  "--gris": "#6B4435"
};

window.ZIA_INSTA    = [];

/* ── Applique les variables de thème sur :root ── */
(function () {
  const r = document.documentElement;
  Object.entries(window.ZIA_THEME).forEach(([k, v]) => r.style.setProperty(k, v));
})();
