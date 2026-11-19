# Corrections Front YMeal

Corrections apportées dans cette archive :
- Le lien « Mot de passe oublié » pointe vers la route existante `/mot-de-passe`.
- Traduction d'affichage de la difficulté des recettes en français, y compris sur l'accueil et le détail.
- Image de remplacement pour les recettes sans URL d'image.
- Ingrédients de base disponibles dans le Frigo (tomate, oignon, ail, œufs, riz, pâtes, pomme de terre). Ceux qui ne sont pas référencés par l'API sont stockés localement.
- La validation du nom/quantité du Frigo s'affiche dans le modal plutôt que derrière celui-ci.
- Le message de debug contenant des informations de session n'est plus affiché dans le profil.
- Limite de 10 ingrédients à éviter dans le profil.
- Renforcement de l'empilement des suggestions de ville.
- Libellés des onglets explicitement activés.
- Repli SPA pour le rafraîchissement des routes web (`serve -s`, `vercel.json`, `public/_redirects`).

À vérifier avec le backend :
- La réinitialisation du mot de passe : l'écran est accessible, mais aucun endpoint de réinitialisation n'est défini dans le code backend fourni ici. Le formulaire ne peut pas envoyer un vrai email tant que cet endpoint n'est pas confirmé.
- Le générateur IA : l'application appelle `POST /admin/recipes/generate` et récupère un jeton CSRF. Le ZIP ne contient pas le backend, donc l'erreur API ne peut pas être diagnostiquée/corrigée de façon fiable côté serveur.
- Le sixième style de cuisine : les options viennent de `/admin/cuisines`; il faut ajouter une sixième entrée à la source de données du backend pour pouvoir la sauvegarder correctement (ne pas créer une option locale sans identifiant serveur).
- Les ingrédients ajoutés uniquement localement au Frigo ne sont pas transmis à l'API du générateur si celui-ci ne lit que l'inventaire serveur.

Sécurité : le fichier `.env`, les métadonnées Git, le cache Expo et `node_modules` ne sont pas inclus dans cette archive. Recréez votre `.env` localement et ne partagez pas ses secrets.
