
export interface Business {
  id: string;
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  rating?: number;
  reviewsCount?: number;
  mapsUri?: string;
  status?: string;
}

export interface SearchState {
  loading: boolean;
  error: string | null;
  results: Business[];
  rawResponse?: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}
