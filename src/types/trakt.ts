import type {
  TraktClientSettings as LibTraktClientSettings,
  TraktClientAuthentication as LibTraktClientAuthentication
} from '@dvcol/trakt-http-client/models';

// Re-export the library's types with our own names to avoid conflicts
export type TraktClientSettings = LibTraktClientSettings;
export type TraktClientAuthentication = LibTraktClientAuthentication;

// Custom authentication interfaces not provided by the library
export interface TraktAuthentication {
  access_token: string;
  refresh_token: string;
  created_at: number;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface TraktDeviceAuthentication {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

// Our own extended interfaces for working with the Trakt API
// These types are used for type-checking in our application
export interface TraktMovie {
  title: string;
  year: number;
  ids: {
    trakt: number;
    slug: string;
    imdb?: string;
    tmdb?: number;
  };
  tagline?: string;
  overview?: string;
  released?: string;
  runtime?: number;
  country?: string;
  updated_at?: string;
  trailer?: string;
  homepage?: string;
  rating?: number;
  votes?: number;
  comment_count?: number;
  language?: string;
  available_translations?: string[];
  genres?: string[];
  certification?: string;
}

// Show types
export interface TraktShow {
  title: string;
  year: number;
  ids: {
    trakt: number;
    slug: string;
    tvdb?: number;
    imdb?: string;
    tmdb?: number;
  };
  overview?: string;
  first_aired?: string;
  airs?: {
    day: string;
    time: string;
    timezone: string;
  };
  runtime?: number;
  certification?: string;
  network?: string;
  country?: string;
  updated_at?: string;
  trailer?: string;
  homepage?: string;
  status?: string;
  rating?: number;
  votes?: number;
  comment_count?: number;
  language?: string;
  available_translations?: string[];
  genres?: string[];
  aired_episodes?: number;
}

// Season types
export interface TraktSeason {
  number: number;
  ids: {
    trakt: number;
    tvdb?: number;
    tmdb?: number;
  };
  rating?: number;
  votes?: number;
  episode_count?: number;
  aired_episodes?: number;
  title?: string;
  overview?: string;
  first_aired?: string;
  network?: string;
}

// Episode types
export interface TraktEpisode {
  season: number;
  number: number;
  title: string;
  ids: {
    trakt: number;
    tvdb?: number;
    imdb?: string;
    tmdb?: number;
  };
  number_abs?: number;
  overview?: string;
  first_aired?: string;
  updated_at?: string;
  rating?: number;
  votes?: number;
  comment_count?: number;
  available_translations?: string[];
  runtime?: number;
}

// For actual API operations, use these type assertions to work around typing issues
// These provide flexibility while still maintaining good type checking for our own code
/**
 * TraktHistory is now a discriminated union of TraktMovieHistory and TraktEpisodeHistory.
 * Remove legacy type and alias.
 */

export interface TraktWatchedShow {
  show: TraktShow;
  seasons: Array<{
    number: number;
    episodes: Array<{
      number: number;
      plays: number;
      last_watched_at: string;
    }>;
  }>;
}

export interface TraktWatchedMovie {
  movie: TraktMovie;
  plays: number;
  last_watched_at: string;
}

export type TraktWatched = TraktWatchedMovie | TraktWatchedShow;

// Type guards for TraktWatched
export function isWatchedMovie(watched: TraktWatched): watched is TraktWatchedMovie {
  return 'movie' in watched;
}

export function isWatchedShow(watched: TraktWatched): watched is TraktWatchedShow {
  return 'show' in watched && 'seasons' in watched;
}

// Type guards for TraktHistory
/**
 * Type guards for TraktHistory union type.
 * Import the correct types from the library.
 */
export type { TraktHistory } from '@dvcol/trakt-http-client/models';

/**
 * Remove broken type guards for TraktHistory.
 * Use only the type from the library and type narrowing in usage sites.
 */

// Use TraktRating from the API client to avoid type conflicts
export type { TraktRating } from '@dvcol/trakt-http-client/models';

// Define more specific types for collection items
export interface BaseTraktCollectionItem {
  collected_at: string;
}

export interface TraktCollectionMovie extends BaseTraktCollectionItem {
  movie: TraktMovie;
}

export interface TraktCollectionShow {
  show: TraktShow;
  seasons?: Array<{
    number: number;
    episodes: Array<{
      number: number;
      collected_at: string;
    }>;
  }>;
}

// Union type to represent any type of collection item
export type TraktCollection = TraktCollectionMovie | TraktCollectionShow;

export interface TraktStatsObject {
  movies: {
    plays: number;
    watched: number;
    minutes: number;
    collected: number;
    ratings: number;
    comments: number;
  };
  shows: {
    watched: number;
    collected: number;
    ratings: number;
    comments: number;
  };
  seasons: {
    ratings: number;
    comments: number;
  };
  episodes: {
    plays: number;
    watched: number;
    minutes: number;
    collected: number;
    ratings: number;
    comments: number;
  };
  network: {
    friends: number;
    followers: number;
    following: number;
  };
  ratings: {
    total: number;
    distribution: {
      '1': number;
      '2': number;
      '3': number;
      '4': number;
      '5': number;
      '6': number;
      '7': number;
      '8': number;
      '9': number;
      '10': number;
    };
  };
}

export type TraktStats = TraktStatsObject;

// Credentials type for user-provided API keys
export interface TraktCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Export types for our application
export interface ExportOptions {
  format: 'json' | 'csv';
  includeHistory: boolean;
  includeWatched: boolean;
  includeRatings: boolean;
  includeCollection: boolean;
  includeStats: boolean;
  separateFiles: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface FilterOptions {
  type?: 'movies' | 'shows' | 'episodes' | 'all';
  rating?: number;
  genre?: string;
  year?: number;
  sortBy?: 'title' | 'year' | 'rating' | 'watched_at' | 'collected_at';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}