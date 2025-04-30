// index.ts
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Créer le serveur MCP
const server = new McpServer({
  name: "mcp-recherche-entreprises",
  version: "1.0.0"
});

// Ajouter l'outil de recherche d'entreprise
server.tool(
  "rechercher_entreprise",
  {
    q: z.string().describe("Termes de la recherche (dénomination et/ou adresse, dirigeants, élus)"),
    activite_principale: z.string().optional().describe("Code NAF ou code APE"),
    categorie_entreprise: z.enum(["PME", "ETI", "GE"]).optional(),
    code_postal: z.string().optional(),
    departement: z.string().optional(),
    region: z.string().optional(),
    est_association: z.boolean().optional(),
    est_entrepreneur_individuel: z.boolean().optional(),
    est_ess: z.boolean().optional(),
    est_service_public: z.boolean().optional(),
    page: z.number().default(1),
    per_page: z.number().min(1).max(25).default(10)
  },
  async (params) => {
    const searchParams = new URLSearchParams();
    
    // Ajouter les paramètres non-nuls
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const url = `https://recherche-entreprises.api.gouv.fr/search?${searchParams.toString()}`;
    console.log("URL appelée:", url); // Pour le débogage
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) throw new Error(`Erreur API: ${res.statusText}`);
    const data = await res.json();

    const resultats = (data.results || []).map((e: any) => ({
      nom: e.nom_raison_sociale || e.nom_complet,
      siren: e.siren,
      siret: e.siret,
      siege: e.etablissement_siege?.adresse_ligne_1,
      activite_principale: e.activite_principale,
      categorie_entreprise: e.categorie_entreprise,
      effectif: e.tranche_effectif_salarie,
      etat_administratif: e.etat_administratif
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(resultats, null, 2),
        },
      ],
    };
  }
);

// Démarrer le transport stdio
const transport = new StdioServerTransport();
server.connect(transport).catch((error) => {
  console.error("Erreur lors de la connexion du serveur:", error);
  process.exit(1);
});
