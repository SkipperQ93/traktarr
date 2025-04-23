import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  historyAtom,
  historyLoadingAtom,
  historyErrorAtom,
  historyFiltersAtom
} from '../store/data';
import traktService from '../api/traktService';
import { 
  Title,
  Box,
  Paper,
  Loader,
  Pagination,
  Select,
  Button,
  Group,
  Badge,
  Alert,
  Grid,
  Center,
  Space,
  Text,
  Flex
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { HistoryList } from '../components/Data/HistoryList';

export default function HistoryPage() {
  const [history, setHistory] = useAtom(historyAtom);
  const [historyLoading, setHistoryLoading] = useAtom(historyLoadingAtom);
  const [historyError, setHistoryError] = useAtom(historyErrorAtom);
  const [filters, setFilters] = useAtom(historyFiltersAtom);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [type, setType] = useState<'movies' | 'shows' | 'episodes' | ''>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  // Load initial data
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // React to changes in page and limit
  useEffect(() => {
    if (page !== 1 || limit !== 50) {
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);
  
  // React to filter changes, but reset to page 1
  useEffect(() => {
    setPage(1);
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);
  
  const loadHistory = async () => {
    // Ensure page and limit are properly passed as numbers
    // Ensure page and limit are passed as integers
    const queryParams = {
      page: parseInt(String(page), 10),
      limit: parseInt(String(limit), 10),
      type: filters.type,
      start_at: filters.startDate?.toISOString(),
      end_at: filters.endDate?.toISOString()
    };
    
    try {
      setHistoryLoading(true);
      const { data, headers } = await traktService.getHistoryWithHeaders(queryParams);
      
      // Set history data
      setHistory(data);
      
      // Parse pagination headers from Trakt API
      const itemCount = parseInt(headers['x-pagination-item-count'] || '0', 10);
      const pageCount = parseInt(headers['x-pagination-page-count'] || '0', 10);
      
      setTotalItems(itemCount);
      setTotalPages(pageCount);
      
      setHistoryError(null);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Failed to fetch history');
    } finally {
      setHistoryLoading(false);
    }
  };
  
  const handleApplyFilters = () => {
    // Update the filters state with the current input values
    const newFilters = {
      type: type || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    };
    
    setFilters(newFilters);
    setPage(1); // Reset to first page when applying filters
  };
  
  const handleClearFilters = () => {
    setType('');
    setStartDate(null);
    setEndDate(null);
    setFilters({});
    setPage(1);
    loadHistory();
  };
  
  const handlePageChange = (value: number) => {
    setPage(value);
  };
  
  const handleLimitChange = (value: string | null) => {
    if (value) {
      setLimit(Number(value));
      setPage(1);
    }
  };

  const handleTypeChange = (value: string | null) => {
    setType(value as 'movies' | 'shows' | 'episodes' | '');
  };
  
  return (
    <Box className="page-container">
      <Title order={2} mb="xl">Watch History</Title>
      
      <Paper shadow="sm" p="xl" mb="xl" withBorder className="data-card">
        <Title order={4} mb="md">Filters</Title>
        
        <Grid mb="md">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Type"
              placeholder="Select type"
              value={type}
              onChange={handleTypeChange}
              data={[
                { value: '', label: 'All' },
                { value: 'movies', label: 'Movies' },
                { value: 'shows', label: 'Shows' },
                { value: 'episodes', label: 'Episodes' }
              ]}
              clearable
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <DateInput
              label="Start Date"
              placeholder="Select start date"
              value={startDate}
              onChange={setStartDate}
              clearable
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 4 }}>
            <DateInput
              label="End Date"
              placeholder="Select end date"
              value={endDate}
              onChange={setEndDate}
              clearable
            />
          </Grid.Col>
        </Grid>
        
        <Group mb="md">
          <Button onClick={handleApplyFilters}>
            Apply Filters
          </Button>
          
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </Group>
        
        {Object.keys(filters).length > 0 && (
          <Box mb="lg">
            <Title order={6} mb="sm">Active Filters:</Title>
            <Group>
              {filters.type && (
                <Badge
                  color="red"
                  variant="light"
                  rightSection={
                    <Box 
                      component="span" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setFilters({ ...filters, type: undefined });
                        setType('');
                        loadHistory();
                      }}
                    >
                      ×
                    </Box>
                  }
                >
                  Type: {filters.type}
                </Badge>
              )}
              {filters.startDate && (
                <Badge
                  color="indigo"
                  variant="light"
                  rightSection={
                    <Box 
                      component="span" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setFilters({ ...filters, startDate: undefined });
                        setStartDate(null);
                        loadHistory();
                      }}
                    >
                      ×
                    </Box>
                  }
                >
                  From: {filters.startDate.toLocaleDateString()}
                </Badge>
              )}
              {filters.endDate && (
                <Badge
                  color="indigo"
                  variant="light"
                  rightSection={
                    <Box 
                      component="span" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setFilters({ ...filters, endDate: undefined });
                        setEndDate(null);
                        loadHistory();
                      }}
                    >
                      ×
                    </Box>
                  }
                >
                  To: {filters.endDate.toLocaleDateString()}
                </Badge>
              )}
            </Group>
          </Box>
        )}
      </Paper>
      
      <Paper shadow="sm" p="xl" withBorder className="data-card">
        <Group justify="space-between" mb="lg">
          <Title order={4}>Results</Title>
          
          <Select
            label="Items per page"
            value={String(limit)}
            onChange={handleLimitChange}
            data={[
              { value: '20', label: '20' },
              { value: '50', label: '50' },
              { value: '100', label: '100' },
              { value: '200', label: '200' }
            ]}
            style={{ width: 120 }}
          />
        </Group>
        
        {historyLoading ? (
          <Center p="xl">
            <Loader size="lg" color="red" mb="md" />
            <Text>Loading history data...</Text>
          </Center>
        ) : historyError ? (
          <Alert color="red" title="Error" variant="filled">
            {historyError}
          </Alert>
        ) : history.length > 0 ? (
          <>
            <HistoryList />
            
            <Space h="xl" />
            <Center>
            <Flex justify="space-between" align="center" direction={'column'} gap="md">
              <Pagination
                total={totalPages}
                value={page}
                onChange={handlePageChange}
                color="red"
                radius="md"
                withEdges
              />
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                <Text size="xs" c="dimmed">
                  Total items: {totalItems || 'Unknown'} |
                  Pages: {totalPages || 1} |
                  Items per page: {limit}
                </Text>
              </div>
              </Flex>
            </Center>
          </>
        ) : (
          <Alert color="blue" title="Info" variant="light">
            No history items found.
          </Alert>
        )}
      </Paper>
    </Box>
  );
}