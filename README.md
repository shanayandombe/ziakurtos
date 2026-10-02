# Zia Kürtös — Site vitrine

Site vitrine de **Zia Kürtös**, stand de kürtős artisanaux présent sur des festivals, marchés, événements privés et événements d’entreprise en Suisse romande.

Le site est conçu pour :

* présenter l’univers de Zia Kürtös ;
* mettre en avant les saveurs ;
* afficher les événements à venir ;
* présenter une galerie photo ;
* permettre aux organisateurs de contacter Zia Kürtös ;
* permettre la modification des contenus courants depuis une interface admin simple, sans toucher au code.

---

## Aide-mémoire : où modifier quoi ?

| Je veux changer… | Où ? |
| --- | --- |
| **Les couleurs** | `assets/css/styles.css` |
| **Une saveur** | `/admin/` ou `content/saveurs/` |
| **Un événement** | `/admin/` ou `content/evenements/` |
| **Une photo de galerie** | `/admin/` ou `content/galerie/` |
| **Réseaux sociaux, boutons (CTA), bandeau d’annonce, crédit footer** | `/admin/` → Réglages du site, ou `content/settings/site.yml` |
| **Email affiché, liens de contact, message de succès du formulaire** | `/admin/` → Paramètres de contact, ou `content/settings/contact.yml` |
| **La structure d’une page** | le fichier HTML de la page |
| **Une interaction (menu, filtres, FAQ, lightbox…)** | `assets/js/main.js` |
| **L’email qui reçoit les demandes du formulaire** | Dashboard Netlify → Forms (pas dans le site) |

> ⚠️ **NE PAS MODIFIER MANUELLEMENT : `assets/js/zia-data.js`** — ce fichier est généré automatiquement par `build.js`. Toute modification manuelle sera écrasée au prochain build.

---

## 1. Architecture du site

Le site est **statique** : pas de serveur, pas de base de données. Le principe est d’avoir **une seule source de vérité par type de donnée**.

```text
.
├── index.html
├── a-propos.html
├── nos-kurtos.html
├── evenements.html
├── galerie.html
├── faq.html
├── contact.html
├── build.js
├── README.md
├── admin/
│   ├── index.html          ← chargeur Decap CMS (ne pas confondre avec /index.html)
│   └── config.yml          ← configuration du CMS
├── assets/
│   ├── css/
│   │   └── styles.css      ← TOUS les styles du site
│   ├── js/
│   │   ├── main.js         ← TOUTES les interactions + application des réglages
│   │   └── zia-data.js     ← GÉNÉRÉ par build.js — ne jamais modifier
│   └── images/
│       └── uploads/        ← images ajoutées via le CMS
└── content/
    ├── evenements/         ← un fichier .yml par événement
    ├── saveurs/            ← un fichier .yml par saveur
    ├── galerie/            ← un fichier .yml par photo (créé au premier ajout)
    └── settings/
        ├── site.yml        ← réglages généraux
        └── contact.yml     ← réglages de contact
```

| Rôle | Fichier |
| --- | --- |
| Structure et textes propres à chaque page | les fichiers `.html` |
| Design (couleurs, typographie, composants, responsive) | `assets/css/styles.css` |
| Interactions et affichage des données | `assets/js/main.js` |
| Contenus modifiables (événements, saveurs, galerie, réglages) | `content/` |
| Interface d’édition | `/admin/` (Decap CMS) |
| Génération des données | `build.js` |
| Données générées | `assets/js/zia-data.js` |

Les pages HTML ne contiennent **pas** de bloc `<style>` ni de gros scripts inline : le design est dans `styles.css`, le comportement dans `main.js`.

---

## 2. Modifier les couleurs

Pour changer une couleur du site :

```text
assets/css/styles.css
```

Les palettes **summer** et **winter** sont définies **uniquement** dans ce fichier (variables CSS, en tête du fichier).

* `content/settings/site.yml` ne fait que **choisir** le thème actif :

```yml
active_theme: summer
```

ou

```yml
active_theme: winter
```

* `main.js` se contente de poser l’attribut `data-theme` sur la page ; il ne contient aucune couleur.
* `build.js` **ne contient plus aucune palette** de couleurs : il transmet simplement `active_theme`.

Pour modifier une couleur précise, il suffit donc de changer la variable correspondante dans `styles.css`.

---

## 3. Modifier les saveurs

Via l’admin :

```text
/admin/ → Saveurs
```

ou directement dans :

```text
content/saveurs/
```

Champs gérables :

* titre ;
* description ;
* catégorie ;
* badge (optionnel) ;
* image (optionnelle) ;
* permanent ;
* upcoming (prochainement) ;
* visible ;
* order (ordre d’affichage).

