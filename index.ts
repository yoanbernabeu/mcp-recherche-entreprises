#!/usr/bin/env tsx
// index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/**
 * Serveur MCP pour l'API Recherche d'entreprises
 * Cette implémentation permet d'interroger l'API Recherche d'entreprises (https://recherche-entreprises.api.gouv.fr)
 * pour obtenir des informations sur les entreprises françaises.
 */
const server = new McpServer({
  name: "mcp-recherche-entreprises",
  version: "1.0.0"
});

interface McpResponse {
  [key: string]: unknown;
  content: {
    type: "text";
    text: string;
  }[];
  _meta?: {
    [key: string]: unknown;
  };
  isError?: boolean;
}

/**
 * Formate les résultats de l'API en un format standardisé
 * @param data Les données brutes de l'API
 * @returns Les données formatées
 */
const formatResults = (data: any): McpResponse => {
  const resultats = (data.results || []).map((e: any) => {
    // Construction de l'objet de base avec les champs obligatoires
    const resultat: any = {
      nom: e.nom_raison_sociale || e.nom_complet || null,
      siren: e.siren || null,
      sigle: e.sigle || null
    };

    // Ajout des informations du siège social
    if (e.siege) {
      resultat.siege = {
        siret: e.siege.siret || null,
        adresse: e.siege.adresse || null,
        code_postal: e.siege.code_postal || null,
        commune: e.siege.commune || null,
        departement: e.siege.departement || null,
        region: e.siege.region || null,
        epci: e.siege.epci || null,
        geo_id: e.siege.geo_id || null,
        latitude: e.siege.latitude || null,
        longitude: e.siege.longitude || null,
        activite_principale: e.siege.activite_principale || null,
        tranche_effectif_salarie: e.siege.tranche_effectif_salarie || null,
        date_creation: e.siege.date_creation || null,
        date_fermeture: e.siege.date_fermeture || null,
        etat_administratif: e.siege.etat_administratif || null,
        est_siege: e.siege.est_siege || true,
        liste_idcc: e.siege.liste_idcc || [],
        liste_rge: e.siege.liste_rge || [],
        liste_finess: e.siege.liste_finess || [],
        liste_uai: e.siege.liste_uai || [],
        liste_id_bio: e.siege.liste_id_bio || []
      };
    }

    // Ajout des informations administratives
    resultat.activite_principale = e.activite_principale || null;
    resultat.section_activite_principale = e.section_activite_principale || null;
    resultat.categorie_entreprise = e.categorie_entreprise || null;
    resultat.nature_juridique = e.nature_juridique || null;
    resultat.etat_administratif = e.etat_administratif || null;
    resultat.date_creation = e.date_creation || null;
    resultat.date_fermeture = e.date_fermeture || null;
    resultat.date_mise_a_jour = e.date_mise_a_jour || null;
    resultat.tranche_effectif_salarie = e.tranche_effectif_salarie || null;
    resultat.annee_tranche_effectif_salarie = e.annee_tranche_effectif_salarie || null;
    resultat.caractere_employeur = e.caractere_employeur || null;
    resultat.nombre_etablissements = e.nombre_etablissements || 0;
    resultat.nombre_etablissements_ouverts = e.nombre_etablissements_ouverts || 0;

    // Ajout des dirigeants et élus
    if (e.dirigeants && e.dirigeants.length > 0) {
      resultat.dirigeants = e.dirigeants.map((d: any) => ({
        type_dirigeant: d.type_dirigeant || null,
        nom: d.nom || null,
        prenoms: d.prenoms || null,
        annee_de_naissance: d.annee_de_naissance || null,
        date_de_naissance: d.date_de_naissance || null,
        qualite: d.qualite || null,
        nationalite: d.nationalite || null,
        siren: d.siren || null,
        denomination: d.denomination || null
      }));
    }

    // Ajout des compléments
    if (e.complements) {
      resultat.complements = e.complements;
    }

    // Ajout des données financières
    if (e.finances) {
      resultat.finances = e.finances;
    }

    // Ajout des établissements associés
    if (e.matching_etablissements && e.matching_etablissements.length > 0) {
      resultat.matching_etablissements = e.matching_etablissements.map((etab: any) => ({
        siret: etab.siret || null,
        adresse: etab.adresse || null,
        code_postal: etab.code_postal || null,
        commune: etab.commune || null,
        departement: etab.departement || null,
        region: etab.region || null,
        epci: etab.epci || null,
        est_siege: etab.est_siege || false,
        ancien_siege: etab.ancien_siege || false,
        etat_administratif: etab.etat_administratif || null,
        activite_principale: etab.activite_principale || null,
        tranche_effectif_salarie: etab.tranche_effectif_salarie || null,
        date_creation: etab.date_creation || null,
        date_fermeture: etab.date_fermeture || null,
        liste_enseignes: etab.liste_enseignes || [],
        liste_idcc: etab.liste_idcc || [],
        liste_rge: etab.liste_rge || [],
        liste_finess: etab.liste_finess || [],
        liste_uai: etab.liste_uai || [],
        liste_id_bio: etab.liste_id_bio || [],
        latitude: etab.latitude || null,
        longitude: etab.longitude || null
      }));
    }

    return resultat;
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          resultats,
          total_results: data.total_results || 0,
          page: data.page || 1,
          per_page: data.per_page || 10,
          total_pages: data.total_pages || 0
        }, null, 2),
      },
    ],
  };
};

/**
 * Outil de recherche d'entreprise
 * Permet de rechercher des entreprises selon différents critères :
 * - Recherche textuelle (nom, adresse, dirigeants)
 * - Filtres administratifs (catégorie, statut, etc.)
 * - Filtres géographiques (code postal, département, région)
 * - Filtres sectoriels (activité, nature juridique)
 */
