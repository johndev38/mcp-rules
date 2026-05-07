# Règles de Codage CDA Vérifiables

Ce document liste les règles et préconisations du standard de codage CDA vérifiées par le serveur.

```json rulepack
{
  "id": "cda-coding",
  "title": "Règles de Codage CDA Vérifiables",
  "version": "1.0.0",
  "rules": [
    {
      "id": "R2",
      "title": "Pas de saut amont",
      "description": "GOTO/JUMP vers une étiquette précédente interdit.",
      "severity": "error",
      "type": "forbidden_upstream_jump",
      "enabled": true
    },
    {
      "id": "R4",
      "title": "Commentaire du module type dans le bloc d'appel",
      "severity": "warning",
      "type": "module_type_comment_in_call_block",
      "enabled": true
    },
    {
      "id": "R5",
      "title": "Variable d'activation pour blocs d'entrée, sortie et forçage",
      "severity": "warning",
      "type": "activation_guard",
      "enabled": true
    },
    {
      "id": "R6",
      "title": "Bloc localisé dans un module fonctionnel hors Main/OB1",
      "severity": "info",
      "type": "module_localization_naming",
      "enabled": true
    },
    {
      "id": "R13",
      "title": "Indentation et une instruction par ligne",
      "severity": "warning",
      "type": "indentation_and_one_instruction_per_line",
      "enabled": true
    },
    {
      "id": "R18",
      "title": "Instance DB de FB appelée une seule fois",
      "severity": "error",
      "type": "single_fb_instance_call",
      "enabled": true
    },
    {
      "id": "P4",
      "title": "Accès indexé borné",
      "severity": "warning",
      "type": "indexed_access_requires_bounds",
      "enabled": true
    },
    {
      "id": "P9",
      "title": "Pas de SET/RESET",
      "severity": "warning",
      "type": "forbidden_set_reset",
      "enabled": true
    }
  ]
}
```
