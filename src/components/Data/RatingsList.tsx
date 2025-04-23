import { JSX, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { 
  Badge, 
  Card, 
  Flex, 
  Group,
  Loader,
  Rating as MantineRating, 
  Stack, 
  Table, 
  Text, 
  Title 
} from '@mantine/core';
import { IconCalendar, IconMovie, IconDeviceTv, IconStar } from '@tabler/icons-react';
import { 
  filteredRatingsAtom, 
  ratingsAtom, 
  ratingsErrorAtom, 
  ratingsLoadingAtom, 
  fetchRatings 
} from '../../store/data';
import { DataFilters } from '../Filters/DataFilters';
import { TraktRating } from '../../types/trakt';


export function RatingsList() {
  const [ratings, setRatings] = useAtom(ratingsAtom);
  const [filteredRatings] = useAtom(filteredRatingsAtom);
  const [loading, setLoading] = useAtom(ratingsLoadingAtom);
  const [error, setError] = useAtom(ratingsErrorAtom);

  const [fetchAttempted, setFetchAttempted] = useState(false);

  useEffect(() => {
    if (!fetchAttempted && !loading && !error) {
      fetchRatings(setRatings, setLoading, setError);
      setFetchAttempted(true);
    }
  }, [fetchAttempted, loading, error, setRatings, setLoading, setError]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderItem = (item: TraktRating) => {
    let title = '';
    let year: number | undefined;
    let key: string | number = item.type;
    let bgColor = '';
    let badgeColor = '';
    let icon: JSX.Element = <IconDeviceTv size={48} opacity={0.8} style={{ color: 'var(--mantine-color-indigo-filled)' }} />;
    let badgeLabel = '';

    switch (item.type) {
      case 'movie': {
        // @ts-expect-error // i hate union types or whatever this AI did
        const { movie } = item;
        title = movie.title;
        year = movie.year;
        key = `movie-${movie.ids.trakt}`;
        bgColor = 'var(--mantine-color-blue-light)';
        badgeColor = 'blue';
        icon = <IconMovie size={48} opacity={0.8} style={{ color: 'var(--mantine-color-blue-filled)' }} />;
        badgeLabel = 'Movie';
        break;
      }
      case 'show': {
        // @ts-expect-error // i hate union types or whatever this AI did
        const { show } = item;
        title = show.title;
        year = show.year;
        key = `show-${show.ids.trakt}`;
        bgColor = 'var(--mantine-color-teal-light)';
        badgeColor = 'teal';
        icon = <IconDeviceTv size={48} opacity={0.8} style={{ color: 'var(--mantine-color-teal-filled)' }} />;
        badgeLabel = 'TV Show';
        break;
      }
      case 'season': {
        // @ts-expect-error // i hate union types or whatever this AI did
        const { show, season } = item;
        title = `${show.title} - Season ${season.number}`;
        year = show.year;
        key = `season-${season.ids.trakt}`;
        bgColor = 'var(--mantine-color-cyan-light)';
        badgeColor = 'cyan';
        icon = <IconDeviceTv size={48} opacity={0.8} style={{ color: 'var(--mantine-color-cyan-filled)' }} />;
        badgeLabel = 'Season';
        break;
      }
      case 'episode': {
        // @ts-expect-error // i hate union types or whatever this AI did
        const { show, episode } = item;
        title = `${show.title} - S${episode.season}E${episode.number} - ${episode.title}`;
        year = show.year;
        key = `episode-${episode.ids.trakt}`;
        bgColor = 'var(--mantine-color-indigo-light)';
        badgeColor = 'indigo';
        icon = <IconDeviceTv size={48} opacity={0.8} style={{ color: 'var(--mantine-color-indigo-filled)' }} />;
        badgeLabel = 'Episode';
        break;
      }
    }

    return (
      <tr key={key}>
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
            {icon}
          </div>
        </td>
        <td>
          <Stack gap="sm">
            <Title order={4}>{title}</Title>
            <Group gap="xs">
              <Badge
                color={badgeColor}
                variant="light"
                size="lg"
                leftSection={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.type === 'movie' ? <IconMovie size={14} /> : <IconDeviceTv size={14} />}
                  </div>
                }
              >
                {badgeLabel}
              </Badge>
              {year && <Badge color="gray" variant="light" size="lg">{year}</Badge>}
            </Group>
            <Group gap="xs" align="center">
              <IconStar size={16} color="yellow" />
              <Text size="sm" fw={500}>Your Rating:</Text>
              <MantineRating value={item.rating / 2} readOnly fractions={2} size="md" />
              <Text size="sm" fw={700}>{item.rating}/10</Text>
            </Group>
            <Group gap="xs" align="center">
              <IconCalendar size={16} color="dimmed" />
              <Text size="sm" c="dimmed">Rated on: {formatDate(item.rated_at)}</Text>
            </Group>
          </Stack>
        </td>
      </tr>
    );
  };

  if (loading && ratings.length === 0) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" py="xl">
          <Loader />
          <Text>Loading ratings...</Text>
        </Stack>
      </Card>
    );
  }

  if (error && ratings.length === 0) {
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
      <Title order={3} mb="md">My Ratings</Title>
      
      <DataFilters />
      
      {loading && ratings.length > 0 && (
        <Flex justify="center" my="md">
          <Loader size="sm" />
        </Flex>
      )}
      
      {filteredRatings.length === 0 ? (
        <Text ta="center" py="xl">No ratings match your filters.</Text>
      ) : (
        <>
          <Text size="sm" mb="md" fw={500} c="dimmed">
            Showing {filteredRatings.length} of {ratings.length} items
          </Text>
          <Table striped highlightOnHover withColumnBorders withTableBorder>
            <tbody>
              {filteredRatings.map(renderItem)}
            </tbody>
          </Table>
        </>
      )}
    </Card>
  );
}