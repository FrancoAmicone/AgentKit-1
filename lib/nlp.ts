import type { ListingFilters } from "./listings-data";

/**
 * Parses natural language into listing filters.
 * Uses a lightweight rules parser by default; if OPENAI_API_KEY or
 * ANTHROPIC_API_KEY is set, tries the LLM first and falls back to rules.
 */
export async function parseSearchQuery(query: string): Promise<{
  filters: ListingFilters;
  explanation: string;
  source: "llm" | "rules";
}> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      filters: {},
      explanation: "Búsqueda vacía — mostrando disponibles.",
      source: "rules",
    };
  }

  if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) {
    try {
      const llm = await parseWithLlm(trimmed);
      if (llm) return { ...llm, source: "llm" };
    } catch {
      // fall through to rules
    }
  }

  return { ...parseWithRules(trimmed), source: "rules" };
}

function parseWithRules(query: string): {
  filters: ListingFilters;
  explanation: string;
} {
  const lower = query.toLowerCase();
  const filters: ListingFilters = {};

  const knownPlaces = [
    "bariloche",
    "mendoza",
    "ushuaia",
    "salta",
    "pinamar",
    "córdoba",
    "cordoba",
    "buenos aires",
    "palermo",
    "iguazú",
    "iguazu",
    "misiones",
  ];
  const foundPlace = knownPlaces.find((p) => lower.includes(p));
  if (foundPlace) {
    filters.destino = foundPlace.replace("cordoba", "córdoba").replace("iguazu", "iguazú");
  } else {
    // crude: take words after "en "
    const m = lower.match(/\ben\s+([a-záéíóúñ\s]+?)(?:,| con | menos | bajo |\$|$)/i);
    if (m?.[1]) filters.destino = m[1].trim();
  }

  const priceMatch =
    lower.match(/(?:menos de|bajo|max(?:imo)?|hasta)\s*\$?\s*(\d+)/i) ||
    lower.match(/\$\s*(\d+)/);
  if (priceMatch) filters.precioMax = Number(priceMatch[1]);

  const amenityMap: Record<string, string> = {
    pileta: "pileta",
    piscina: "pileta",
    wifi: "wifi",
    cochera: "cochera",
    estacionamiento: "estacionamiento",
    parrilla: "parrilla",
    aire: "aire",
    cocina: "cocina",
    jardin: "jardin",
    jardín: "jardin",
    vista: "vista",
    chimenea: "chimenea",
    desayuno: "desayuno",
  };
  const amenities = Object.entries(amenityMap)
    .filter(([key]) => lower.includes(key))
    .map(([, value]) => value);
  if (amenities.length) filters.amenities = [...new Set(amenities)];

  const parts: string[] = [];
  if (filters.destino) parts.push(`destino “${filters.destino}”`);
  if (filters.precioMax) parts.push(`hasta $${filters.precioMax}/noche`);
  if (filters.amenities?.length) parts.push(`con ${filters.amenities.join(", ")}`);

  return {
    filters,
    explanation: parts.length
      ? `Busqué por ${parts.join(", ")}.`
      : `No detecté filtros claros; te muestro lo disponible.`,
  };
}

async function parseWithLlm(query: string): Promise<{
  filters: ListingFilters;
  explanation: string;
} | null> {
  const system = `Convertí el pedido de alojamiento a JSON con esta forma exacta:
{"destino": string|null, "precioMax": number|null, "amenities": string[], "explanation": string}
amenities posibles: pileta, wifi, cochera, estacionamiento, parrilla, aire, cocina, jardin, vista, chimenea, desayuno.
Respondé SOLO JSON válido.`;

  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: system },
          { role: "user", content: query },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return normalizeLlmJson(data.choices?.[0]?.message?.content);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-latest",
        max_tokens: 300,
        system,
        messages: [{ role: "user", content: query }],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = data.content?.find((c) => c.type === "text")?.text;
    return normalizeLlmJson(text);
  }

  return null;
}

function normalizeLlmJson(content?: string): {
  filters: ListingFilters;
  explanation: string;
} | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as {
      destino?: string | null;
      precioMax?: number | null;
      amenities?: string[];
      explanation?: string;
    };
    const filters: ListingFilters = {};
    if (parsed.destino) filters.destino = parsed.destino;
    if (typeof parsed.precioMax === "number") filters.precioMax = parsed.precioMax;
    if (parsed.amenities?.length) filters.amenities = parsed.amenities;
    return {
      filters,
      explanation: parsed.explanation || "Filtros interpretados por el agente.",
    };
  } catch {
    return null;
  }
}
