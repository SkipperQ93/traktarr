import { useAtom } from 'jotai';
import {
  Box,
  Table,
  Text,
  Title,
  Stack,
  Group,
  Badge,
  Rating,
  Center
} from '@mantine/core';
import {
  IconMovie,
  IconDeviceTv,
  IconCalendar
} from '@tabler/icons-react';
import {
  filteredHistoryAtom,
  historyFiltersAtom
} from '../../store/data';
import { TraktHistory } from '../../types/trakt';

export function HistoryList() {
  const [filteredHistory] = useAtom(filteredHistoryAtom);
  const [filters] = useAtom(historyFiltersAtom);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderItem = (item: TraktHistory) => {
    if (item.type === 'movie' && 'movie' in item && item.movie) {
      const title = item.movie.title;
      const year = item.movie.year;
      const rating = item.movie.rating;
      const bgColor = 'var(--mantine-color-blue-light)';
      return (
        <tr key={item.id}>
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
              <IconMovie size={48} opacity={0.8} style={{ color: 'var(--mantine-color-blue-filled)' }} />
            </div>
          </td>
          <td>
            <Stack gap="sm">
              <Title order={4}>{title}</Title>
              <Group gap="xs">
                <Badge
                  leftSection={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconMovie size={14} />
                    </div>
                  }
                  color="blue"
                  variant="light"
                  size="lg"
                >
                  Movie
                </Badge>
                {year && <Badge color="gray" variant="light" size="lg">{year}</Badge>}
              </Group>
              {rating && (
                <Group gap="xs" align="center">
                  <Text size="sm" fw={500} className="color-movies">Rating:</Text>
                  <Rating value={Math.round(rating / 2)} readOnly fractions={2} size="md" color="blue" />
                  <Text size="sm" fw={700}>({rating.toFixed(1)})</Text>
                </Group>
              )}
              <Group gap="xs" align="center">
                <IconCalendar size={16} />
                <Text size="sm">{formatDate(item.watched_at)}</Text>
              </Group>
            </Stack>
          </td>
        </tr>
      );
    } else if (item.type === 'episode' && 'show' in item && 'episode' in item && item.show && item.episode) {
      const title = `${item.show.title} - ${item.episode.title}`;
      const year = item.show.year;
      const rating = item.episode.rating;
      const bgColor = 'var(--mantine-color-teal-light)';
      return (
        <tr key={item.id}>
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
              <IconDeviceTv size={48} opacity={0.8} style={{ color: 'var(--mantine-color-teal-filled)' }} />
            </div>
          </td>
          <td>
            <Stack gap="sm">
              <Title order={4}>{title}</Title>
              <Group gap="xs">
                <Badge
                  leftSection={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconDeviceTv size={14} />
                    </div>
                  }
                  color="teal"
                  variant="light"
                  size="lg"
                >
                  TV Show
                </Badge>
                {year && <Badge color="gray" variant="light" size="lg">{year}</Badge>}
              </Group>
              {rating && (
                <Group gap="xs" align="center">
                  <Text size="sm" fw={500} className="color-shows">Rating:</Text>
                  <Rating value={Math.round(rating / 2)} readOnly fractions={2} size="md" color="teal" />
                  <Text size="sm" fw={700}>({rating.toFixed(1)})</Text>
                </Group>
              )}
              <Group gap="xs" align="center">
                <IconCalendar size={16} />
                <Text size="sm">{formatDate(item.watched_at)}</Text>
              </Group>
            </Stack>
          </td>
        </tr>
      );
    } else {
      // fallback for unknown types
      return null;
    }
  };

  if (filteredHistory.length === 0) {
    return (
      <Box py="xl">
        <Center>
          <Text size="lg" fw={500} c="dimmed">No history items match your filters.</Text>
        </Center>
      </Box>
    );
  }

  return (
    <Box>
      <Text size="sm" mb="md" fw={500} c="dimmed">
        Showing {filteredHistory.length} items
        {filters && Object.keys(filters).length > 0 ? " (filtered)" : ""}
      </Text>
      <Table striped highlightOnHover withColumnBorders withTableBorder>
        <tbody>
          {filteredHistory.map(renderItem)}
        </tbody>
      </Table>
    </Box>
  );
}