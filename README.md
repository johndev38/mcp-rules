# mcp-scl-rules

Serveur MCP TypeScript pour analyser des fichiers SCL/TIA Portal avec des règles déclaratives.

## Objectif

- Générer un rapport sur les règles non respectées.
- Réduire les faux positifs.
- Permettre l'ajout de règles dans un répertoire contenant des fichiers `.md` ou `.rules.json`.
- Fonctionner avec Gemini 2.5 Pro via MCP.

## Installation

```bash
npm install
npm run build
```

## Analyse locale

```bash
npm run analyze:samples
```

ou :

```bash
node dist/cli.js analyze --input /chemin/vers/scl --rules rules --format markdown
node dist/cli.js analyze --input /chemin/vers/scl --rules rules --format json
node dist/cli.js analyze --input /chemin/vers/scl --rules rules --format json --output reports/analysis-report.json
```

Le rapport JSON inclut une section `verification` sur chaque finding : une seconde passe automatique tente de confirmer le signalement ou de le marquer comme `potential_false_positive`.

## Validation des règles

```bash
npm run validate:rules
```

## Configuration MCP Gemini

```json
{
  "mcpServers": {
    "scl-rules": {
      "command": "node",
      "args": ["/chemin/vers/mcp-scl-rules/dist/index.js"],
      "env": {
        "SCL_RULES_DIR": "/chemin/vers/mcp-scl-rules/rules"
      }
    }
  }
}
```

## Ajouter une règle

Créer un fichier `.md` dans `rules/mon-dossier/ma-regle.md` avec un bloc JSON :

````md
# Ma règle

```json rulepack
{
  "id": "mon-rulepack",
  "title": "Mes règles",
  "rules": [
    {
      "id": "X1",
      "title": "Titre",
      "severity": "warning",
      "type": "forbidden_token",
      "enabled": true,
      "params": {
        "tokens": ["TOKEN_INTERDIT"]
      }
    }
  ]
}
```
````

Les règles `.rules.json` sont aussi chargées directement.
