import { atom } from 'jotai';
import { 
  TraktStats,
  TraktHistory,
  TraktCollection,
  TraktRating,
  TraktWatched,
  FilterOptions
} from '../types/trakt';
import traktService from '../api/traktService';

// Filter options
export const filterOptionsAtom = atom<FilterOptions>({
  type: 'all',
  sortBy: 'watched_at',
  sortOrder: 'desc'
});

// Stats
export const statsAtom = atom<TraktStats | null>(null);
export const statsLoadingAtom = atom<boolean>(false);
export const statsErrorAtom = atom<string | null>(null);

export const fetchStats = async (
  setStats: (stats: TraktStats) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) => {
  setLoading(true);
  setError(null);
  
  try {
    const stats = await traktService.getStats();
    setStats(stats);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Failed to fetch stats');
  } finally {
    setLoading(false);
  }
};

// History
export const historyAtom = atom<TraktHistory[]>([]);
export const historyLoadingAtom = atom<boolean>(false);
export const historyErrorAtom = atom<string | null>(null);
export const historyFiltersAtom = atom<{
  type?: 'movies' | 'shows' | 'episodes';
  startDate?: Date;
  endDate?: Date;
}>({});

// Filtered history based on filter options
export const filteredHistoryAtom = atom<TraktHistory[]>(get => {
  const history = get(historyAtom);
  const filters = get(filterOptionsAtom);
  return traktService.applyFilters(history, filters);
});

export const fetchHistory = async (
  setHistory: (history: TraktHistory[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  params?: {
    page?: number;
    limit?: number;
    type?: 'movies' | 'shows' | 'episodes';
    start_at?: string;
    end_at?: string;
  }
) => {
  setLoading(true);
  setError(null);
  
  try {
    // Convert params to the format expected by traktService.getHistory
    const historyParams: {
      startDate?: Date;
      endDate?: Date;
      type?: 'movies' | 'shows' | 'episodes';
      page?: number;
      limit?: number;
    } = {
      page: params?.page,
      limit: params?.limit,
      type: params?.type,
    };
    
    // Convert string dates to Date objects if provided
    if (params?.start_at) {
      historyParams.startDate = new Date(params.start_at);
    }
    
    if (params?.end_at) {
      historyParams.endDate = new Date(params.end_at);
    }
    
    const history = await traktService.getHistory(historyParams);
    setHistory(history);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Failed to fetch history');
  } finally {
    setLoading(false);
  }
};

// Collection
export const collectionAtom = atom<TraktCollection[]>([]);
export const collectionLoadingAtom = atom<boolean>(false);
export const collectionErrorAtom = atom<string | null>(null);
export const collectionFiltersAtom = atom<{
  type?: 'movies' | 'shows';
}>({});

// Filtered collection based on filter options
export const filteredCollectionAtom = atom<TraktCollection[]>(get => {
  const collection = get(collectionAtom);
  const filters = get(filterOptionsAtom);
  return traktService.applyFilters(collection, filters);
});

export const fetchCollection = async (
  setCollection: (collection: TraktCollection[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  params?: {
    type?: 'movies' | 'shows';
  }
) => {
  setLoading(true);
  setError(null);
  
  try {
    const type = typeof params === 'string' ? params as 'movies' | 'shows' : params?.type;
    if (!type || (type !== 'movies' && type !== 'shows')) {
      throw new Error('Invalid collection type. Must be "movies" or "shows"');
    }
    
    const collection = await traktService.getCollection(type);
    setCollection(collection);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Failed to fetch collection');
  } finally {
    setLoading(false);
  }
};

// Watched
export const watchedAtom = atom<TraktWatched[]>([]);
export const watchedLoadingAtom = atom<boolean>(false);
export const watchedErrorAtom = atom<string | null>(null);

export const fetchWatched = async (
  setWatched: (watched: TraktWatched[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  params?: {
    type?: 'movies' | 'shows';
  }
) => {
  setLoading(true);
  setError(null);
  
  try {
    const type = typeof params === 'string' ? params as 'movies' | 'shows' : params?.type;
    if (!type || (type !== 'movies' && type !== 'shows')) {
      throw new Error('Invalid watched type. Must be "movies" or "shows"');
    }
    
    const watched = await traktService.getWatched(type);
    setWatched(watched);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Failed to fetch watched');
  } finally {
    setLoading(false);
  }
};

// Ratings
export const ratingsAtom = atom<TraktRating[]>([]);
export const ratingsLoadingAtom = atom<boolean>(false);
export const ratingsErrorAtom = atom<string | null>(null);
export const ratingsFiltersAtom = atom<{
  type?: 'movies' | 'shows' | 'seasons' | 'episodes' | 'all';
  rating?: number;
}>({});

// Filtered ratings based on filter options
export const filteredRatingsAtom = atom<TraktRating[]>(get => {
  const ratings = get(ratingsAtom);
  const filters = get(filterOptionsAtom);
  return traktService.applyFilters(ratings, filters);
});

export const fetchRatings = async (
  setRatings: (ratings: TraktRating[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  params?: {
    type?: 'movies' | 'shows' | 'seasons' | 'episodes' | 'all';
    rating?: number;
  }
) => {
  setLoading(true);
  setError(null);
  
  try {
    const ratings = await traktService.getRatings(params);
    setRatings(ratings);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Failed to fetch ratings');
  } finally {
    setLoading(false);
  }
};