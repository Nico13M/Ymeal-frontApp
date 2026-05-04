# Ymeal Front App - README equipe


## 1) Configuration API
Le front utilise `src/lib/api.ts`.

- Base URL via variable d'env:
  - `EXPO_PUBLIC_API_URL`
- Si non definie, fallback sur:
  - `https://ymeal-back.osc-fr1.scalingo.io`

Exemple `.env` local:
```bash
EXPO_PUBLIC_API_URL=https://ymeal-back.osc-fr1.scalingo.io
```

## 3) Parcours utilisateur actuel
1. Register:
   - appel `/admin/auth/register`
   - login auto si besoin
   - stockage session + infos compte en local
   - redirection `/configuration-profil`
2. Login:
   - appel `/admin/auth/login`
   - stockage session + infos compte en local
   - si config locale existe -> `/(tabs)`
   - sinon -> `/configuration-profil`
5. Configuration profil:
   - sauvegarde locale (AsyncStorage)
   - tentative de sync back (best effort)
   - redirection vers `/(tabs)` meme si sync back echoue
6. Profil:
   - affiche infos compte + config depuis AsyncStorage
   - bouton settings:
     - modifier configuration (retour vers `/configuration-profil`)
     - se deconnecter (clear session + clear storage + `/connexion`)

## 4) Endpoints back deja relies
### Auth
- `POST /admin/auth/register`
- `POST /admin/auth/login`

### Profil utilisateur / preferences
- `GET /admin/security/csrf-token`
- `POST /admin/recipes/user/data/send`

Notes:
- Le service `src/services/profile-config.ts` gere `X-CSRF-TOKEN`.
- S'il n'y a pas de vrai token session, la sync back echoue (normal), mais l'UX n'est plus bloquee.

## 5) Stockage local utilise
Cles `constants/storage.ts`:
- `accountProfile`
- `profileConfig`

Session auth:
- `@ymeal/session` (dans `src/services/auth.ts`)

## 8) Etat actuel par ecran
### Fait
- `onboarding.tsx`: flux visuel complet, navigation vers register.
- `register.tsx`: validations, erreurs utilisateur, appel API, login auto, redirection config.
- `connexion.tsx`: validations, erreurs, appel API, redirection conditionnelle.
- `configuration-profil.tsx`:
  - parcours multi-etapes,
  - pre-remplissage depuis config locale,
  - autocomplete ville,
  - sauvegarde locale + sync back non bloquante,
  - redirection vers tabs.
- `app/(tabs)/profile.tsx`:
  - affichage infos locales,
  - modal settings,
  - logout.

### A brancher
- `app/(tabs)/fridge.tsx`
- `app/(tabs)/recipes.tsx`: base UI locale (data constants), non branchee API.
- `app/recipe/[id].tsx`: details recette locales, non branche API.

## 10) Priorites recommandees (prochain sprint)
3. Brancher Frigo et Recettes sur les endpoints back reels.
4. Recuperer les infos profil depuis back (pas seulement AsyncStorage).


