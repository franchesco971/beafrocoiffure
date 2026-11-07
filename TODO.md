# BeAfro Coiffure & Beauté — Suivi de réalisation

Basé sur le plan de réalisation du [document technique](DOCUMENT-TECHNIQUE.md#15-plan-de-réalisation) (section 15).

## Phase 1

### Étape 0 — Initialisation
- [x] Projet Next.js (App Router, TypeScript, Tailwind)
- [x] Docker : `app`, `db`, `adminer`, `mailpit`
- [x] Prisma 7 (adaptateur PostgreSQL, `prisma.config.ts`)
- [x] Thème noir & or, polices, logo et page d'accueil
- [x] CI GitHub Actions (lint, tests, build de l'image Docker)
- [x] Prettier, Husky (pré-commit : lint + `tsc --noEmit`)
- [x] shadcn/ui
- [x] Service `worker` dans Docker Compose
- [x] Commit initial

### Étape 1 — Modèle de données
- [x] Schéma Prisma complet (20 tables)
- [x] Migration initiale et contrainte anti-chevauchement `booking_no_overlap`
- [x] Seed : catégories, prestations de départ, catégories de galerie

### Authentification administrateur
- [x] Auth.js (credentials, sessions cookies httpOnly)
- [x] Rôles et contrôle côté serveur sur chaque action admin
- [x] Limitation des tentatives de connexion
- [x] Journal d'audit (`audit_log`)

### Étape 2 — Catalogue de prestations
- [x] Pages publiques : liste par catégorie et fiche prestation (`/coiffure/[slug]`)
- [x] Remplacer les données statiques de la page d'accueil par la base
- [x] Admin : CRUD catégories et prestations (tarif, durée, vidéo, conditions, activation)

### Étape 3 — Réservation (priorité n°1)
- [ ] Moteur de disponibilités (`modules/booking`) et tests unitaires Vitest
- [ ] API `GET /api/availability` et `POST /api/bookings` (erreur 409 en cas de conflit)
- [ ] Tunnel de réservation (`/reservation`) et branchement des boutons « Prendre rendez-vous »
- [ ] Lien sécurisé `cancel_token` : consultation, annulation, demande de modification
- [ ] Règles paramétrables (`setting`) : pause, délai minimum, pas, annulation, horizon
- [ ] Test d'intégration de concurrence (deux réservations simultanées)

### Étape 4 — Planning administrateur
- [ ] Calendrier FullCalendar (jour, semaine, mois) et déplacement par glisser-déposer
- [ ] Horaires hebdomadaires, congés, absences, blocages ponctuels
- [ ] Création, modification et annulation manuelles de rendez-vous
- [ ] Fiche client et historique

### Étape 5 — Notifications
- [ ] File d'envoi (`notification`) et worker avec reprise en cas d'échec
- [ ] E-mails : demande, confirmation, modification, annulation
- [ ] Notification de l'administrateur (nouvelle réservation, annulation)
- [ ] Rappel avant rendez-vous (J-1)
- [ ] Templates React Email

### Étape 6 — Contenus et vie du site
- [ ] Espace Beauté & Bien-être (testing, accompagnements, mention conseil non médical)
- [ ] Galerie : upload d'images et vidéos, catégories, avant/après
- [ ] Événements : pages publiques, inscriptions, gestion des places
- [ ] Avis clients avec modération
- [ ] Formulaire de contact
- [ ] Back-office : tableau de bord, clients, contenus modifiables, statistiques, paramètres

### Étape 7 — Conformité, SEO, sécurité
- [ ] Pages légales (mentions, confidentialité, CGV/CGR) éditables
- [ ] RGPD : consentement, export et anonymisation, durée de conservation
- [ ] SEO : métadonnées par page, `sitemap.xml`, `robots.txt`, données structurées Schema.org
- [ ] Sécurité : rate limiting, anti-spam (honeypot / Turnstile), en-têtes CSP
- [ ] Performance : Lighthouse Performance ≥ 90, SEO ≥ 95, Accessibilité ≥ 90

### Étape 8 — Recette et mise en production
- [ ] Tests E2E Playwright (réservation complète, connexion admin, responsive)
- [ ] `docker-compose.prod.yml` avec Caddy (HTTPS, redirection `www`)
- [ ] Sauvegardes `pg_dump` chiffrées et test de restauration
- [ ] Supervision (healthcheck, alertes d'indisponibilité)
- [ ] Mise en ligne sur `www.beafrocoiffure.fr`

## Contenus à obtenir auprès de la cliente
- [ ] Durées et tarifs réels de chaque prestation
- [ ] Photos et vidéos de réalisations
- [ ] Textes de présentation, coordonnées et réseaux sociaux
- [ ] Horaires de travail et règles de réservation (pause, délais, annulation, acompte)
- [ ] Lieu(x) de prestation (salon, domicile, itinérant)
- [ ] Rappels par SMS : oui ou non ; acompte en ligne : oui ou non

## Phase 2
- [ ] Comptes clients optionnels, historique et suivi personnalisé
- [ ] Recommandations et programme de fidélité

## Phase 3
- [ ] Boutique et cartes-cadeaux
- [ ] Espace communautaire
- [ ] Statistiques avancées
