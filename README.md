# MCP Recherche d'entreprises

Ce MCP (Module de Connexion à une API) permet d'interagir avec l'API Recherche d'entreprises mise à disposition par data.gouv.fr.

## Description

L'API Recherche d'entreprises permet de rechercher et de trouver des entreprises françaises. Elle offre deux types de recherche :
- Recherche textuelle (dénomination, adresse, dirigeants et élus)
- Recherche géographique

## Fonctionnalités

Le MCP permet de :
- Rechercher des entreprises par différents critères
- Filtrer les résultats selon plusieurs paramètres
- Accéder aux informations essentielles des entreprises (dénomination, SIREN, SIRET, code NAF)
- Effectuer des recherches géographiques autour d'un point avec les paramètres suivants :
  - Latitude et longitude du point de recherche
  - Rayon de recherche (jusqu'à 50km)
  - Filtres d'activité (code NAF, section d'activité)
  - Pagination des résultats

## Source

Ce MCP est basé sur l'API officielle de data.gouv.fr :
[API Recherche d'entreprises](https://www.data.gouv.fr/fr/dataservices/api-recherche-dentreprises/)

## Limitations

L'API comporte certaines limitations :
- Ne donne pas accès aux prédécesseurs et successeurs d'un établissement
- Ne permet pas d'accéder aux entreprises non-diffusibles
- Ne permet pas d'accéder aux entreprises qui se sont vues refuser leur immatriculation au RCS
- Le rayon de recherche géographique est limité à 50km maximum

## Limites techniques

- Limite de 7 appels par seconde
- Disponibilité : 100% sur le mois dernier
- Accès : Ouvert à tous

## Utilisation

### Installation

```bash
npm install
```

### Build

Pour compiler le projet :
```bash
npm run build
```

Cette commande va :
- Compiler les fichiers TypeScript en JavaScript
- Les placer dans le dossier `dist/`
- Rendre les fichiers JavaScript exécutables

### Démarrage

Pour lancer le serveur MCP normalement :
```bash
npm start
```

Pour lancer le serveur avec l'Inspector MCP (recommandé pour le développement) :
```bash
npm run dev
```

L'Inspector MCP fournit une interface graphique pour tester et déboguer les requêtes MCP en temps réel.

## Ressources MCP pour les contributeurs

### Documentation officielle
- [Documentation MCP](https://modelcontextprotocol.io/docs)
- [Spécification MCP](https://modelcontextprotocol.io/spec)
- [Exemples de serveurs](https://modelcontextprotocol.io/examples)

### Outils de développement
- [SDK TypeScript MCP](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector) - Outil de débogage et d'analyse

### Bonnes pratiques
- Utiliser le SDK TypeScript pour l'implémentation
- Suivre les conventions de code du projet
- Implémenter une gestion d'erreur robuste
- Documenter clairement l'API
- Maintenir la compatibilité avec les versions futures

### Tests et débogage
- Utiliser l'Inspector pour le débogage
- Implémenter des tests unitaires
- Vérifier la conformité avec la spécification MCP
- Analyser les performances avec les outils appropriés

## Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Contribution

Les contributions sont les bienvenues ! Consultez notre [guide de contribution](CONTRIBUTING.md) pour plus d'informations sur la façon de contribuer à ce projet. 