import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { 
  Card, 
  Flex, 
  Grid, 
  Group, 
  Loader, 
  Paper, 
  Progress, 
  RingProgress, 
  Stack, 
  Text, 
  Title 
} from '@mantine/core';
import { 
  IconClock, 
  IconDeviceTv, 
  IconMovie, 
  IconStar, 
  IconUsers, 
  IconMessageCircle2 
} from '@tabler/icons-react';
import { statsAtom, statsErrorAtom, statsLoadingAtom, fetchStats } from '../../store/data';

export function StatsDisplay() {
  const [stats, setStats] = useAtom(statsAtom);
  const [loading, setLoading] = useAtom(statsLoadingAtom);
  const [error, setError] = useAtom(statsErrorAtom);

  useEffect(() => {
    if (!stats && !loading && !error) {
      fetchStats(setStats, setLoading, setError);
    }
  }, [stats, loading, error, setStats, setLoading, setError]);

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days !== 1 ? 's' : ''} ${hours % 24} hr${hours % 24 !== 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes % 60} min${minutes % 60 !== 1 ? 's' : ''}`;
  };

  if (loading && !stats) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" py="xl">
          <Loader />
          <Text>Loading stats...</Text>
        </Stack>
      </Card>
    );
  }

  if (error && !stats) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack align="center" py="xl">
          <Text color="red">Error: {error}</Text>
        </Stack>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text ta="center">No stats available.</Text>
      </Card>
    );
  }

  const totalWatched = stats.movies.watched + stats.episodes.watched;
  const totalPlays = stats.movies.plays + stats.episodes.plays;
  const totalCollected = stats.movies.collected + stats.episodes.collected;
  const totalRatings = stats.movies.ratings + stats.shows.ratings + stats.seasons.ratings + stats.episodes.ratings;
  const totalComments = stats.movies.comments + stats.shows.comments + stats.seasons.comments + stats.episodes.comments;
  const totalMinutes = stats.movies.minutes + stats.episodes.minutes;

  // Calculate percentages for the ring progress
  const movieWatchedPercentage = Math.round((stats.movies.watched / totalWatched) * 100) || 0;
  const episodeWatchedPercentage = 100 - movieWatchedPercentage;

  // Calculate percentages for the ratings distribution
  const totalRatingCount = Object.values(stats.ratings.distribution).reduce((sum, count) => sum + count, 0);
  const ratingDistribution = Object.entries(stats.ratings.distribution).map(([rating, count]) => ({
    rating: parseInt(rating),
    count,
    percentage: Math.round((count / totalRatingCount) * 100) || 0
  })).sort((a, b) => b.rating - a.rating);

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={3} mb="md">My Stats</Title>

      <Grid gutter="md">
        {/* Watched Stats */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">Watched</Title>
            <Flex gap="md" direction={{ base: 'column', sm: 'row' }} align="center">
              <RingProgress
                size={150}
                thickness={16}
                roundCaps
                label={
                  <Text ta="center" fw={700} size="lg">
                    {totalWatched}
                    <Text size="xs">Items</Text>
                  </Text>
                }
                sections={[
                  { value: movieWatchedPercentage, color: 'blue' },
                  { value: episodeWatchedPercentage, color: 'teal' }
                ]}
              />
              <Stack gap="xs" style={{ flex: 1 }}>
                <Group gap="xs">
                  <IconMovie size={20} color="blue" />
                  <Text>Movies: {stats.movies.watched}</Text>
                </Group>
                <Group gap="xs">
                  <IconDeviceTv size={20} color="teal" />
                  <Text>Episodes: {stats.episodes.watched}</Text>
                </Group>
                <Group gap="xs">
                  <IconClock size={20} />
                  <Text>Total Time: {formatMinutes(totalMinutes)}</Text>
                </Group>
                <Group gap="xs">
                  <Text size="sm">Total Plays: {totalPlays}</Text>
                </Group>
              </Stack>
            </Flex>
          </Paper>
        </Grid.Col>

        {/* Collection Stats */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">Collection</Title>
            <Stack gap="md">
              <Group gap="xs">
                <IconMovie size={20} color="blue" />
                <Text>Movies: {stats.movies.collected}</Text>
              </Group>
              <Group gap="xs">
                <IconDeviceTv size={20} color="teal" />
                <Text>Episodes: {stats.episodes.collected}</Text>
              </Group>
              <Text size="sm">Total Items: {totalCollected}</Text>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Ratings Stats */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">Ratings</Title>
            <Stack gap="md">
              <Group gap="xs">
                <IconStar size={20} color="yellow" />
                <Text>Total Ratings: {totalRatings}</Text>
              </Group>
              <Stack gap="xs">
                {ratingDistribution.slice(0, 5).map(({ rating, count, percentage }) => (
                  <Group key={rating} gap="xs" grow>
                    <Text size="sm" w={50}>{rating}/10:</Text>
                    <Progress value={percentage} size="sm" color={rating >= 7 ? 'green' : rating >= 4 ? 'yellow' : 'red'} />
                    <Text size="sm" w={50}>{count}</Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Grid.Col>

        {/* Social Stats */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="xs" p="md" withBorder>
            <Title order={4} mb="md">Social</Title>
            <Stack gap="md">
              <Group gap="xs">
                <IconUsers size={20} />
                <Text>Friends: {stats.network.friends}</Text>
              </Group>
              <Group gap="xs">
                <IconUsers size={20} />
                <Text>Followers: {stats.network.followers}</Text>
              </Group>
              <Group gap="xs">
                <IconUsers size={20} />
                <Text>Following: {stats.network.following}</Text>
              </Group>
              <Group gap="xs">
                <IconMessageCircle2 size={20} />
                <Text>Comments: {totalComments}</Text>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Card>
  );
}