# Zia Kürtös — Site vitrine

Site vitrine de **Zia Kürtös**, stand de kürtős artisanaux présent sur des festivals, marchés, événements privés et événements d’entreprise en Suisse romande.

Le site est conçu pour :

* présenter l’univers de Zia Kürtös ;
* mettre en avant les saveurs ;
* afficher les événements à venir ;
* présenter une galerie photo ;
* permettre aux organisateurs de contacter Zia Kürtös ;
* permettre la modification de certains contenus depuis une interface admin simple.

---

## Structure du projet

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
│   ├── index.html
│   └── config.yml
├── assets/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── main.js
│   │   └── zia-data.js
│   └── images/
│       └── uploads/
└── content/
    ├── evenements/
    ├── saveurs/
    ├── galerie/
    └── settings/
        ├── site.yml
        └── contact.yml
```

---

## Fonctionnement général

Le site est un site statique.

Les contenus modifiables sont stockés dans le dossier `content/`, puis transformés automatiquement en données JavaScript grâce au fichier `build.js`.

Le fichier généré est :

```text
assets/js/zia-data.js
```

Ce fichier est généré automatiquement et ne doit pas être modifié manuellement.

---

## Commande de build

Pour générer les données du site :

```bash
node build.js
```

Cette commande lit les fichiers du dossier `content/` et génère automatiquement :

```text
assets/js/zia-data.js
```

---

## Déploiement Netlify

Paramètres recommandés sur Netlify :

```text
Build command: node build.js
Publish directory: .
Base directory: laisser vide
```

À chaque déploiement, Netlify lance `node build.js`, puis publie le site.

---

## Interface admin

Le site utilise **Decap CMS** pour permettre la modification de certains contenus sans toucher au code.

L’interface admin est accessible à cette adresse :

```text
/admin/
```

Exemple :

```text
https://votre-site.netlify.app/admin/
```

---

## Configuration Netlify Identity et Git Gateway

Pour activer l’admin :

1. Aller dans le projet Netlify.
2. Ouvrir **Identity**.
3. Activer **Netlify Identity**.
4. Aller dans **Identity > Services**.
5. Activer **Git Gateway**.
6. Mettre les inscriptions en mode **Invite only**.
7. Inviter l’utilisatrice du site avec son email.
8. Une fois invitée, elle pourra accéder à `/admin/`.

---

## Contenus modifiables depuis l’admin

### Événements

Les événements sont stockés dans :

```text
content/evenements/
```

Ils permettent d’afficher les présences de Zia Kürtös sur les festivals, marchés, événements saisonniers ou autres rendez-vous.

Champs principaux :

* titre ;
* date de début ;
* date de fin ;
* ville ;
* lieu ;
* catégorie ;
* saison ;
* description ;
* image ;
* lien externe ;
* événement mis en avant ;
* visible ou non ;
* ordre d’affichage.

---

### Saveurs

Les saveurs sont stockées dans :

```text
content/saveurs/
```

Elles permettent d’afficher les différents kürtős proposés.

Champs principaux :

* nom de la saveur ;
* catégorie ;
* description ;
* image ;
* badge optionnel ;
* saveur permanente ;
* prochainement disponible ;
* visible ou non ;
* ordre d’affichage.

Catégories utilisées :

```text
sucre
tartinage
signature
sale
```

Badges optionnels recommandés :

```text
classique
gourmand
reconfortant
signature
```

---

### Galerie

Les images de galerie sont stockées dans :

```text
content/galerie/
```

Elles permettent d’alimenter la page galerie, la mosaïque photo et certains aperçus visuels du site.

Champs principaux :

* titre ;
* image ;
* texte alternatif SEO ;
* légende ;
* catégorie ;
* image mise en avant ;
* visible ou non ;
* ordre d’affichage.

---

### Paramètres généraux du site

Les paramètres généraux sont stockés dans :

```text
content/settings/site.yml
```

Ils permettent de modifier :

* l’email général ;
* les liens Instagram, Facebook et TikTok ;
* le thème actif ;
* les textes des boutons principaux ;
* le bandeau d’annonce ;
* le crédit footer.

Ne pas modifier directement `assets/js/zia-data.js`. Les changements doivent être faits dans l’admin ou dans les fichiers `content/`.

---

## Paramètres de contact

Les paramètres de contact sont stockés dans :

```text
content/settings/contact.yml
```

Ils permettent de modifier :

* l’email affiché sur le site ;
* le lien Instagram ;
* le lien Facebook ;
* le message de succès du formulaire.

Exemple :

```yml
contact_display_email: "ndombe.shanaya@gmail.com"
instagram_url: "https://www.instagram.com/ziakurtos/"
facebook_url: "https://www.facebook.com/zia.kurtos/"
success_message: "Merci pour votre demande. Nous vous répondons dans les plus brefs délais."
```

---

## Formulaire de contact — Netlify Forms

Le formulaire de contact de la page `contact.html` utilise **Netlify Forms**.

Lorsqu’une personne remplit le formulaire, les informations sont envoyées à Netlify et apparaissent dans l’onglet **Forms** du projet Netlify.

Le formulaire permet de recevoir des demandes pour :

* inviter Zia Kürtös à un événement ;
* poser une question générale ;
* proposer une collaboration ;
* faire une demande presse ou partenariat.

---

## Email affiché sur le site

L’email affiché sur le site peut être modifié depuis l’interface admin Decap CMS.

Chemin dans l’admin :

```text
Paramètres de contact
```

Champ à modifier :

```text
Email affiché sur le site
```

Ce champ modifie les liens `mailto:` et l’email visible sur la page contact et dans le footer.

Par défaut, l’email de test est :

```text
ndombe.shanaya@gmail.com
```

---

## Email qui reçoit les formulaires

Attention : l’email affiché sur le site et l’email qui reçoit les formulaires ne sont pas forcément la même chose.

Avec Netlify Forms, l’email de réception des notifications doit être configuré directement dans le dashboard Netlify.

Pour configurer l’email de réception :

1. Aller dans le projet Netlify.
2. Ouvrir l’onglet **Forms**.
3. Vérifier que le formulaire `contact` est bien détecté.
4. Aller dans les paramètres de notification du formulaire.
5. Ajouter une notification email.
6. Pour le test, utiliser :

```text
ndombe.shanaya@gmail.com
```

7. Plus tard, remplacer cet email par l’adresse finale de Zia Kürtös si nécessaire.

---

## Différence importante entre les emails

| Élément                          | Où le modifier ?  |
| -------------------------------- | ----------------- |
| Email affiché sur le site        | Admin Decap CMS   |
| Email qui reçoit les formulaires | Dashboard Netlify |
| Message de succès du formulaire  | Admin Decap CMS   |
| Liens Instagram / Facebook       | Admin Decap CMS   |

---

## Test du formulaire

Après chaque modification importante :

1. Déployer le site sur Netlify.
2. Ouvrir la page :

```text
/contact.html
```

3. Remplir le formulaire avec une adresse email de test.
4. Envoyer le formulaire.
5. Vérifier que le message de succès s’affiche.
6. Vérifier que la soumission apparaît dans **Netlify > Forms**.
7. Vérifier que l’email de notification est bien reçu.

---

## Note technique sur Netlify Forms

Le formulaire doit rester présent directement dans le fichier :

```text
contact.html
```

Il ne doit pas être généré uniquement en JavaScript, sinon Netlify risque de ne pas le détecter correctement au moment du build.

Le champ email du visiteur doit garder :

```html
name="email"
```

Cela permet de faciliter la réponse directe à la personne qui a rempli le formulaire.

---

## Images

Les images ajoutées depuis l’admin sont stockées dans :

```text
assets/images/uploads/
```

Formats recommandés :

```text
.webp
.jpg
.png
```

Recommandations :

* privilégier `.webp` pour les performances ;
* compresser les images avant upload ;
* utiliser des noms de fichiers clairs ;
* éviter les accents et espaces dans les noms de fichiers.

Exemple :

```text
zia-kurtos-montreux-jazz.webp
kurtos-sucre-cannelle.webp
stand-zia-kurtos-festival.webp
```

---

## Modifier les contenus

Pour modifier un contenu :

1. Aller sur `/admin/`.
2. Se connecter.
3. Choisir la collection souhaitée :

   * Événements ;
   * Saveurs ;
   * Galerie ;
   * Paramètres du site ;
   * Paramètres de contact.
4. Modifier le contenu.
5. Cliquer sur **Publier**.
6. Attendre le redéploiement Netlify.

---

## Ajouter un événement

Dans l’admin :

```text
Événements > Nouveau
```

Remplir les champs nécessaires :

* titre ;
* dates ;
* ville ;
* lieu ;
* catégorie ;
* description ;
* image ;
* saison ;
* visible ;
* mis en avant ;
* ordre d’affichage.

Si `visible` est désactivé, l’événement reste dans l’admin mais n’apparaît pas sur le site.

---

## Ajouter une saveur

Dans l’admin :

```text
Saveurs > Nouveau
```

Remplir les champs nécessaires :

* titre ;
* catégorie ;
* description ;
* image optionnelle ;
* badge optionnel ;
* prochainement disponible ;
* visible ;
* ordre d’affichage.

Si `prochainement disponible` est activé, la saveur peut être affichée comme saveur à venir selon le design prévu.

---

## Ajouter une image à la galerie

Dans l’admin :

```text
Galerie > Nouveau
```

Remplir les champs :

* titre ;
* image ;
* texte alternatif ;
* légende ;
* catégorie ;
* visible ;
* mise en avant ;
* ordre d’affichage.

Le texte alternatif est important pour le référencement et l’accessibilité.

---

## Fichiers à ne pas modifier manuellement

Ne pas modifier manuellement :

```text
assets/js/zia-data.js
```

Ce fichier est généré automatiquement par :

```text
build.js
```

Toute modification faite directement dans `zia-data.js` sera écrasée au prochain build.

---

## Fichiers principaux à modifier si nécessaire

### Style du site

```text
assets/css/styles.css
```

### Interactions JavaScript

```text
assets/js/main.js
```

### Génération des données

```text
build.js
```

### Configuration admin

```text
admin/config.yml
```

---

## Vérification avant mise en ligne

Avant de livrer le site :

* vérifier toutes les pages sur mobile ;
* vérifier les liens du menu ;
* vérifier les liens Instagram/Facebook/TikTok ;
* vérifier le formulaire de contact ;
* vérifier les images ;
* vérifier les textes SEO ;
* vérifier que `node build.js` fonctionne ;
* vérifier que `assets/js/zia-data.js` est bien généré ;
* vérifier que les contenus admin apparaissent correctement sur le site.

---

## Commandes utiles

Générer les données :

```bash
node build.js
```

Vérifier rapidement que le fichier généré existe :

```bash
ls assets/js/zia-data.js
```

---

## Notes pour la maintenance

Pour garder le site propre :

* ajouter les contenus depuis l’admin dès que possible ;
* éviter de modifier directement les données générées ;
* garder des noms d’images propres ;
* tester le formulaire après chaque changement important ;
* ne pas donner accès à Netlify à une personne non technique sauf nécessité ;
* privilégier l’admin Decap pour les modifications courantes.

---

## Crédit

Site créé par **Web On It !**

Instagram :

```text
https://www.instagram.com/web.onit/
```