Les saveurs sont **affichées dynamiquement** sur la page d’accueil (toutes les saveurs disponibles, avec filtres Sucré / Salé) et sur `nos-kurtos.html` par `main.js`. Une saveur « prochainement » (`upcoming`) n’apparaît pas sur l’accueil.

> **Ne pas modifier `nos-kurtos.html` pour changer une saveur** : les saveurs n’y sont pas écrites en dur.

Badges disponibles : `classique`, `gourmand`, `reconfortant`, `signature`, `sale` (ou aucun).

---

## 4. Modifier les événements

Via l’admin :

```text
/admin/ → Événements
```

ou directement dans :

```text
content/evenements/
```

Champs : titre, date de début, date de fin, ville, lieu, catégorie, saison, description, texte et URL du lien, photo, visible, mis en avant, ordre d’affichage.

Les événements sont **affichés dynamiquement** (page d’accueil et `evenements.html`).

**Le prochain événement est calculé automatiquement** par `main.js` à partir des dates de début / fin et de la date du jour :

* tous les événements visibles restent affichés ;
* seul le prochain événement à venir est mis en avant : parmi les événements non terminés, celui dont la date de début est la plus proche (un événement en cours compte comme « prochain »). Le champ « ordre d’affichage » ne change pas ce calcul, il ne sert qu’à trier la liste ;
* les événements passés et les suivants restent neutres ;
* s’il n’y a plus aucun événement à venir, aucun « prochain » n’est affiché.

> **Ne pas ajouter de champ manuel « prochain événement »** : le calcul est entièrement automatique.

Si `visible` est désactivé, l’événement reste dans l’admin mais n’apparaît pas sur le site.

---

## 5. Galerie

La galerie est gérée via l’admin :

```text
/admin/ → Galerie photos
```

Les fichiers créés sont stockés dans :

```text
content/galerie/
```

Le dossier `content/galerie/` **n’existe pas encore dans le dépôt** (aucune photo n’a été créée). Ce n’est pas un problème pour le site : `build.js` gère ce cas (la galerie et la mosaïque d’accueil affichent alors un message « Les images arrivent bientôt »), ne lit ensuite que les fichiers `.yml` / `.yaml` et ignore tout le reste (par exemple un `.gitkeep`).

**Création de la première photo depuis `/admin/` — état de la vérification :**

* Vérifié dans le code source de Decap CMS (paquets `decap-cms-backend-github` 3.8.3 et `decap-cms-backend-git-gateway` 3.7.3) : lister un dossier absent est prévu (l’erreur 404 est interceptée et la collection s’affiche vide), et l’enregistrement d’un fichier passe par l’API « git tree » de GitHub, qui crée les dossiers manquants ; le code ne vérifie pas l’existence préalable du dossier.
* **Non testé en conditions réelles** (pas d’accès à un site déployé avec Netlify Identity) : à confirmer après déploiement en ajoutant une première photo depuis `/admin/` → Galerie photos, puis en vérifiant qu’un fichier apparaît dans `content/galerie/` et que la photo s’affiche sur `galerie.html` après le redéploiement.
* Un fichier `content/galerie/.gitkeep` (vide) est possible mais pas nécessaire d’après le code de Decap ; il est sans danger si vous préférez que le dossier existe dès le départ.

Les images uploadées vont dans :

```text
assets/images/uploads/
```

Format recommandé : `.webp`.

Champs : titre, image, texte alternatif SEO, légende, catégorie, mise en avant, visible, ordre, date.

> **Ne pas écrire les photos du CMS en dur dans `galerie.html`** : la page et la mosaïque de la page d’accueil sont remplies automatiquement par `main.js`.

---

## 6. Réglages généraux

Via l’admin :

```text
/admin/ → Réglages du site
```

ou directement dans :

```text
content/settings/site.yml
```

Permet de modifier :

* l’email général ;
* les liens Instagram, Facebook et TikTok ;
* le thème actif (`summer` ou `winter`) ;
* le texte du bouton principal (CTA principal) ;
* le texte du bouton de contact (CTA contact) ;
* le bandeau d’annonce ;
* le crédit du footer.

Crédit footer actuel :

```yml
footer_credit_text: la-malice.ch
footer_credit_url: https://la-malice.ch/
```

---

## 7. Paramètres de contact

Via l’admin :

```text
/admin/ → Paramètres de contact
```

ou directement dans :

```text
content/settings/contact.yml
```

Permet de modifier :

* l’email affiché sur le site ;
* le lien Instagram ;
* le lien Facebook ;
* le message de succès affiché après l’envoi du formulaire.

Exemple :

```yml
contact_display_email: "info@ziakurtos.com"
instagram_url: "https://www.instagram.com/ziakurtos/"
facebook_url: "https://www.facebook.com/zia.kurtos/"
success_message: "Merci beaucoup pour votre message. Nous avons bien reçu votre demande et nous réjouissons de vous répondre très bientôt."
```

