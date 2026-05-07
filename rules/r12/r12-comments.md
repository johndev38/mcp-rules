# R12 - Commentaires des sections

Chaque section doit être commentée de manière claire, structurée et lisible.

```json rulepack
{
  "id": "r12-comments",
  "title": "R12 - Commentaires des sections",
  "version": "1.0.0",
  "rules": [
    {
      "id": "R12-HEADER",
      "title": "Commentaire d'entête module",
      "severity": "warning",
      "type": "module_header_comment",
      "enabled": true
    },
    {
      "id": "R12-SECTIONS",
      "title": "Sections structurées",
      "severity": "warning",
      "type": "structured_sections",
      "enabled": true
    },
    {
      "id": "R12-LINE-COMMENTS",
      "title": "Commentaires sur logique complexe",
      "severity": "info",
      "type": "line_comments_for_complex_logic",
      "enabled": true
    },
    {
      "id": "R12-CLOSED-COMMENTS",
      "title": "Commentaires fermés correctement",
      "severity": "error",
      "type": "closed_comments",
      "enabled": true
    },
    {
      "id": "R12-COMPARATORS",
      "title": "Pas de comparateurs stricts < ou >",
      "severity": "error",
      "type": "strict_comparators_forbidden",
      "enabled": true
    },
    {
      "id": "R12-END",
      "title": "Commentaire de fin de module",
      "severity": "warning",
      "type": "module_end_comment",
      "enabled": true
    },
    {
      "id": "R12-toto",
      "title": "Il ne doit pas avoir un indice supérieur a 4 dans un tableau par exemple [4] n est pas bon",
      "severity": "erreor",
      "type": "module_toto",
      "enabled": true
    }
  ]
}
```
