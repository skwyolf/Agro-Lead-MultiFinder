
import { GoogleGenAI } from "@google/genai";
import { Business, LocationCoords } from "../types";

export const suggestTranslation = async (query: string, country: string): Promise<string> => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Jesteś ekspertem od lokalizacji rynkowej i SEO. Użytkownik chce wyszukać firmy w kraju: ${country} używając polskiej frazy: "${query}".
  Twoim zadaniem jest zaproponowanie najbardziej profesjonalnego, lokalnego terminu branżowego w języku urzędowym kraju ${country}, który zwróci najlepsze wyniki w Google Maps i Google Search.
  Zwróć TYLKO i WYŁĄCZNIE zaproponowany termin (jedno lub dwa słowa), bez żadnego dodatkowego tekstu.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });
    return response.text?.trim() || query;
  } catch (error) {
    console.error("Błąd tłumaczenia:", error);
    return query;
  }
};

interface PlaceItem {
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
}

export const searchBusinesses = async (
  finalQuery: string,
  country: string,
  region: string,
  districts: string[],
  _coords?: LocationCoords
): Promise<{ businesses: Business[]; rawText: string }> => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || "";

  if (!apiKey) {
    console.error("Brak klucza API.");
    throw new Error("Brak skonfigurowanego klucza API.");
  }

  const allBusinesses: Business[] = [];
  const seenKeys = new Set<string>();

  const targetDistricts = districts.length > 0 ? districts : [""];
  let placesApiErrorOccurred = false;

  for (const district of targetDistricts) {
    const textQuery = district.trim()
      ? `${finalQuery} w ${district}, ${region}, ${country}`
      : `${finalQuery} w ${region}, ${country}`;

    try {
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri"
        },
        body: JSON.stringify({
          textQuery
        })
      });

      if (!response.ok) {
        placesApiErrorOccurred = true;
        const errText = await response.text();
        console.warn(`Places API zwróciło status ${response.status} dla "${textQuery}". Przełączanie na fallback Gemini...`, errText);
        break;
      }

      const data = await response.json();
      const places: PlaceItem[] = data.places || [];

      places.forEach((place, index) => {
        const name = place.displayName?.text;
        if (!name) return;

        const mapsUri = place.googleMapsUri;
        const address = place.formattedAddress;

        const uniqueKey = mapsUri || `${name.toLowerCase()}|${(address || "").toLowerCase()}`;
        if (seenKeys.has(uniqueKey)) {
          return;
        }
        seenKeys.add(uniqueKey);

        const website = place.websiteUri;
        const reviewsCount = place.userRatingCount || 0;
        const isHighPotential = Boolean(website && reviewsCount > 0);

        allBusinesses.push({
          id: `place-${seenKeys.size}-${index}`,
          name: name,
          website: website || undefined,
          phone: place.nationalPhoneNumber || undefined,
          address: address || undefined,
          rating: place.rating,
          reviewsCount: reviewsCount,
          mapsUri: mapsUri || undefined,
          status: isHighPotential ? "High Potential" : "Low Potential"
        });
      });
    } catch (error) {
      placesApiErrorOccurred = true;
      console.warn(`Błąd podczas odpytywania Places API dla "${textQuery}":`, error);
      break;
    }
  }

  // Jeśli Google Places API nie jest włączone lub nie zwróciło żadnych wyników, wykonaj wyszukiwanie przez Gemini z ugruntowaniem w Google Search
  if (placesApiErrorOccurred || allBusinesses.length === 0) {
    console.info("Uruchamianie wyszukiwania za pomocą Gemini z Google Search grounding...");
    const fallbackResults = await searchBusinessesWithGemini(finalQuery, country, region, districts, apiKey);
    return {
      businesses: fallbackResults,
      rawText: fallbackResults.length > 0 ? "Wyniki pozyskane przez wyszukiwarkę Gemini (Google Search Grounding)." : ""
    };
  }

  return {
    businesses: allBusinesses,
    rawText: ""
  };
};

const searchBusinessesWithGemini = async (
  finalQuery: string,
  country: string,
  region: string,
  districts: string[],
  apiKey: string
): Promise<Business[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const districtList = districts.filter(Boolean).join(", ");
  const locationStr = districtList ? `${districtList}, ${region}, ${country}` : `${region}, ${country}`;

  const prompt = `Znajdź aktualne, istniejące i prawdziwe firmy dla zapytania: "${finalQuery}" w obszarze: ${locationStr}.

Wykorzystaj narzędzie wyszukiwania, aby znaleźć rzeczywiste dane kontaktowe firm.

Zwróć odpowiedź WYŁĄCZNIE jako czysty format JSON w postaci tablicy obiektów. Przykład:
[
  {
    "name": "Nazwa Firmy Przykładowej",
    "website": "https://przyklad.pl",
    "phone": "+48 123 456 789",
    "address": "ul. Prosta 1, 00-001 Warszawa",
    "rating": 4.8,
    "reviewsCount": 24,
    "mapsUri": "https://maps.google.com/..."
  }
]
Zwróć TYLKO poprawną tablicę JSON, bez żądnego dodatkowego tekstu wprowadzającego ani znaczników markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: any[] = [];
    try {
      const startIdx = cleanText.indexOf('[');
      const endIdx = cleanText.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        parsed = JSON.parse(cleanText.substring(startIdx, endIdx + 1));
      }
    } catch (e) {
      console.warn("Nie udało się sparsować odpowiedzi JSON z Gemini:", e, text);
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => {
        const rating = typeof item.rating === 'number' ? item.rating : parseFloat(item.rating) || 0;
        const reviewsCount = typeof item.reviewsCount === 'number' ? item.reviewsCount : parseInt(item.reviewsCount) || 0;
        const website = item.website && item.website !== "brak" && item.website !== "null" && item.website.startsWith("http") ? item.website : undefined;
        const phone = item.phone && item.phone !== "brak" && item.phone !== "null" ? item.phone : undefined;
        const address = item.address && item.address !== "brak" && item.address !== "null" ? item.address : undefined;
        const mapsUri = item.mapsUri && item.mapsUri.startsWith("http") ? item.mapsUri : undefined;

        return {
          id: `gemini-${idx}-${Date.now()}`,
          name: item.name || `Firma ${idx + 1}`,
          website,
          phone,
          address,
          rating,
          reviewsCount,
          mapsUri,
          status: website && reviewsCount > 0 ? "High Potential" : "Low Potential"
        };
      });
    }
  } catch (err) {
    console.error("Błąd zapytania fallback do Gemini z Google Search grounding:", err);
  }

  return [];
};
