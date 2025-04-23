import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { 
  Badge, 
  Card, 
  Flex, 
  Group,
  Loader,
  Rating, 
  Stack, 
  Table, 
  Text, 
  Title 
} from '@mantine/core';
import { IconCalendar, IconMovie, IconDeviceTv } from '@tabler/icons-react';
import { 
  filteredCollectionAtom, 
  collectionAtom, 
  collectionErrorAtom, 
  collectionLoadingAtom, 
  fetchCollection 
} from '../../store/data';
import { DataFilters } from '../Filters/DataFilters';
import { TraktCollection } from '../../types/trakt';

export function CollectionList() {
  const [collection, setCollection] = useAtom(collectionAtom);
  const [filteredCollection] = useAtom(filteredCollectionAtom);
  const [loading, setLoading] = useAtom(collectionLoadingAtom);
  const [error, setError] = useAtom(collectionErrorAtom);

  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    if (!fetchAttempted && !loading && !error) {
      const fetchAllCollections = async () => {
        setLoading(true);
        setError(null);
        try {
          let movies: TraktCollection[] = [];
          let shows: TraktCollection[] = [];
          let moviesError: string | null = null;
          let showsError: string | null = null;

          await Promise.all([
            fetchCollection(
              (data) => { movies = data; },
              () => {},
              (err) => { moviesError = err; },
              { type: 'movies' }
            ),
            fetchCollection(
              (data) => { shows = data; },
              () => {},
              (err) => { showsError = err; },
              { type: 'shows' }
            ),
          ]);

          if (moviesError && showsError) {
            setError(`Movies: ${moviesError}; Shows: ${showsError}`);
            setCollection([]);
          } else if (moviesError) {
            setError(`Movies: ${moviesError}`);
            setCollection(shows);
          } else if (showsError) {
            setError(`Shows: ${showsError}`);
            setCollection(movies);
          } else {
            setError(null);
            setCollection([...movies, ...shows]);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch collection');
          setCollection([]);
        } finally {
          setLoading(false);
          setFetchAttempted(true);
        }
      };
      fetchAllCollections();
    }
  }, [fetchAttempted, loading, error, setCollection, setLoading, setError]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderItem = (item: TraktCollection) => {
    const isMovie = 'movie' in item;
    const title = isMovie 
      ? item.movie?.title 
      : item.show?.title;
    const year = isMovie 
      ? item.movie?.year 
      : item.show?.year;
    const rating = isMovie 
      ? item.movie?.rating 
      : undefined;
    // Only movies have collected_at at the top level
    const collectedAt = isMovie
      ? item.collected_at
      : undefined;
    
    // Background color based on content type with better dark mode support
    const bgColor = isMovie ? 'var(--mantine-color-blue-light)' : 'var(--mantine-color-teal-light)';

    return (
      <tr key={isMovie ? item.movie?.ids.trakt : item.show?.ids.trakt}>
        <td style={{ width: 100, padding: '12px' }}>
          <div
            style={{
              width: 100,
              height: 150,
              borderRadius: 8,
              backgroundColor: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
              transition: 'transform 0.2s ease',
            }}
            className="data-card"
          >
            {isMovie ?
              <IconMovie size={48} opacity={0.8} style={{ color: 'var(--mantine-color-blue-filled)' }} /> :
              <IconDeviceTv size={48} opacity={0.8} style={{ color: 'var(--mantine-color-teal-filled)' }} />
            }
          </div>
        </td>
        <td>
          <Stack gap="sm">
            <Title order={4}>{title}</Title>
            <Group gap="xs">
              <Badge
                color={isMovie ? 'blue' : 'teal'}
                variant="light"
                size="lg"
                leftSection={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isMovie ? <IconMovie size={14} /> : <IconDeviceTv size={14} />}
                  </div>
                }
              >
                {isMovie ? 'Movie' : 'TV Show'}
              </Badge>
              {year && <Badge color="gray" variant="light" size="lg">{year}</Badge>}
              {isMovie && item.movie?.genres && (
                <Group gap="xs">
                  {item.movie.genres.slice(0, 3).map(genre => (
                    <Badge key={genre} color="indigo" variant="light" size="sm">{genre}</Badge>
                  ))}
                </Group>
              )}
            </Group>
            {rating && (
              <Group gap="xs">
                <Text size="sm" fw={500} className="color-movies">Rating:</Text>
                <Rating value={Math.round(rating / 2)} readOnly fractions={2} color="blue" />
                <Text size="sm" fw={700}>({rating.toFixed(1)})</Text>
              </Group>
            )}
            <Group gap="xs" align="center">
              <IconCalendar size={16} color="dimmed" />
              <Text size="sm" c="dimmed">Collected: {collectedAt ? formatDate(collectedAt) : 'Unknown date'}</Text>
            </Group>
            {!isMovie && (
              <Text size="sm" c="dimmed">
                {item.seasons?.length || 0} seasons, {item.seasons?.reduce((acc, season) => acc + season.episodes.length, 0) || 0} episodes
              </Text>
            )}
          </Stack>
        </td>
      </tr>
    );
  };

  if (loading && collection.length === 0) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" py="xl">
          <Loader />
          <Text>Loading collection...</Text>
        </Stack>
      </Card>
    );
  }

  if (error && collection.length === 0) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" py="xl">
          <Text color="red">Error: {error}</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="md">My Collection</Title>
      
      <DataFilters />
      
      {loading && collection.length > 0 && (
        <Flex justify="center" my="md">
          <Loader size="sm" />
        </Flex>
      )}
      
      {filteredCollection.length === 0 ? (
        <Text ta="center" py="xl">No collection items match your filters.</Text>
      ) : (
        <>
          <Text size="sm" mb="md" fw={500} c="dimmed">
            Showing {filteredCollection.length} of {collection.length} items
          </Text>
          <Table striped highlightOnHover withColumnBorders withTableBorder>
            <tbody>
              {filteredCollection.map(renderItem)}
            </tbody>
          </Table>
        </>
      )}
    </Card>
  );
}