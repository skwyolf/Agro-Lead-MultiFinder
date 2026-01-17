
import { GoogleGenAI } from "@google/genai";
import { Business, LocationCoords } from "../types";

export const suggestTranslation = async (query: string, country: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Jesteś ekspertem od lokalizacji rynkowej i SEO. Użytkownik chce wyszukać firmy w kraju: ${country} używając polskiej frazy: "${query}".
  Twoim zadaniem jest zaproponowanie najbardziej profesjonalnego, lokalnego terminu branżowego w języku urzędowym kraju ${country}, który zwróci najlepsze wyniki w Google Maps i Google Search.
  
  Przykłady:
  - PL: maszyny rolnicze, Kraj: Niemcy -> Landmaschinen
  - PL: maszyny rolnicze, Kraj: Rumunia -> Utilaje agricole
  - PL: hotel, Kraj: Litwa -> Viešbutis
  
  Zwróć TYLKO i WYŁĄCZNIE zaproponowany termin (jedno lub dwa słowa), bez żadnego dodatkowego tekstu.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.trim() || query;
  } catch (error) {
    console.error("Błąd tłumaczenia:", error);
    return query;
  }
};

export const searchBusinesses = async (
  finalQuery: string,
  country: string,
  region: string,
  districts: string[],
  coords?: LocationCoords
): Promise<{ businesses: Business[]; rawText: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const districtList = districts.join(", ");
  const fullLocation = `${districtList}, region ${region}, ${country}`;
  
  const fullPrompt = `Jesteś profesjonalnym systemem do pozyskiwania leadów B2B. Twoim zadaniem jest znalezienie firm dla frazy: "${finalQuery}" w obszarze: ${fullLocation}.

# PROTOKÓŁ OPTYMALNEJ DOKŁADNOŚCI
Dla każdego obszaru wykonaj JEDNO główne zapytanie w Google Maps Tool.

# LOGIKA "IF-THEN" (Działaj inteligentnie):
1. JEŚLI firma posiada komplet danych (Nazwa, Telefon, WWW) w Google Maps -> PRZEJDŹ DALEJ (Nie wykonuj dodatkowych wyszukiwań dla tej firmy).
2. JEŚLI brakuje adresu WWW LUB Telefonu:
   - Wykonaj DOKŁADNIE JEDNO dodatkowe wyszukiwanie w Google Search: „[Nazwa Firmy] [Miasto] kontakt”.
   - Pobierz pierwszy pasujący wynik, który nie jest portalem ogłoszeniowym.
3. JEŚLI firma ma 0 opinii I JEDNOCZEŚNIE brak strony WWW -> OZNACZ tę firmę jako "Low Potential" w nowej kolumnie Status.

# ZASADA WYKRYWANIA BŁĘDÓW:
- Wyodrębnij tylko oficjalne domeny firm. ABSOLUTNIE ignoruj linki do portali: Facebook, Instagram, Panorama Firm, OLX, Allegro, LinkedIn, itp.
- Jeśli strona WWW prowadzi do Facebooka, spróbuj znaleźć pole "Witryna" w profilu FB, ale nie poświęcaj na to więcej niż 2 kroki.

Format tabeli Markdown (ZWRÓĆ TYLKO TABELĘ):
| Nazwa Firmy | Strona WWW | Telefon | Email | Adres | Status | Ocena | Ilość Opinii |

Zasady końcowe:
- Adres musi być kompletny.
- Ocena (np. 4.5), Ilość opinii (np. 120). Jeśli brak danych, wpisz 0.
- W kolumnie Status wpisz "High Potential" lub "Low Potential".
- Przeszukaj dokładnie obszary: ${districtList}.`;

  try {
    const config: any = {
      tools: [
        { googleMaps: {} },
        { googleSearch: {} }
      ],
    };

    if (coords) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: coords.latitude,
            longitude: coords.longitude,
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: config,
    });

    const rawText = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const businesses: Business[] = [];
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.includes('|'));
    
    lines.forEach((line, index) => {
      if (line.includes('---') || line.toLowerCase().includes('nazwa firmy')) {
        return;
      }

      const cols = line.split('|')
        .map(c => c.trim())
        .filter((c, i, arr) => i > 0 && i < arr.length - 1);

      if (cols.length >= 7) {
        const name = cols[0];
        let website = cols[1];
        
        if (website && website.includes('](')) {
          const match = website.match(/\((https?:\/\/[^\)]+)\)/);
          if (match) website = match[1];
        }
        
        const isPlaceholder = (val: string) => 
          !val || 
          val.toUpperCase() === "BRAK" || 
          val === "-" || 
          val.toLowerCase().includes("ręcznego") ||
          val.toLowerCase().includes("wymaga");

        const finalWebsite = !isPlaceholder(website) ? website : undefined;
        const phone = (cols[2] && !isPlaceholder(cols[2])) ? cols[2] : undefined;
        const email = (cols[3] && !isPlaceholder(cols[3])) ? cols[3] : undefined;
        const address = (cols[4] && !isPlaceholder(cols[4])) ? cols[4] : undefined;
        const status = cols[5];
        
        const rating = parseFloat(cols[6]?.replace(',', '.')) || 0;
        const reviewsCount = parseInt(cols[7]?.replace(/[^0-9]/g, '')) || 0;

        const mapsInfo = chunks.find((chunk: any) => 
          chunk.maps && (
            name.toLowerCase().includes(chunk.maps.title?.toLowerCase().substring(0, 5)) ||
            chunk.maps.title?.toLowerCase().includes(name.toLowerCase().substring(0, 5))
          )
        );

        if (name && name !== "Nazwa Firmy") {
          businesses.push({
            id: `biz-${index}-${Math.random().toString(36).substr(2, 4)}`,
            name: name,
            website: finalWebsite,
            phone: phone,
            email: email,
            address: address,
            status: status,
            rating: rating,
            reviewsCount: reviewsCount,
            mapsUri: mapsInfo?.maps?.uri
          });
        }
      }
    });

    if (businesses.length === 0 && chunks.length > 0) {
      chunks.forEach((chunk: any, idx: number) => {
        if (chunk.maps) {
          businesses.push({
            id: `map-fallback-${idx}`,
            name: chunk.maps.title || "Firma",
            mapsUri: chunk.maps.uri,
            address: "Dane pobrane bezpośrednio z Map Google",
            status: "High Potential",
            rating: 0,
            reviewsCount: 0
          });
        }
      });
    }

    return { businesses, rawText };
  } catch (error: any) {
    console.error("Błąd usługi Gemini:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("Błąd konfiguracji: model Gemini 2.5 nie jest dostępny w Twoim regionie lub dla Twojego klucza API.");
    }
    throw error;
  }
};