server.tool(
  "rechercher_entreprise",
  {
    // Paramètres de recherche principaux
    q: z.string().describe("Termes de la recherche (dénomination et/ou adresse, dirigeants, élus)"),
    
    // Filtres d'activité
    activite_principale: z.string().optional().describe("Code NAF ou code APE"),
    section_activite_principale: z.string().optional().describe("Section de l'activité principale (A à U)"),
    
    // Filtres administratifs
    categorie_entreprise: z.enum(["PME", "ETI", "GE"]).optional(),
    nature_juridique: z.string().optional().describe("Catégorie juridique de l'unité légale"),
    etat_administratif: z.enum(["A", "C"]).optional().describe("État administratif (A: Active, C: Cessée)"),
    tranche_effectif_salarie: z.string().optional().describe("Tranche d'effectif salarié"),
    
    // Filtres géographiques
    code_postal: z.string().optional(),
    code_commune: z.string().optional().describe("Code commune INSEE en 5 caractères"),
    departement: z.string().optional(),
    region: z.string().optional(),
    epci: z.string().optional().describe("Code EPCI (établissement public de coopération intercommunale)"),
    
    // Filtres de statut spécifique
    est_association: z.boolean().optional(),
    est_entrepreneur_individuel: z.boolean().optional(),
    est_ess: z.boolean().optional(),
    est_service_public: z.boolean().optional(),
    est_bio: z.boolean().optional().describe("Entreprise ayant un établissement certifié bio"),
    est_rge: z.boolean().optional().describe("Entreprise RGE (Reconnue Garante de l'Environnement)"),
    est_finess: z.boolean().optional().describe("Entreprise ayant un établissement FINESS"),
    est_qualiopi: z.boolean().optional().describe("Entreprise certifiée Qualiopi"),
    est_societe_mission: z.boolean().optional().describe("Société à mission"),
    
    // Filtres sur les personnes
    nom_personne: z.string().optional().describe("Nom d'un dirigeant ou élu"),
    prenoms_personne: z.string().optional().describe("Prénom(s) d'un dirigeant ou élu"),
    type_personne: z.enum(["dirigeant", "elu"]).optional(),
    
    // Filtres financiers
    ca_min: z.number().optional().describe("Chiffre d'affaires minimum"),
    ca_max: z.number().optional().describe("Chiffre d'affaires maximum"),
    resultat_net_min: z.number().optional().describe("Résultat net minimum"),
    resultat_net_max: z.number().optional().describe("Résultat net maximum"),
    
    // Paramètres de pagination et d'affichage
    page: z.number().default(1),
    per_page: z.number().min(1).max(25).default(10),
    minimal: z.boolean().optional().describe("Retourne une réponse minimale"),
    include: z.string().optional().describe("Champs à inclure avec minimal=true (complements,dirigeants,finances,matching_etablissements,siege,score)")
  },
  async (params) => {
    const searchParams = new URLSearchParams();
    
    // Ajouter les paramètres non-nuls à l'URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const url = `https://recherche-entreprises.api.gouv.fr/search?${searchParams.toString()}`;
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`Erreur API: ${errorData.message || res.statusText}`);
    }

    const data = await res.json();
    return formatResults(data);
  }
);

/**
 * Outil de recherche géographique
 * Permet de rechercher des entreprises autour d'un point géographique selon différents critères :
 * - Coordonnées (latitude, longitude)
 * - Rayon de recherche
 * - Filtres d'activité
 */
server.tool(
  "rechercher_entreprise_geographiques",
  {
    // Paramètres de géolocalisation
    lat: z.number().describe("Latitude du point de recherche"),
    long: z.number().describe("Longitude du point de recherche"),
    radius: z.number().optional().default(5).describe("Rayon de recherche en km (max 50km)"),
    
    // Filtres d'activité
    activite_principale: z.string().optional().describe("Code NAF ou code APE"),
    section_activite_principale: z.string().optional().describe("Section de l'activité principale (A à U)"),
    
    // Paramètres de pagination et d'affichage
    page: z.number().default(1),
    per_page: z.number().min(1).max(25).default(10),
    minimal: z.boolean().optional().describe("Retourne une réponse minimale"),
    include: z.string().optional().describe("Champs à inclure avec minimal=true (complements,dirigeants,finances,matching_etablissements,siege,score)")
  },
  async (params) => {
    const searchParams = new URLSearchParams();
    
    // Ajouter les paramètres non-nuls à l'URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const url = `https://recherche-entreprises.api.gouv.fr/near_point?${searchParams.toString()}`;
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(`Erreur API: ${errorData.message || res.statusText}`);
    }

    const data = await res.json();
    return formatResults(data);
  }
);

// Démarrer le transport stdio
const transport = new StdioServerTransport();

// Gestion des erreurs et de la fermeture
let isShuttingDown = false;
let isConnected = false;

const shutdown = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  process.exit(0);
};

// Connexion au transport avec gestion des erreurs
server.connect(transport)
  .then(() => {
    isConnected = true;
  })
  .catch(() => {
    process.exit(1);
  });

// Vérification périodique de la connexion
const connectionCheck = setInterval(() => {
  if (!isConnected && !isShuttingDown) {
    shutdown();
  }
}, 5000);

// Gestion des signaux
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

// Gestion des erreurs non capturées
process.on('uncaughtException', () => {
  shutdown();
});

process.on('unhandledRejection', () => {
  shutdown();
});

// Nettoyage à la fermeture
process.on('exit', () => {
  clearInterval(connectionCheck);
});