Écrire l’email en clair (`info@ziakurtos.com`), **sans** syntaxe Markdown ni `mailto:`.

Les valeurs de `contact.yml` sont prioritaires pour l’email et les réseaux affichés ; si l’un de ces champs est vide dans `contact.yml`, la valeur correspondante de `site.yml` est utilisée.

### Email affiché ≠ email qui reçoit les demandes

* **L’email affiché sur le site** (liens « nous écrire », hero, footer) se change depuis Decap CMS.
* **L’adresse qui reçoit réellement les notifications du formulaire** (Netlify Forms) se configure **dans Netlify**, pas dans Decap :
  1. ouvrir le projet Netlify ;
  2. onglet **Forms** → vérifier que le formulaire `contact` est détecté ;
  3. **Settings & webhooks → Form notifications** → ajouter une notification email ;
  4. y saisir l’adresse qui doit recevoir les demandes.

| Élément | Où le modifier ? |
| --- | --- |
| Email affiché sur le site | Admin Decap CMS |
| Email qui reçoit les formulaires | Dashboard Netlify |
| Message de succès du formulaire | Admin Decap CMS |
| Liens Instagram / Facebook | Admin Decap CMS |

---

## 8. Structure des pages

Pour changer la structure ou les textes propres à une page, modifier le fichier HTML correspondant :

* `index.html` — accueil
* `a-propos.html`
* `nos-kurtos.html`
* `evenements.html`
* `galerie.html`
* `faq.html`
* `contact.html`

> Attention : `/index.html` est la page d’accueil du site. `/admin/index.html` est uniquement le chargeur de Decap CMS : ne jamais les confondre.

Les styles restent dans `styles.css` : un HTML n’a besoin que de choisir les bonnes classes (par exemple `page-hero--apropos`, `page-hero--evenements`, `nav-transparent`, `nav-dark`, `mobile-menu--dark`…).

---

## 9. Interactions

Pour modifier une interaction, utiliser :

```text
assets/js/main.js
```

Il centralise notamment :

* les réglages (email, réseaux, CTA, annonce, crédit footer) et le thème ;
* le menu mobile et la barre de navigation au scroll ;
* les animations d’apparition et le bandeau défilant ;
* les filtres (saveurs, saisons, galerie) ;
* l’affichage des saveurs, des événements, de la galerie et de la mosaïque d’accueil ;
* le calcul du prochain événement et la timeline ;
* la lightbox de la galerie ;
* le processus en 5 étapes de `nos-kurtos.html` ;
* la FAQ (accordéons et navigation par catégories) ;
* le sélecteur de type d’événement et le formulaire de contact (message de succès).

`main.js` fonctionne page par page : si un élément n’existe pas sur la page, la fonction correspondante ne fait simplement rien.

---

## 10. Build et déploiement

Commande de build :

```bash
node build.js
```

Elle lit `content/` et génère `assets/js/zia-data.js`. Aucune dépendance externe (Node.js uniquement) : il n’y a pas de `package.json` ni de `npm install`.

Les textes longs peuvent être écrits normalement dans l’admin : le lecteur YAML de `build.js` comprend les valeurs repliées sur plusieurs lignes par Decap, les guillemets, les apostrophes, les accents et les « : » dans un texte.

Paramètres Netlify :

```text
Build command: node build.js
Publish directory: .
Base directory: laisser vide
```

Chaîne de fonctionnement complète :

```text
/admin/ (la cliente modifie un contenu)
→ fichier YAML dans content/
→ GitHub
→ Netlify
→ node build.js
→ assets/js/zia-data.js
→ main.js
→ site mis à jour
```

Après « Publier » dans l’admin, attendre le redéploiement Netlify (quelques instants) avant de voir le changement.

`build.js` :

* lit les fichiers `.yml` / `.yaml` de `content/` (tout autre fichier est ignoré) ;
* affiche des avertissements (sans bloquer le build) si une valeur n’est pas comprise par `main.js` : catégorie ou badge de saveur inconnu, saison inconnue, date invalide, saveur en double ;
* crée `content/settings/site.yml` et `content/settings/contact.yml` **uniquement s’ils sont absents** ;
* ne réécrit jamais les contenus existants et n’ajoute aucun faux événement, saveur ou photo ;
* ne contient aucune palette de couleurs.

---

## 11. Interface admin (Decap CMS) et accès

Le site utilise **Decap CMS**, accessible à l’adresse :

```text
/admin/
```

Configuration Netlify Identity et Git Gateway :

1. Ouvrir le projet Netlify → **Identity** → activer **Netlify Identity**.
2. **Identity → Services** → activer **Git Gateway**.
3. Mettre les inscriptions en mode **Invite only**.
4. Inviter l’utilisatrice avec son email.
5. Une fois invitée, elle accède à `/admin/`.

