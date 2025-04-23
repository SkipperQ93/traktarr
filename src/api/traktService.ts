import { TraktClient } from '@dvcol/trakt-http-client';
import { traktApi } from '@dvcol/trakt-http-client/api';
import { Config } from '@dvcol/trakt-http-client/config';
import type {
  TraktClientSettings,
  TraktClientAuthentication,
  TraktHistory,
  TraktWatched,
  TraktRating,
  TraktCollection,
  TraktStats,
  TraktHistoryGetQuery
} from '@dvcol/trakt-http-client/models';
import {
  FilterOptions,
  TraktCredentials,
  isWatchedShow,
  isWatchedMovie,
  TraktWatchedShow
} from '../types/trakt';

// Default values for credentials (will be overridden by user input)
const DEFAULT_CLIENT_ID = import.meta.env.VITE_TRAKT_CLIENT_ID || '';
const DEFAULT_CLIENT_SECRET = import.meta.env.VITE_TRAKT_CLIENT_SECRET || '';
const DEFAULT_REDIRECT_URI = import.meta.env.VITE_TRAKT_REDIRECT_URI || window.location.origin;

// Create a singleton instance of the Trakt service
class TraktService {
  private static instance: TraktService;
  private client: TraktClient;
  private settings: TraktClientSettings;
  private credentials: TraktCredentials;

  private constructor() {
    // Initialize with default credentials
    this.credentials = {
      clientId: DEFAULT_CLIENT_ID,
      clientSecret: DEFAULT_CLIENT_SECRET,
      redirectUri: DEFAULT_REDIRECT_URI,
    };

    // Try to load stored credentials
    const storedCredentials = this.getCredentials();
    if (storedCredentials) {
      this.credentials = storedCredentials;
    }

    this.settings = {
      client_id: this.credentials.clientId,
      client_secret: this.credentials.clientSecret,
      redirect_uri: this.credentials.redirectUri,
      endpoint: Config.Endpoint.Production,
      useragent: 'Traktarr',
    };

    // Initialize the client with stored authentication if available
    const storedAuth = this.getStoredAuth();
    this.client = new TraktClient(this.settings, storedAuth, traktApi);
  }

  public static getInstance(): TraktService {
    if (!TraktService.instance) {
      TraktService.instance = new TraktService();
    }
    return TraktService.instance;
  }

  // Get the Trakt client
  public getClient(): TraktClient {
    return this.client;
  }

  // Check if the user is authenticated
  public isAuthenticated(): boolean {
    const auth = this.client.auth;
    return !!(auth.access_token && auth.expires && auth.expires > Date.now());
  }

  // Get the stored authentication from localStorage
  private getStoredAuth(): TraktClientAuthentication {
    try {
      const storedAuth = localStorage.getItem('trakt_auth');
      return storedAuth ? JSON.parse(storedAuth) : {};
    } catch (error) {
      console.error('Failed to parse stored authentication:', error);
      return {};
    }
  }

  // Store authentication in localStorage
  public storeAuth(auth: TraktClientAuthentication): void {
    localStorage.setItem('trakt_auth', JSON.stringify(auth));
  }

  // Clear stored authentication
  public clearAuth(): void {
    localStorage.removeItem('trakt_auth');
    // We can't use updateAuth directly as it's protected
    // Instead, we'll set a new empty auth object through importAuthentication
    this.client.importAuthentication({});
  }

  // Get stored credentials from localStorage
  public getCredentials(): TraktCredentials | null {
    try {
      const storedCredentials = localStorage.getItem('trakt_credentials');
      return storedCredentials ? JSON.parse(storedCredentials) : null;
    } catch (error) {
      console.error('Failed to parse stored credentials:', error);
      return null;
    }
  }

  // Check if valid credentials are set
  public hasValidCredentials(): boolean {
    const credentials = this.getCredentials();
    return !!(
      credentials &&
      credentials.clientId &&
      credentials.clientSecret &&
      credentials.redirectUri
    );
  }

