# Rapport SCL

Total anomalies: **9**

## C:\Users\jp4b40el\projects\mcp_server\mcp-scl-rules-packaged\samples\10_SYSTEME.scl.txt

- **WARNING** R5 — Aucun IF/THEN d'activation clair détecté pour conditionner la logique principale.
  - Ligne 7, colonne 1
  - Extrait: `BEGIN`
  - Confiance: low

## C:\Users\jp4b40el\projects\mcp_server\mcp-scl-rules-packaged\samples\10_SYSTEME_01_ACTIV.scl.txt

- **WARNING** R4 — Le bloc d'appel du module type doit contenir le commentaire du module type.
  - Ligne 4, colonne 1
  - Extrait: `BEGIN`
  - Confiance: medium
- **WARNING** R5 — Aucun IF/THEN d'activation clair détecté pour conditionner la logique principale.
  - Ligne 4, colonne 1
  - Extrait: `BEGIN`
  - Confiance: low

## C:\Users\jp4b40el\projects\mcp_server\mcp-scl-rules-packaged\samples\10_SYSTEME_02_PARAM.scl.txt

Aucune anomalie.

## C:\Users\jp4b40el\projects\mcp_server\mcp-scl-rules-packaged\samples\10_SYSTEME_03_INIT.scl.txt

- **INFO** R12-LINE-COMMENTS — Logique non triviale sans commentaire proche.
  - Ligne 48, colonne 43
  - Extrait: `- les modules standards "Modbus_Serveur"`
  - Confiance: low

## C:\Users\jp4b40el\projects\mcp_server\mcp-scl-rules-packaged\samples\10_SYSTEME_08_GESTION_CHAUFFAGE.scl.txt

- **ERROR** R12-COMPARATORS — Utiliser <= ou >=, pas < ou > seuls.
  - Ligne 25, colonne 21
  - Extrait: `Q > #sDfExtMsTmpArm);`
  - Confiance: high
- **ERROR** R12-COMPARATORS — Utiliser <= ou >=, pas < ou > seuls.
  - Ligne 49, colonne 49
  - Extrait: `"EC".ssOrdAcChfArm := (("SPRV".EC_mMsFinTmpArm < "EC".mSeAcChfArm) // Activation si franchissement de seuil`
  - Confiance: high
- **ERROR** R12-COMPARATORS — Utiliser <= ou >=, pas < ou > seuls.
  - Ligne 50, colonne 52
  - Extrait: `OR ("EC".ssOrdAcChfArm AND "SPRV".EC_mMsFinTmpArm < ("EC".mSeAcChfArm + "EC".mHysNAcChfArm))) // Maintien avec l'hystérésis`
  - Confiance: high

## C:\Users\jp4b40el\projects\mcp_server\mcp-scl-rules-packaged\samples\CONF_MATERIEL.scl.txt

- **INFO** R12-LINE-COMMENTS — Logique non triviale sans commentaire proche.
  - Ligne 8, colonne 99

- **WARNING** R5 — Aucun IF/THEN d'activation clair détecté pour conditionner la logique principale.
  - Ligne 5, colonne 1
  - Extrait: `BEGIN`
  - Confiance: low
