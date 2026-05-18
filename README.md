# JOBO CV Backend

Backend Vercel pour l'extraction de CV par IA.

## Déploiement

1. Push ce dossier sur GitHub
2. Connecte le repo sur vercel.com
3. Ajoute la variable d'environnement : ANTHROPIC_API_KEY=ta_cle_api
4. Deploy !

## Endpoint

POST /api/extract-cv
Body: { fileData: "base64...", fileType: "application/pdf" }
