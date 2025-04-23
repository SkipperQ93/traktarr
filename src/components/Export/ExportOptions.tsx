import { useState } from 'react';
import { useAtom } from 'jotai';
import {
  Button,
  Card,
  Checkbox,
  Flex,
  Loader,
  Select,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCalendar,
  IconDownload
} from '@tabler/icons-react';
import { 
  historyAtom, 
  watchedAtom, 
  ratingsAtom, 
  collectionAtom, 
  statsAtom 
} from '../../store/data';
import { ExportOptions } from '../../types/trakt';
import traktService from '../../api/traktService';

export function ExportOptionsForm() {
  const [history] = useAtom(historyAtom);
  const [watched] = useAtom(watchedAtom);
  const [ratings] = useAtom(ratingsAtom);
  const [collection] = useAtom(collectionAtom);
  const [stats] = useAtom(statsAtom);
  
  // State for tracking if we're fetching complete data for export
  const [fetchingFullData, setFetchingFullData] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeHistory: true,
    includeWatched: true,
    includeRatings: true,
    includeCollection: true,
    includeStats: true,
    separateFiles: true
  });
  
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  
  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };
  
  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      setFetchingFullData(true);
      
      // For CSV exports, we want to fetch more complete data
      const shouldFetchComplete = options.format === 'csv';
      
      // Prepare export options and data
      const exportData: Record<string, unknown> = {};
      
      // For CSV exports, we want to ensure we have the most complete data
      // For JSON exports, we can use cached data if available to reduce API calls
      
      // Process history data
      if (options.includeHistory) {
        if (shouldFetchComplete || history.length === 0) {
          try {
            // Use getAllHistory to fetch all pages
            let start_at: string | undefined = undefined;
            let end_at: string | undefined = undefined;
            if (dateRange[0]) start_at = dateRange[0].toISOString();
            if (dateRange[1]) end_at = dateRange[1].toISOString();
            const historyData = await traktService.getAllHistory({
              start_at,
              end_at,
            });
            exportData.history = historyData;
          } catch (error) {
            console.warn("Could not fetch complete history data:", error);
            // Fall back to cached data if available
            if (history.length > 0) {
              exportData.history = history;
            }
          }
        } else {
          exportData.history = history;
        }
      }
      
      // Process watched data
      if (options.includeWatched) {
        try {
          const movieData = await traktService.getWatched('movies');
          const showData = await traktService.getWatched('shows');
          
          // For CSV export we separate these for better formatting
          if (options.format === 'csv') {
            exportData.watchedMovies = movieData;
            exportData.watchedShows = showData;
          } else {
            exportData.watched = [...movieData, ...showData];
          }
        } catch (error) {
          console.warn("Could not fetch watched data:", error);
          if (watched.length > 0) {
            exportData.watched = watched;
          }
        }
      }
      
      // Process ratings data
      if (options.includeRatings) {
        if (shouldFetchComplete || ratings.length === 0) {
          try {
            const ratingsData = await traktService.getRatings();
            exportData.ratings = ratingsData;
          } catch (error) {
            console.warn("Could not fetch ratings data:", error);
            if (ratings.length > 0) {
              exportData.ratings = ratings;
            }
          }
        } else {
          exportData.ratings = ratings;
        }
      }
      
      // Process collection data
      if (options.includeCollection) {
        try {
          const movieCollection = await traktService.getCollection('movies');
          const showCollection = await traktService.getCollection('shows');
          
          // For CSV export we separate these for better formatting
          if (options.format === 'csv') {
            exportData.collectionMovies = movieCollection;
            exportData.collectionShows = showCollection;
          } else {
            exportData.collection = [...movieCollection, ...showCollection];
          }
        } catch (error) {
          console.warn("Could not fetch collection data:", error);
          if (collection.length > 0) {
            exportData.collection = collection;
          }
        }
      }
      
      // Process stats data
      if (options.includeStats) {
        if (shouldFetchComplete || !stats) {
          try {
            const statsData = await traktService.getStats();
            exportData.stats = statsData;
          } catch (error) {
            console.warn("Could not fetch stats data:", error);
            if (stats) {
              exportData.stats = stats;
            }
          }
        } else {
          exportData.stats = stats;
        }
      }
      
      // Apply date filtering if specified
      const [startDate, endDate] = dateRange;
      if (startDate || endDate) {
        exportData.dateRange = {
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString()
        };
      }
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `trakt-export-${date}`;
      
      // Export the data in the selected format
      await traktService.exportData(exportData, options.format, filename);
      
      const formatLabel = options.format === 'csv' ? 'CSV files' : `${filename}.${options.format}`;
      setSuccess(`Data successfully exported as ${formatLabel}`);
    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
      setFetchingFullData(false);
    }
  };
  
  
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="md">Export Data</Title>
      
      <Stack gap="md">
        <Select
          label="Export Format"
          description="Choose the format for your exported data"
          value={options.format}
          onChange={(value) => updateOption('format', value as 'json' | 'csv')}
          data={[
            { value: 'json', label: 'JSON (Complete Data)' },
            { value: 'csv', label: 'CSV (Spreadsheet)' },
          ]}
        />
        
        <Title order={5} mt="xs">Data to Include</Title>
        
        <Checkbox
          label="Watch History"
          description={history.length > 0 ? `${history.length} items loaded` : "Will fetch from Trakt.tv"}
          checked={options.includeHistory}
          onChange={(e) => updateOption('includeHistory', e.currentTarget.checked)}
        />
        
        <Checkbox
          label="Watched Items"
          description={watched.length > 0 ? `${watched.length} items loaded` : "Will fetch from Trakt.tv"}
          checked={options.includeWatched}
          onChange={(e) => updateOption('includeWatched', e.currentTarget.checked)}
        />
        
        <Checkbox
          label="Ratings"
          description={ratings.length > 0 ? `${ratings.length} items loaded` : "Will fetch from Trakt.tv"}
          checked={options.includeRatings}
          onChange={(e) => updateOption('includeRatings', e.currentTarget.checked)}
        />
        
        <Checkbox
          label="Collection"
          description={collection.length > 0 ? `${collection.length} items loaded` : "Will fetch from Trakt.tv"}
          checked={options.includeCollection}
          onChange={(e) => updateOption('includeCollection', e.currentTarget.checked)}
        />
        
        <Checkbox
          label="Stats"
          description={stats ? "User statistics loaded" : "Will fetch from Trakt.tv"}
          checked={options.includeStats}
          onChange={(e) => updateOption('includeStats', e.currentTarget.checked)}
        />
        
        <Title order={5} mt="xs">Date Range (Optional)</Title>
        <Text size="sm" c="dimmed">Filter history items by date range</Text>
        
        <DatePickerInput
          type="range"
          label="Date Range"
          placeholder="Pick date range"
          value={dateRange}
          onChange={setDateRange}
          leftSection={<IconCalendar size={16} />}
          clearable
        />
        
        {error && (
          <Text color="red" size="sm">{error}</Text>
        )}
        
        {success && (
          <Text color="green" size="sm">{success}</Text>
        )}
        
        <Flex justify="center" mt="md">
          <Button
            leftSection={loading ? <Loader size="xs" /> : <IconDownload size={16} />}
            onClick={handleExport}
            color="red"
            size="md"
            disabled={loading || (
              !options.includeHistory &&
              !options.includeWatched &&
              !options.includeRatings &&
              !options.includeCollection &&
              !options.includeStats
            )}
          >
            {loading ? (fetchingFullData ? 'Fetching data...' : 'Exporting...') : 'Export Data'}
          </Button>
        </Flex>
      </Stack>
    </Card>
  );
}