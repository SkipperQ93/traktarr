import { useAtom } from 'jotai';
import { 
  Box, 
  Button, 
  Flex, 
  Group, 
  NumberInput, 
  Select, 
  TextInput, 
  Title 
} from '@mantine/core';
import { IconFilter, IconSearch } from '@tabler/icons-react';
import { filterOptionsAtom } from '../../store/data';
import { FilterOptions } from '../../types/trakt';

const GENRES = [
  { value: '', label: 'All Genres' },
  { value: 'action', label: 'Action' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'animation', label: 'Animation' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'crime', label: 'Crime' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'drama', label: 'Drama' },
  { value: 'family', label: 'Family' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'history', label: 'History' },
  { value: 'horror', label: 'Horror' },
  { value: 'music', label: 'Music' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'romance', label: 'Romance' },
  { value: 'science-fiction', label: 'Science Fiction' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'war', label: 'War' },
  { value: 'western', label: 'Western' }
];

export function DataFilters() {
  const [filters, setFilters] = useAtom(filterOptionsAtom);

  const updateFilter = (key: keyof FilterOptions, value: string | number | null | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      type: 'all',
      sortBy: 'watched_at',
      sortOrder: 'desc',
    });
  };

  return (
    <Box mb="md">
      <Flex justify="space-between" align="center" mb="sm">
        <Title order={4}>
          <Flex align="center" gap="xs">
            <IconFilter size={20} />
            Filters
          </Flex>
        </Title>
        <Button 
          variant="subtle" 
          size="xs" 
          onClick={resetFilters}
        >
          Reset Filters
        </Button>
      </Flex>

      <Flex gap="md" wrap="wrap">
        <Select
          label="Type"
          value={filters.type || 'all'}
          onChange={(value) => updateFilter('type', value)}
          data={[
            { value: 'all', label: 'All Types' },
            { value: 'movies', label: 'Movies' },
            { value: 'shows', label: 'TV Shows' },
            { value: 'episodes', label: 'Episodes' }
          ]}
          style={{ width: '150px' }}
        />

        <Select
          label="Genre"
          value={filters.genre || ''}
          onChange={(value) => updateFilter('genre', value)}
          data={GENRES}
          style={{ width: '180px' }}
        />

        <NumberInput
          label="Year"
          value={filters.year || undefined}
          onChange={(value) => updateFilter('year', value)}
          placeholder="Any year"
          min={1900}
          max={new Date().getFullYear()}
          style={{ width: '120px' }}
          allowDecimal={false}
        />

        <NumberInput
          label="Min Rating"
          value={filters.rating || undefined}
          onChange={(value) => updateFilter('rating', value)}
          placeholder="Any rating"
          min={1}
          max={10}
          style={{ width: '120px' }}
          allowDecimal={false}
        />

        <TextInput
          label="Search"
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.currentTarget.value)}
          placeholder="Search titles..."
          leftSection={<IconSearch size={16} />}
          style={{ width: '200px' }}
        />

        <Group>
          <Select
            label="Sort By"
            value={filters.sortBy || 'watched_at'}
            onChange={(value) => updateFilter('sortBy', value)}
            data={[
              { value: 'title', label: 'Title' },
              { value: 'year', label: 'Year' },
              { value: 'rating', label: 'Rating' },
              { value: 'watched_at', label: 'Watch Date' },
              { value: 'collected_at', label: 'Collection Date' }
            ]}
            style={{ width: '150px' }}
          />

          <Select
            label="Sort Order"
            value={filters.sortOrder || 'desc'}
            onChange={(value) => updateFilter('sortOrder', value)}
            data={[
              { value: 'asc', label: 'Ascending' },
              { value: 'desc', label: 'Descending' }
            ]}
            style={{ width: '150px' }}
          />
        </Group>
      </Flex>
    </Box>
  );
}