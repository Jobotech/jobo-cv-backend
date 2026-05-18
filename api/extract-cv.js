import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  try {
    const { fileData, fileType } = req.body;
    if (!fileData || !fileType) return res.status(400).json({ error: "Fichier manquant" });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = "Extrais toutes les informations de ce CV et retourne UNIQUEMENT un JSON valide (sans markdown, sans backticks) avec exactement ces champs: prenom, nom, poste, resume, email, telephone, competences (array de strings), langues (array de strings), interets (array de strings), experiences (array of {poste, entreprise, debut, fin, description}), formations (array of {diplome, ecole, annee}), references (string). Laisse vide si absent.";

    const isPdf = fileType === "application/pdf";
    const isImage = fileType.startsWith("image/");
    let messages = [];

    if (isPdf || isImage) {
      messages = [{
        role: "user",
        content: [
          { type: isPdf ? "document" : "image", source: { type: "base64", media_type: fileType, data: fileData } },
          { type: "text", text: prompt }
        ]
      }];
    } else {
      const textContent = Buffer.from(fileData, "base64").toString("utf-8");
      messages = [{ role: "user", content: prompt + "\n\nCV:\n" + textContent.substring(0, 8000) }];
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages
    });

    const rawText = response.content.filter(c => c.type === "text").map(c => c.text).join("");
    let extracted = {};
    try {
      extracted = JSON.parse(rawText.replace(/```json|```/g, "").trim());
    } catch (e) {
      return res.status(500).json({ error: "Impossible de lire le CV" });
    }

    return res.status(200).json({ success: true, data: extracted });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Erreur lors de l analyse du CV", details: error.message });
  }
}
