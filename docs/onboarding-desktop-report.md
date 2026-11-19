# Personnalisation du profil : adaptation desktop

## Périmètre et fichiers

Les neuf écrans partagent le même cadre : accueil, sept questions et confirmation. Les changements visuels utilisent exclusivement la condition desktop existante : `Platform.OS === "web" && width > 900`. Jusqu’à 900 px inclus, le titre, le badge, le bouton Retour, la barre de 8 px et les styles des cartes conservent leur présentation antérieure. Les styles natifs ne sont pas modifiés.

| Fichier | Intervention |
| --- | --- |
| `app/config-profil/index.tsx` | Intégration commune aux neuf écrans, Retour dans la carte sur desktop, dimensions desktop et initialisation compatible avec l’export web statique. |
| `components/profil/StepHeader.tsx` | Titre desktop centré et agrandi ; badge et Retour à leur emplacement habituel sur mobile. |
| `components/profil/StepBackButton.tsx` | Bouton partagé conservant la flèche, le texte et le gestionnaire de navigation existants. |
| `components/profil/ProgressBar.tsx` | Présentations mobile et desktop séparées ; pourcentage, compteur, animation et accessibilité sur desktop. |
| `components/profil/ProfilCard.tsx` | Identifiant de test de la carte, sans effet visuel. |
| `src/lib/profile-progress.ts` | Calcul commun de la progression et du numéro affiché. |
| `tests/profile-progress.test.cjs` | Vérification du calcul, des limites et d’un nombre différent d’étapes. |
| `docs/onboarding-desktop-report.md` | Ce compte rendu. |

## Présentation desktop

- Titre de 28 px / interligne de 36 px, contre 24 / 32 auparavant sur desktop. La typographie, la graisse et la couleur sont conservées. Il est centré indépendamment du Retour et du compteur.
- Retour en haut à gauche dans la carte blanche, avec les mêmes marges internes de 32 px que le reste du contenu et une cible d’au moins 44 px de haut. L’accueil ne contient pas de bouton Retour, comme auparavant.
- Cartes de largeur maximale 800 px et de hauteur minimale 760 px, pouvant grandir avec le contenu et la hauteur disponible. Les questions restent limitées à 600 px de largeur ; les actions restent centrées. Le défilement vertical existant permet de conserver l’accès au contenu sur un écran moins haut.
- Barre toujours placée entre le titre et la carte, de hauteur 32 px sur desktop. Le compteur occupe un emplacement distinct à droite, séparé de la piste par 16 px.
- Pourcentage centré dans le remplissage orange, en texte foncé pour conserver un contraste lisible. Lorsque le remplissage fait moins de 56 px de large, le texte est placé juste à sa droite dans la piste : notamment à 0 %, il reste visible et ne déborde pas.

## Calcul, animation et navigation

`getProfileProgress(step, totalSteps)` utilise le nombre réel d’étapes fourni par l’écran (`TOTAL_STEPS`, actuellement 7). Le numéro affiché est borné entre zéro et ce total. Le ratio est `numéro / total` et le pourcentage cible est son arrondi multiplié par 100. La confirmation interne à l’indice 8 reste donc affichée à **7/7 et 100 %**.

Sur desktop, une même valeur `Animated.Value` pilote la largeur et le pourcentage visible. La transition dure 400 ms, avec accélération et ralentissement progressifs, à l’aller comme au retour. Les navigations successives interrompent proprement la transition précédente. `AccessibilityInfo` lit et surveille `prefers-reduced-motion` sur le web : si cette préférence est active, la valeur finale est appliquée immédiatement. La barre expose également son rôle et ses valeurs ARIA.

L’export statique commence sans dimensions de fenêtre ni paramètres de recherche. Le premier rendu navigateur correspond désormais à ce rendu initial ; l’étape demandée et la disposition desktop sont appliquées après l’hydratation. Cela évite une divergence HTML lors d’une arrivée directe sur une étape. Les gestionnaires de navigation, règles de validation, réponses et sauvegardes restent inchangés.

## Vérifications effectuées

| Vérification | Résultat |
| --- | --- |
| Desktop : 1024, 1280, 1440 et 1920 px | Neuf écrans contrôlés à chaque largeur, avec référentiels et préférences simulés : titre centré, Retour dans la carte, dimensions cohérentes, pourcentage centré, compteur unique et aucun débordement horizontal. |
| Mobile et tablette : 390, 768 et 900 px | Comparaison avant/après des neuf écrans dans le scénario de repli des données, puis contrôle des neuf écrans avec données chargées à chaque largeur. Présentation conservée et aucun débordement horizontal. |
| Comparaison des captures | Dimensions identiques ; aucune différence au-delà de 1/255 par canal, tolérance limitée aux arrondis de rendu des bordures. Les styles mobiles sont conservés. |
| Navigation et animation | Mesure des largeurs intermédiaires à chaque frame à l’aller et au retour ; pourcentage synchronisé ; préférence de réduction des mouvements modifiée en cours de session et respectée. |
| Réponses et confirmation | Sélection conservée après un aller-retour ; étape finale à 7/7 et 100 % ; retour de la confirmation vers la dernière question. |
| Rendu initial web | Aucune erreur JavaScript ou d’hydratation sur les écrans contrôlés. |
| `npm test` | 30 tests réussis, dont deux nouveaux sur la progression. |
| `npm run build` | Export web Expo réussi. |
| `npm run lint` | Aucune erreur ; 22 avertissements déjà présents dans le projet. |
| TypeScript | Aucun diagnostic avec l’adaptation en mémoire de `module: preserve` vers `esnext` nécessaire au TypeScript 5.3 installé. Aucune configuration ou dépendance modifiée pour ce contrôle. |
| `git diff --check` | Aucune erreur d’espacement. |

Les contrôles visuels utilisent Chromium headless à une hauteur de fenêtre de 1000 px. Les scripts, captures et mesures locaux sont conservés sous `.expo/onboarding-qa/`, `.expo/qa-onboarding.cjs` et `.expo/qa-profile-animation.cjs`, répertoires ignorés par Git. Les références API et la session des tests sont simulées ; aucune préférence de compte réel n’est modifiée. Aucun test sur appareil natif physique n’a été exécuté.