Pour modifier un contenu : `/admin/` → se connecter → choisir la collection → modifier → **Publier**.

---

## 12. Netlify Forms

Le formulaire de contact utilise **Netlify Forms** et doit rester **physiquement dans** :

```text
contact.html
```

Il ne doit pas être généré en JavaScript, sinon Netlify ne le détecte pas au build.

**Ne jamais supprimer ni renommer, sans vérifier, ces éléments :**

* `data-netlify="true"` sur le `<form>` ;
* `<input type="hidden" name="form-name" value="contact">` ;
* le honeypot (`netlify-honeypot="bot-field"` et le champ `bot-field`) ;
* `name="email"` sur le champ email du visiteur (permet de répondre directement à la personne).

Test après toute modification importante :

1. déployer ;
2. ouvrir `/contact.html` et envoyer une demande avec une adresse de test ;
3. vérifier que le message de succès s’affiche ;
4. vérifier que la soumission apparaît dans **Netlify → Forms** ;
5. vérifier que l’email de notification est bien reçu.

---

## 13. Images

Dossier des images ajoutées via le CMS :

```text
assets/images/uploads/
```

Recommandations :

* format `.webp` (performances) ;
* noms en **minuscules**, **descriptifs**, **sans accents**, **sans espaces** ;
* compresser les images avant l’envoi.

Exemples :

```text
zia-kurtos-stand-preparation.webp
kurtos-sucre-cannelle.webp
kurtos-creme-pistache.webp
zia-kurtos-montreux-jazz.webp
```

---

## 14. Compatibilité admin / YAML / main.js

Les valeurs techniques enregistrées dans les YAML doivent rester **compatibles avec `main.js`**. Le CMS ne doit pas proposer de valeur que `main.js` ne sait pas afficher.

### Catégories de saveurs

Valeurs techniques (sans accents) proposées par le CMS et affichage public :

| Valeur dans le YAML | Affichage public |
| --- | --- |
| `sucre` | Sucré |
| `tartinage` | Sucré |
| `signature` | Sucré |
| `sale` | Salé |

Côté public, les filtres se limitent à **Sucré / Salé**. Les catégories internes `tartinage` et `signature` restent compatibles (elles sont utilisées par les saveurs existantes) et s’affichent simplement comme « Sucré ».

Badges possibles (optionnels) : `classique`, `gourmand`, `reconfortant`, `signature`, `sale`.

### Saisons des événements

Les saisons concernent uniquement les **événements** (pas les saveurs) :

| Valeur dans le YAML | Affichage |
| --- | --- |
| `printemps` | Printemps |
| `ete` | Été |
| `automne` | Automne |
| `hiver` | Hiver |
| `annuel` | Annuel |

`main.js` ignore les accents et la casse pour comparer catégories, saisons et filtres : `ete` (CMS) et « été » (filtre du HTML) se correspondent.

### Autres valeurs

* Catégories d’événements : `festival`, `marche`, `marche de Noel`, `food festival`, `evenement prive`, `fete communale`, `autre`.
* Catégories de galerie : `cuisson`, `saveurs`, `stand`, `evenements`, `ete`, `hiver`, `Montreux Jazz`, `Montreux Noel`, `autres`.
* Thème : `summer` ou `winter`.

Configuration du CMS :

```text
admin/config.yml
```

---

## 15. Fichiers à ne pas modifier manuellement

**NE PAS MODIFIER MANUELLEMENT :**

```text
assets/js/zia-data.js
```

Ce fichier est généré par `build.js` à chaque build. Toute modification directe sera écrasée. Pour changer les données affichées, passer par `/admin/` ou par les fichiers de `content/`.

---

## 16. Vérification avant mise en ligne

* lancer `node build.js` et vérifier qu’il se termine sans erreur ;
* vérifier que `assets/js/zia-data.js` est bien régénéré ;
* vérifier les 7 pages sur ordinateur et mobile ;
* vérifier les liens du menu, les CTA, le footer et les réseaux ;
* vérifier que les saveurs, les événements et la galerie s’affichent depuis le CMS ;
* tester le formulaire de contact (voir section Netlify Forms) ;
* vérifier les images et les textes SEO.

---

## 17. Notes de maintenance

* privilégier `/admin/` pour toutes les modifications courantes ;
* ne jamais éditer les données générées ;
* garder des noms d’images propres ;
* ne pas remettre de gros blocs `<style>` dans les pages HTML : tout le design va dans `assets/css/styles.css` ;
* ne pas donner accès à Netlify à une personne non technique sauf nécessité.

---

## Crédit

Site réalisé par **la-malice.ch** — <https://la-malice.ch/>
