# SamaDokita - démo déployable

Ce dépôt contient : `backend/` (NestJS + Prisma + PostgreSQL) et `frontend/` (Next.js 15).
**C'est une version de DÉMONSTRATION. Ne pas y saisir de vraies données de santé.**

## Déployer sur Render
1. Mettre ce dossier sur GitHub (sans `node_modules`).
2. Render > New > Blueprint > choisir le dépôt (`render.yaml` crée la base et les 2 services).
3. Quand `samadokita-api` est en ligne, copier son URL publique.
4. Dans `samadokita-web` > Environment : `API_URL` = cette URL, puis redéployer le service web.
5. Logs de `samadokita-api` : les mots de passe des comptes de démo s'affichent UNE fois. Ensuite mettre `SEED_DEMO=false`.

Comptes de démo (un par rôle) : `super.admin@`, `admin.infra@`, `medecin@`, `pharmacien@`, `laborantin@`, `assurance@`, `patient@` + `demo.samadokita.test`.
L'espace admin est sur `/admin` (compte super.admin).

## Limites connues
- Modules santé (dossier, rendez-vous, ordonnances...) : pas encore développés. Les tableaux de bord affichent « bientôt disponible ».
- Pas encore : double authentification, cache Redis, files BullMQ, paiements, mode hors-ligne.
- Le schéma est créé par `prisma db push` (pas de migrations versionnées).
- Photos : nécessitent un stockage S3 (variables `S3_*`). Sans cela, l'envoi de photos affiche une erreur claire.
- Aucun test de charge n'a été exécuté : aucune performance n'est garantie.