  // Store credentials in localStorage
  public saveCredentials(credentials: TraktCredentials): void {
    localStorage.setItem('trakt_credentials', JSON.stringify(credentials));
    
    // Update the client with new credentials
    this.credentials = credentials;
    this.settings = {
      ...this.settings,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: credentials.redirectUri,
    };
    
    // Reinitialize the client with the new settings
    const storedAuth = this.getStoredAuth();
    this.client = new TraktClient(this.settings, storedAuth, traktApi);
  }

  // Generate authorization URL for OAuth flow
  public getAuthorizationUrl(): string {
    const state = Math.random().toString(36).substring(2, 15);
    return this.client.redirectToAuthenticationUrl({ state });
  }

  // Handle OAuth callback
  public async handleAuthCallback(code: string): Promise<void> {
    try {
      await this.client.exchangeCodeForToken(code);
      this.storeAuth(this.client.auth);
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  }

  // Start device authentication flow
  public async startDeviceAuth(): Promise<{ userCode: string; verificationUrl: string }> {
    try {
      const deviceAuth = await this.client.getDeviceCode();
      return {
        userCode: deviceAuth.user_code,
        verificationUrl: deviceAuth.verification_url,
      };
    } catch (error) {
      console.error('Failed to start device authentication:', error);
      throw error;
    }
  }

  // Poll for device authentication completion
  public async pollDeviceAuth(): Promise<void> {
    try {
      const polling = this.client.pollWithDeviceCode();
      await polling;
      this.storeAuth(this.client.auth);
    } catch (error) {
      console.error('Device authentication polling failed:', error);
      throw error;
    }
  }

  // Logout
  public async logout(): Promise<void> {
    try {
      if (this.isAuthenticated()) {
        await this.client.revokeAuthentication();
      }
      this.clearAuth();
    } catch (error) {
      console.error('Failed to logout:', error);
      this.clearAuth();
    }
  }

  // Get all pages of user's history with filtering options
  public async getAllHistory(options: {
    startDate?: Date;
    endDate?: Date;
    type?: 'movies' | 'shows' | 'episodes';
    start_at?: string;
    end_at?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<TraktHistory[]> {
    const allResults: TraktHistory[] = [];
    let page = 1;
    const limit = options.limit || 1000; // Use max allowed by API
    let totalPages = 1;

    do {
      const { data, headers } = await this.getHistoryWithHeaders({
        ...options,
        page,
        limit,
      });

      allResults.push(...data);

      // Parse total pages from headers
      totalPages = headers['x-pagination-page-count']
        ? parseInt(headers['x-pagination-page-count'], 10)
        : page;

      page += 1;
    } while (page <= totalPages);

    return allResults;
  }

  // Get user's history with filtering options
  public async getHistory(options: {
    startDate?: Date;
    endDate?: Date;
    type?: 'movies' | 'shows' | 'episodes';
    page?: number;
    limit?: number;
    start_at?: string;
    end_at?: string;
  } = {}): Promise<TraktHistory[]> {
    // Build params for the library
    type HistoryParams = TraktHistoryGetQuery & {
      pagination?: { page?: number; limit?: number };
    };
    const params: HistoryParams = {};

    // Use plural form as required by the library type definition and endpoint template
    if (options.type) {
      params.type = options.type as TraktHistoryGetQuery['type'];
    }

    // Pagination must be an object
    params.pagination = {
      page: options.page || 1,
      limit: options.limit || 100,
    };

    // Date filters as query params
    if (options.startDate) {
      params.start_at = options.startDate.toISOString();
    } else if (options.start_at) {
      params.start_at = options.start_at;
    }

    if (options.endDate) {
      params.end_at = options.endDate.toISOString();
    } else if (options.end_at) {
      params.end_at = options.end_at;
    }

    const response = await this.client.sync.history.get(params);
    return response.json();
  }

  // Get user's history with headers for pagination
  public async getHistoryWithHeaders(options: {
    startDate?: Date;
    endDate?: Date;
    type?: 'movies' | 'shows' | 'episodes';
    page?: number;
    limit?: number;
    start_at?: string;
    end_at?: string;
  } = {}): Promise<{ data: TraktHistory[]; headers: Record<string, string> }> {
    // Build params for the library
    type HistoryParams = TraktHistoryGetQuery & {
      pagination?: { page?: number; limit?: number };
    };
    const params: HistoryParams = {};

    // Use plural form as required by the library type definition and endpoint template
    if (options.type) {
      params.type = options.type as TraktHistoryGetQuery['type'];
    }

    // Pagination must be an object
    params.pagination = {
      page: Number(options.page || 1),
      limit: Number(options.limit || 100),
    };

    // Date filters as query params
    if (options.startDate) {
      params.start_at = options.startDate.toISOString();
    } else if (options.start_at) {
      params.start_at = options.start_at;
    }

    if (options.endDate) {
      params.end_at = options.endDate.toISOString();
    } else if (options.end_at) {
      params.end_at = options.end_at;
    }

    console.log('Fetching history with params:', JSON.stringify(params));
    
    try {
      // Call the Trakt API with our parameters
      const response = await this.client.sync.history.get(params);
      
      // Debug headers to troubleshoot pagination
      console.log('Response headers:', Array.from(response.headers.entries()));
      console.log('Pagination page:', response.headers.get('X-Pagination-Page'));
      console.log('Pagination limit:', response.headers.get('X-Pagination-Limit'));
      console.log('Pagination page count:', response.headers.get('X-Pagination-Page-Count'));
      console.log('Pagination item count:', response.headers.get('X-Pagination-Item-Count'));
      
      // Extract pagination headers
      const headers: Record<string, string> = {};
      
      const pageHeader = response.headers.get('X-Pagination-Page');
      const pageCountHeader = response.headers.get('X-Pagination-Page-Count');
      const limitHeader = response.headers.get('X-Pagination-Limit');
      const itemCountHeader = response.headers.get('X-Pagination-Item-Count');
      
      if (pageHeader) headers['x-pagination-page'] = pageHeader;
      if (pageCountHeader) headers['x-pagination-page-count'] = pageCountHeader;
      if (limitHeader) headers['x-pagination-limit'] = limitHeader;
      if (itemCountHeader) headers['x-pagination-item-count'] = itemCountHeader;
      
      // Return the data and headers
      return {
        data: await response.json(),
        headers
      };
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  }

  // Get user's watched items
  public async getWatched(type: 'movies' | 'shows'): Promise<TraktWatched[]> {
    const response = await this.client.sync.watched({ type });
    return response.json();
  }

  // Get user's ratings
  public async getRatings(options: {
    type?: 'movies' | 'shows' | 'seasons' | 'episodes' | 'all';
    rating?: number;
  } = {}): Promise<TraktRating[]> {
    const params: Record<string, string | number> = {};

    if (options.type) {
      params.type = options.type;
    }

    if (options.rating) {
      params.rating = options.rating;
    }

    const response = await this.client.sync.ratings.get(params);
    return response.json();
  }

  // Get user's collection
  public async getCollection(type: 'movies' | 'shows'): Promise<TraktCollection[]> {
    const response = await this.client.sync.collection.get({ type });
    return response.json();
  }

  // Get user's stats
  public async getStats(): Promise<TraktStats> {
    const response = await this.client.users.stats({ id: 'me' });
    return response.json();
  }

  // Apply filters to history items
  public applyFilters<T extends object>(items: T[], filters: FilterOptions): T[] {
    let filteredItems = [...items];

    // Filter by type
    if (filters.type && filters.type !== 'all') {
      filteredItems = filteredItems.filter(item => {
        // Get the type from the item, safely handling different formats
        let itemType: string | undefined;
        
        if ('type' in item) {
          itemType = String((item as Record<string, unknown>).type);
        }
        
        // Convert filter type to single form for comparison
        const filterTypeConverted = filters.type === 'movies'
          ? 'movie'
          : filters.type === 'shows'
            ? 'show'
            : filters.type === 'episodes'
              ? 'episode'
              : filters.type;
        
        // Check if types match after conversion
        if (itemType && itemType === filterTypeConverted) {
          return true;
        }
        
        // Infer type from properties if not explicitly specified
        if ('movie' in item && item.movie) {
          return filterTypeConverted === 'movie';
        }
        
        if ('show' in item && !('episode' in item) && item.show) {
          return filterTypeConverted === 'show';
        }
        
        if ('episode' in item && item.episode) {
          return filterTypeConverted === 'episode';
        }
        
        return false;
      });
    }

    // Filter by rating
    if (typeof filters.rating === 'number') {
      filteredItems = filteredItems.filter(item => {
        const rating = 
          ('rating' in item && typeof item.rating === 'number') ? item.rating : 
          ('movie' in item && item.movie && typeof item.movie === 'object' && 'rating' in item.movie) ? item.movie.rating as number : 
          ('show' in item && item.show && typeof item.show === 'object' && 'rating' in item.show) ? item.show.rating as number : 
          ('episode' in item && item.episode && typeof item.episode === 'object' && 'rating' in item.episode) ? item.episode.rating as number : 
          0;
        
        return rating >= (filters.rating || 0);
      });
    }

    // Filter by genre
    if (typeof filters.genre === 'string') {
      filteredItems = filteredItems.filter(item => {
        const genres = 
          ('movie' in item && item.movie && typeof item.movie === 'object' && 'genres' in item.movie && Array.isArray(item.movie.genres)) ? item.movie.genres as string[] : 
          ('show' in item && item.show && typeof item.show === 'object' && 'genres' in item.show && Array.isArray(item.show.genres)) ? item.show.genres as string[] : 
          [];
        
        return genres.includes(filters.genre as string);
      });
    }

    // Filter by year
    if (typeof filters.year === 'number') {
      filteredItems = filteredItems.filter(item => {
        const year = 
          ('movie' in item && item.movie && typeof item.movie === 'object' && 'year' in item.movie) ? item.movie.year as number : 
          ('show' in item && item.show && typeof item.show === 'object' && 'year' in item.show) ? item.show.year as number : 
          0;
        
        return year === filters.year;
      });
    }

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredItems = filteredItems.filter(item => {
        const title = 
          ('movie' in item && item.movie && typeof item.movie === 'object' && 'title' in item.movie) ? item.movie.title as string : 
          ('show' in item && item.show && typeof item.show === 'object' && 'title' in item.show) ? item.show.title as string : 
          ('episode' in item && item.episode && typeof item.episode === 'object' && 'title' in item.episode) ? item.episode.title as string : 
          '';
        
        return title.toLowerCase().includes(searchTerm);
      });
    }

    // Sort items
    if (filters.sortBy) {
      filteredItems.sort((a, b) => {
        let valueA: string | number = '';
        let valueB: string | number = '';

        switch (filters.sortBy) {
          case 'title':
            valueA = 
              ('movie' in a && a.movie && typeof a.movie === 'object' && 'title' in a.movie) ? a.movie.title as string : 
              ('show' in a && a.show && typeof a.show === 'object' && 'title' in a.show) ? a.show.title as string : 
              ('episode' in a && a.episode && typeof a.episode === 'object' && 'title' in a.episode) ? a.episode.title as string : 
              '';
            
            valueB = 
              ('movie' in b && b.movie && typeof b.movie === 'object' && 'title' in b.movie) ? b.movie.title as string : 
              ('show' in b && b.show && typeof b.show === 'object' && 'title' in b.show) ? b.show.title as string : 
              ('episode' in b && b.episode && typeof b.episode === 'object' && 'title' in b.episode) ? b.episode.title as string : 
              '';
            break;
            
          case 'year':
            valueA = 
              ('movie' in a && a.movie && typeof a.movie === 'object' && 'year' in a.movie) ? a.movie.year as number : 
              ('show' in a && a.show && typeof a.show === 'object' && 'year' in a.show) ? a.show.year as number : 
              0;
            
            valueB = 
              ('movie' in b && b.movie && typeof b.movie === 'object' && 'year' in b.movie) ? b.movie.year as number : 
              ('show' in b && b.show && typeof b.show === 'object' && 'year' in b.show) ? b.show.year as number : 
              0;
            break;
            
          case 'rating':
            valueA = 
              ('rating' in a && typeof a.rating === 'number') ? a.rating : 
              ('movie' in a && a.movie && typeof a.movie === 'object' && 'rating' in a.movie) ? a.movie.rating as number : 
              ('show' in a && a.show && typeof a.show === 'object' && 'rating' in a.show) ? a.show.rating as number : 
              ('episode' in a && a.episode && typeof a.episode === 'object' && 'rating' in a.episode) ? a.episode.rating as number : 
              0;
            
            valueB = 
              ('rating' in b && typeof b.rating === 'number') ? b.rating : 
              ('movie' in b && b.movie && typeof b.movie === 'object' && 'rating' in b.movie) ? b.movie.rating as number : 
              ('show' in b && b.show && typeof b.show === 'object' && 'rating' in b.show) ? b.show.rating as number : 
              ('episode' in b && b.episode && typeof b.episode === 'object' && 'rating' in b.episode) ? b.episode.rating as number : 
              0;
            break;
            
          case 'watched_at':
            valueA = 
              ('watched_at' in a && typeof a.watched_at === 'string') ? a.watched_at as string : 
              ('last_watched_at' in a && typeof a.last_watched_at === 'string') ? a.last_watched_at as string : 
              '';
            
            valueB = 
              ('watched_at' in b && typeof b.watched_at === 'string') ? b.watched_at as string : 
              ('last_watched_at' in b && typeof b.last_watched_at === 'string') ? b.last_watched_at as string : 
              '';
            break;
            
          case 'collected_at':
            valueA = ('collected_at' in a && typeof a.collected_at === 'string') ? a.collected_at as string : '';
            valueB = ('collected_at' in b && typeof b.collected_at === 'string') ? b.collected_at as string : '';
            break;
            
          default:
            valueA = 
              ('movie' in a && a.movie && typeof a.movie === 'object' && 'title' in a.movie) ? a.movie.title as string : 
              ('show' in a && a.show && typeof a.show === 'object' && 'title' in a.show) ? a.show.title as string : 
              ('episode' in a && a.episode && typeof a.episode === 'object' && 'title' in a.episode) ? a.episode.title as string : 
              '';
            
            valueB = 
              ('movie' in b && b.movie && typeof b.movie === 'object' && 'title' in b.movie) ? b.movie.title as string : 
              ('show' in b && b.show && typeof b.show === 'object' && 'title' in b.show) ? b.show.title as string : 
              ('episode' in b && b.episode && typeof b.episode === 'object' && 'title' in b.episode) ? b.episode.title as string : 
              '';
        }

        // Handle string comparison
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return filters.sortOrder === 'desc'
            ? valueB.localeCompare(valueA)
            : valueA.localeCompare(valueB);
        }

        // Handle number comparison
        return filters.sortOrder === 'desc'
          ? (valueB as number) - (valueA as number)
          : (valueA as number) - (valueB as number);
      });
    }

    return filteredItems;
  }

  // Filter items by date range
  public filterByDateRange<T extends { watched_at?: string }>(
    items: T[],
    startDate?: Date,
    endDate?: Date
  ): T[] {
    if (!startDate && !endDate) return items;

    return items.filter(item => {
      if (!item.watched_at) return false;
      
      const itemDate = new Date(item.watched_at);
      
      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      
      return true;
    });
  }
// Export data to file (no additional fetching)
public async exportData(
  data: Record<string, unknown>,
  format: 'json' | 'csv',
  filename: string
): Promise<void> {
  const exportData: Record<string, unknown> = { ...data };
    
    if (format === 'json') {
      // Create single JSON file with all data
      const content = JSON.stringify(exportData, null, 2);
      const mimeType = 'application/json';
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      if (!filename.endsWith(`.${format}`)) {
        filename = `${filename}.${format}`;
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } 
    else if (format === 'csv') {
      // For CSV, create separate files for each data type
      try {
        // Create CSV files for each data type
        if (exportData.history && Array.isArray(exportData.history) && exportData.history.length > 0) {
          this.downloadCSV(
            this.convertHistoryToCSV(exportData.history as TraktHistory[]),
            `${filename}-history.csv`
          );
        }
        
        if (exportData.watchedMovies && Array.isArray(exportData.watchedMovies) && exportData.watchedMovies.length > 0) {
          this.downloadCSV(
            this.convertWatchedMoviesToCSV(exportData.watchedMovies as TraktWatched[]),
            `${filename}-watched-movies.csv`
          );
        }
        
        if (exportData.watchedShows && Array.isArray(exportData.watchedShows) && exportData.watchedShows.length > 0) {
          this.downloadCSV(
            this.convertWatchedShowsToCSV(exportData.watchedShows as TraktWatched[]),
            `${filename}-watched-shows.csv`
          );
        }
        
        if (exportData.ratings && Array.isArray(exportData.ratings) && exportData.ratings.length > 0) {
          this.downloadCSV(
            this.convertRatingsToCSV(exportData.ratings as TraktRating[]),
            `${filename}-ratings.csv`
          );
        }
        
        if (exportData.collectionMovies && Array.isArray(exportData.collectionMovies) && exportData.collectionMovies.length > 0) {
          this.downloadCSV(
            this.convertCollectionToCSV(exportData.collectionMovies as TraktCollection[]),
            `${filename}-collection-movies.csv`
          );
        }
        
        if (exportData.collectionShows && Array.isArray(exportData.collectionShows) && exportData.collectionShows.length > 0) {
          this.downloadCSV(
            this.convertCollectionToCSV(exportData.collectionShows as TraktCollection[]),
            `${filename}-collection-shows.csv`
          );
        }
        
        if (exportData.stats) {
          this.downloadCSV(
            this.convertStatsToCSV(exportData.stats as TraktStats),
            `${filename}-stats.csv`
          );
        }
      } catch (error) {
        console.error("Error creating CSV downloads:", error);
        throw new Error("Failed to download CSV files");
      }
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  // Helper method to download a CSV file
  private downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Convert history items to CSV
  private convertHistoryToCSV(history: TraktHistory[]): string {
    let csv = 'ID,Type,Title,Season,Episode Number,Episode Title,Show Title,Year,Watched At,Trakt ID,IMDB ID,TMDB ID,Runtime,Genres\n';
    
    history.forEach(item => {
      const id = item.id || '';
      const watchedAt = item.watched_at || '';

      if (item.type === 'movie' && 'movie' in item && item.movie) {
        const movie = item.movie;
        const title = movie.title || 'Unknown';
        const year = movie.year || '';
        const traktId = movie.ids?.trakt || '';
        const imdbId = movie.ids?.imdb || '';
        const tmdbId = movie.ids?.tmdb || '';
        const runtime = movie.runtime || '';
        const genres = movie.genres ? movie.genres.join(', ') : '';

        csv += `${id},movie,${this.escapeCSV(title)},,,,${this.escapeCSV('')},${year},${watchedAt},${traktId},${imdbId},${tmdbId},${runtime},${this.escapeCSV(genres)}\n`;
      } else if (item.type === 'episode' && 'episode' in item && 'show' in item && item.episode && item.show) {
        const episode = item.episode;
        const show = item.show;
        const showTitle = show.title || 'Unknown';
        const year = show.year || '';
        const episodeTitle = episode.title || '';
        const seasonNum = episode.season || '';
        const episodeNum = episode.number || '';
        const traktId = episode.ids?.trakt || '';
        const tmdbId = episode.ids?.tmdb || '';
        const imdbId = show.ids?.imdb || '';
        const runtime = episode.runtime || show?.runtime || '';
        const genres = show.genres ? show.genres.join(', ') : '';

        csv += `${id},episode,${this.escapeCSV(episodeTitle)},${seasonNum},${episodeNum},${this.escapeCSV(episodeTitle)},${this.escapeCSV(showTitle)},${year},${watchedAt},${traktId},${imdbId},${tmdbId},${runtime},${this.escapeCSV(genres)}\n`;
      }
    });
    
    return csv;
  }
  
  // Convert watched movies to CSV
  private convertWatchedMoviesToCSV(movies: TraktWatched[]): string {
    let csv = 'Movie Title,Year,Plays,Last Watched,Runtime (min),Genres,Trakt ID,IMDB ID,TMDB ID\n';
    
    movies.forEach(item => {
      // Filter only movie items
      if (!isWatchedMovie(item)) return;
      
      const title = item.movie.title || 'Unknown';
      const year = item.movie.year || '';
      const plays = item.plays || 0;
      const lastWatched = item.last_watched_at || '';
      const runtime = item.movie.runtime || '';
      const genres = item.movie.genres ? item.movie.genres.join(', ') : '';
      const traktId = item.movie.ids?.trakt || '';
      const imdbId = item.movie.ids?.imdb || '';
      const tmdbId = item.movie.ids?.tmdb || '';
      
      csv += `${this.escapeCSV(title)},${year},${plays},${lastWatched},${runtime},${this.escapeCSV(genres)},${traktId},${imdbId},${tmdbId}\n`;
    });
    
    return csv;
  }
  
  // Convert watched shows to CSV
  private convertWatchedShowsToCSV(items: TraktWatched[]): string {
    let csv = 'Show Title,Show Year,Season,Episode,Episode Title,Plays,Last Watched,Trakt ID,IMDB ID\n';
    
    // Filter for show types only using our type guard function
    const shows = items.filter(isWatchedShow);
    
    shows.forEach(show => {
      // Type assertion to help TypeScript recognize the show property
      const typedShow = show as TraktWatchedShow;
      const showTitle = typedShow.show.title || 'Unknown';
      const showYear = typedShow.show.year || '';
      const showTraktId = typedShow.show.ids?.trakt || '';
      const showImdbId = typedShow.show.ids?.imdb || '';
      
      // Add each episode from each season
      if (typedShow.seasons && Array.isArray(typedShow.seasons)) {
        typedShow.seasons.forEach((season: {
          number: number;
          episodes: Array<{
            number: number;
            plays: number;
            last_watched_at: string;
          }>;
        }) => {
          const seasonNum = season.number || '';
          
          if (season.episodes && Array.isArray(season.episodes)) {
            season.episodes.forEach((episode: {
              number: number;
              plays: number;
              last_watched_at: string;
            }) => {
              const episodeNum = episode.number || '';
              const plays = episode.plays || 0;
              const lastWatched = episode.last_watched_at || '';
              
              csv += `${this.escapeCSV(showTitle)},${showYear},${seasonNum},${episodeNum},,${plays},${lastWatched},${showTraktId},${showImdbId}\n`;
            });
          }
        });
      }
    });
    
    return csv;
  }
  
  // Convert ratings to CSV
  // Convert ratings to CSV
  private convertRatingsToCSV(ratings: TraktRating[]): string {
    let csv = 'Type,Title,Rating,Rated At,Year,Season,Episode,Show Title,Trakt ID,IMDB ID\n';
    
    ratings.forEach((item: TraktRating) => {
      const type = item.type || '';
      const rating = item.rating || '';
      const ratedAt = item.rated_at || '';
      let title = '';
      let year = '';
      let season = '';
      let episode = '';
      let showTitle = '';
      let traktId = '';
      let imdbId = '';
      
      // Movies
      if (type === 'movie' && 'movie' in item && item.movie) {
        title = item.movie.title || 'Unknown';
        year = item.movie.year ? String(item.movie.year) : '';
        traktId = item.movie.ids?.trakt ? String(item.movie.ids.trakt) : '';
        imdbId = item.movie.ids?.imdb || '';
      }
      // Shows
      else if (type === 'show' && 'show' in item && item.show) {
        title = item.show.title || 'Unknown';
        year = item.show.year ? String(item.show.year) : '';
        traktId = item.show.ids?.trakt ? String(item.show.ids.trakt) : '';
        imdbId = item.show.ids?.imdb || '';
      }
      // Seasons
      else if (type === 'season' && 'season' in item && 'show' in item && item.season && item.show) {
        season = item.season.number ? String(item.season.number) : '';
        showTitle = item.show.title || 'Unknown';
        year = item.show.year ? String(item.show.year) : '';
        title = `Season ${season}`;
        traktId = item.season.ids?.trakt ? String(item.season.ids.trakt) : '';
        imdbId = item.show.ids?.imdb || '';
      }
      // Episodes
      else if (type === 'episode' && 'episode' in item && 'show' in item && item.episode && item.show) {
        episode = item.episode.number ? String(item.episode.number) : '';
        season = item.episode.season ? String(item.episode.season) : '';
        title = item.episode.title || 'Unknown';
        showTitle = item.show.title || 'Unknown';
        year = item.show.year ? String(item.show.year) : '';
        traktId = item.episode.ids?.trakt ? String(item.episode.ids.trakt) : '';
        imdbId = item.show.ids?.imdb || '';
      }
      
      csv += `${type},${this.escapeCSV(title)},${rating},${ratedAt},${year},${season},${episode},${this.escapeCSV(showTitle)},${traktId},${imdbId}\n`;
    });
    
    return csv;
  }
  
  // Convert collection to CSV
  // Convert collection to CSV
  private convertCollectionToCSV(collection: TraktCollection[]): string {
    let csv = 'Type,Title,Year,Collected At,Trakt ID,IMDB ID,TMDB ID,Runtime,Genres\n';
    
    collection.forEach((item: TraktCollection) => {
      // Use discriminated union checks for type safety
      if ('movie' in item && item.movie) {
        const title = item.movie.title || 'Unknown';
        const year = item.movie.year || '';
        const type = 'movie';
        const collectedAt = item.collected_at || '';
        const traktId = item.movie.ids?.trakt || '';
        const imdbId = item.movie.ids?.imdb || '';
        const tmdbId = item.movie.ids?.tmdb || '';
        const runtime = item.movie.runtime || '';
        const genres = item.movie.genres ? item.movie.genres.join(', ') : '';
        csv += `${type},${this.escapeCSV(title)},${year},${collectedAt},${traktId},${imdbId},${tmdbId},${runtime},${this.escapeCSV(genres)}\n`;
      } else if ('show' in item && item.show) {
        const title = item.show.title || 'Unknown';
        const year = item.show.year || '';
        const type = 'show';
        // Only TraktCollectionMovie has collected_at, for shows leave blank
        const collectedAt = '';
        const traktId = item.show.ids?.trakt || '';
        const imdbId = item.show.ids?.imdb || '';
        const tmdbId = item.show.ids?.tmdb || '';
        const runtime = item.show.runtime || '';
        const genres = item.show.genres ? item.show.genres.join(', ') : '';
        csv += `${type},${this.escapeCSV(title)},${year},${collectedAt},${traktId},${imdbId},${tmdbId},${runtime},${this.escapeCSV(genres)}\n`;
      }
    });
    
    return csv;
  }
  
  // Convert stats to CSV
  private convertStatsToCSV(stats: TraktStats): string {
    let csv = 'Category,Metric,Value\n';
    
    // Movies stats
    if (stats.movies) {
      csv += `Movies,Plays,${stats.movies.plays || 0}\n`;
      csv += `Movies,Watched,${stats.movies.watched || 0}\n`;
      csv += `Movies,Minutes,${stats.movies.minutes || 0}\n`;
      csv += `Movies,Collected,${stats.movies.collected || 0}\n`;
      csv += `Movies,Ratings,${stats.movies.ratings || 0}\n`;
      csv += `Movies,Comments,${stats.movies.comments || 0}\n`;
    }
    
    // Shows stats
    if (stats.shows) {
      csv += `Shows,Watched,${stats.shows.watched || 0}\n`;
      csv += `Shows,Collected,${stats.shows.collected || 0}\n`;
      csv += `Shows,Ratings,${stats.shows.ratings || 0}\n`;
      csv += `Shows,Comments,${stats.shows.comments || 0}\n`;
    }
    
    // Episodes stats
    if (stats.episodes) {
      csv += `Episodes,Plays,${stats.episodes.plays || 0}\n`;
      csv += `Episodes,Watched,${stats.episodes.watched || 0}\n`;
      csv += `Episodes,Minutes,${stats.episodes.minutes || 0}\n`;
      csv += `Episodes,Collected,${stats.episodes.collected || 0}\n`;
      csv += `Episodes,Ratings,${stats.episodes.ratings || 0}\n`;
      csv += `Episodes,Comments,${stats.episodes.comments || 0}\n`;
    }
    
    // Network stats
    if (stats.network) {
      csv += `Network,Friends,${stats.network.friends || 0}\n`;
      csv += `Network,Followers,${stats.network.followers || 0}\n`;
      csv += `Network,Following,${stats.network.following || 0}\n`;
    }
    
    // Ratings distribution
    if (stats.ratings && stats.ratings.distribution) {
      Object.entries(stats.ratings.distribution).forEach(([rating, count]) => {
        csv += `Ratings,${rating}/10 Stars,${count}\n`;
      });
    }
    
    return csv;
  }
  

  // Helper method to escape CSV values
  private escapeCSV(value: string): string {
    if (value == null) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

export default TraktService.getInstance();