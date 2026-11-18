# Inscription depuis localhost : diagnostic CORS

## Cause vérifiée

Le front est ouvert sur `http://localhost:8081/register`. Son origine est **`http://localhost:8081`**, sans le chemin `/register`.

Sa configuration `EXPO_PUBLIC_API_URL` pointe vers `https://ymeal-back.osc-fr1.scalingo.io`. Des requêtes `OPTIONS` de contrôle ont été envoyées à `/admin/auth/register`, avec la méthode demandée `POST` et l’en-tête demandé `content-type`. Aucun compte n’a été créé pendant ce contrôle.

| Origine testée | Statut OPTIONS | Access-Control-Allow-Origin | Access-Control-Allow-Credentials |
| --- | --- | --- | --- |
| `http://localhost:8081` | 200 | Absent | `true` |
| `https://frontmeal.osc-fr1.scalingo.io` | 200 | `https://frontmeal.osc-fr1.scalingo.io` | `true` |

Le serveur annonce déjà les méthodes `GET, POST, PATCH, PUT, DELETE, OPTIONS` et les en-têtes `content-type, x-csrf-token, authorization`. Le blocage observé pour localhost vient donc de l’autorisation d’origine manquante.

Un statut 200 sur OPTIONS ne suffit pas : sans l’autorisation de l’origine, le navigateur bloque l’échange et JavaScript reçoit une erreur réseau. Ce statut ne prouve pas que l’inscription a réussi. Voir la [documentation MDN sur cet en-tête manquant](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSMissingAllowOrigin).

## Action à coordonner avec le backend

Le document `Fix/securite` distingue la production et le développement. Pour travailler depuis localhost, deux configurations conviennent :

1. Fournir au front l’URL d’une API de développement qui autorise `http://localhost:8081`, puis régler `EXPO_PUBLIC_API_URL` sur cette URL et redémarrer Expo.
2. Autoriser cette origine dans la configuration CORS du backend utilisé pour les tests locaux, selon la politique de l’équipe.

Pour une origine autorisée, les réponses OPTIONS et les réponses réelles, y compris les erreurs HTTP, doivent notamment fournir :

```http
Access-Control-Allow-Origin: http://localhost:8081
Access-Control-Allow-Credentials: true
Vary: Origin
```

Avec les cookies, `Access-Control-Allow-Origin: *` ne convient pas. Voir [MDN : requêtes CORS avec cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#requests_with_credentials).

Commande de reproduction sous PowerShell :

```powershell
curl.exe -i -X OPTIONS -H "Origin: http://localhost:8081" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type" https://ymeal-back.osc-fr1.scalingo.io/admin/auth/register
```

L’API de développement n’étant pas encore identifiée, la variable d’environnement n’a pas été remplacée par une URL supposée. Le front ne peut pas ajouter une autorisation CORS à la réponse du serveur.

## Corrections front réalisées dans ce périmètre

- Mot de passe d’inscription : 12 caractères minimum, affichage et validation alignés sur le document. Les autres critères existants sont conservés.
- Prénom et nom : 45 caractères maximum dans les champs et dans la validation.
- Les identifiants utilisateur ne sont plus envoyés dans les en-têtes `Bearer` ou `X-User-Id`. Le jeton réel est transmis par `Authorization: Bearer <token>` via le client API.
- Le client API inclut les cookies par défaut. La modification du compte transmet également son jeton réel, en plus du CSRF existant.
- Une panne réseau ou un blocage CORS affiche un message français lisible. Le client ne prétend pas distinguer ces causes, que le navigateur masque à JavaScript, et ne rejoue pas automatiquement une inscription.
- Les réponses HTTP 400 et 422 d’inscription affichent un message de formulaire neutre.

Ce diagnostic porte sur l’inscription et le transport des requêtes. Les autres changements du document backend, notamment le traitement global du 401, les nouveaux formulaires `current_password`, le renouvellement CSRF et le compte à rebours `Retry-After`, restent à intégrer dans leur périmètre respectif.

## Validation

Les tests automatisés vérifient les règles de formulaire, les jetons imbriqués dans `data.token`, les cookies, les en-têtes réels, la conservation des statuts HTTP, le message réseau et l’absence de nouvelle tentative automatique. Les contrôles d’interface utilisent des API simulées ; la réussite d’une inscription réelle depuis localhost reste conditionnée à une configuration CORS autorisant cette origine.
