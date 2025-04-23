import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { 
  statsAtom, 
  statsLoadingAtom, 
  statsErrorAtom, 
  fetchStats,
  historyAtom,
  historyLoadingAtom,
  fetchHistory
} from '../store/data';
import { 
  Title, 
  Text, 
  Card, 
  Button, 
  Box,
  Loader,
  Paper,
  Group,
  Grid,
  Avatar,
  List,
  Flex
} from '@mantine/core';
import { 
  IconMovie, 
  IconDeviceTv 
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [stats, setStats] = useAtom(statsAtom);
  const [statsLoading, setStatsLoading] = useAtom(statsLoadingAtom);
  const [statsError, setStatsError] = useAtom(statsErrorAtom);
  
  const [history, setHistory] = useAtom(historyAtom);
  const [historyLoading, setHistoryLoading] = useAtom(historyLoadingAtom);

  useEffect(() => {
    // Fetch initial data
    fetchStats(setStats, setStatsLoading, setStatsError);
    fetchHistory(setHistory, setHistoryLoading, () => {}, { limit: 5 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box className="page-container">
      <Title order={2} mb="xl">Dashboard</Title>
      
      <Paper shadow="sm" p="xl" mb="xl" withBorder className="data-card">
        <Title order={3} mb="md">Your Trakt Stats</Title>
        
        {statsLoading ? (
          <Flex justify="center" p="md">
            <Loader />
          </Flex>
        ) : statsError ? (
          <Text c="red">{statsError}</Text>
        ) : stats ? (
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder h="100%" className="data-card">
                <Title order={4} mb="xs">Movies</Title>
                <Text>
                  <Text span fw={700} className="color-movies">Watched:</Text> {stats.movies.watched}
                </Text>
                <Text>
                  <Text span fw={700} className="color-movies">Plays:</Text> {stats.movies.plays}
                </Text>
                <Text>
                  <Text span fw={700} className="color-movies">Collected:</Text> {stats.movies.collected}
                </Text>
                <Text>
                  <Text span fw={700} className="color-movies">Ratings:</Text> {stats.movies.ratings}
                </Text>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder h="100%" className="data-card">
                <Title order={4} mb="xs">Shows</Title>
                <Text>
                  <Text span fw={700} className="color-shows">Watched:</Text> {stats.shows.watched}
                </Text>
                <Text>
                  <Text span fw={700} className="color-shows">Collected:</Text> {stats.shows.collected}
                </Text>
                <Text>
                  <Text span fw={700} className="color-shows">Ratings:</Text> {stats.shows.ratings}
                </Text>
              </Card>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder h="100%" className="data-card">
                <Title order={4} mb="xs">Episodes</Title>
                <Text>
                  <Text span fw={700} className="color-shows">Watched:</Text> {stats.episodes.watched}
                </Text>
                <Text>
                  <Text span fw={700} className="color-shows">Plays:</Text> {stats.episodes.plays}
                </Text>
                <Text>
                  <Text span fw={700} className="color-shows">Collected:</Text> {stats.episodes.collected}
                </Text>
                <Text>
                  <Text span fw={700} className="color-shows">Ratings:</Text> {stats.episodes.ratings}
                </Text>
              </Card>
            </Grid.Col>
          </Grid>
        ) : (
          <Text>No stats available</Text>
        )}
      </Paper>
      
      <Paper shadow="sm" p="xl" mb="xl" withBorder className="data-card">
        <Title order={3} mb="md">Recent Activity</Title>
        
        {historyLoading ? (
          <Flex justify="center" p="md">
            <Loader />
          </Flex>
        ) : history.length > 0 ? (
          <List spacing="xs">
            {history.slice(0, 5).map((item) => (
              <List.Item
                key={item.id}
                icon={
                  <Avatar radius="xl" size="md">
                    {item.type === 'movie' ? <IconMovie size={20} /> : <IconDeviceTv size={20} />}
                  </Avatar>
                }
              >
                <Text fw={500}>
                  {item.type === 'movie'
                    // @ts-expect-error: ai moment
                    ? item.movie?.title || 'Unknown Movie'
                    // @ts-expect-error: ai moment
                    : `${item.show?.title || 'Unknown Show'} - ${item.episode?.title || 'Unknown Episode'}`
                  }
                </Text>
                <Text size="sm" c="dimmed">
                  {new Date(item.watched_at).toLocaleDateString()}
                </Text>
              </List.Item>
            ))}
          </List>
        ) : (
          <Text>No recent activity</Text>
        )}
      </Paper>
      
      <Paper shadow="sm" p="xl" withBorder>
        <Title order={3} mb="md">Quick Links</Title>
        
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="md" radius="md" withBorder className="data-card">
              <Title order={4} mb="xs">History</Title>
              <Text size="sm" c="dimmed" mb="md">
                View your complete watch history
              </Text>
              <Group justify="flex-start">
                <Button component={Link} to="/history" variant="light">
                  View History
                </Button>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="md" radius="md" withBorder className="data-card">
              <Title order={4} mb="xs">Collection</Title>
              <Text size="sm" c="dimmed" mb="md">
                Browse your collected movies and shows
              </Text>
              <Group justify="flex-start">
                <Button component={Link} to="/collection" variant="light">
                  View Collection
                </Button>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="md" radius="md" withBorder className="data-card">
              <Title order={4} mb="xs">Ratings</Title>
              <Text size="sm" c="dimmed" mb="md">
                See all your ratings
              </Text>
              <Group justify="flex-start">
                <Button component={Link} to="/ratings" variant="light">
                  View Ratings
                </Button>
              </Group>
            </Card>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" padding="md" radius="md" withBorder className="data-card">
              <Title order={4} mb="xs">Export</Title>
              <Text size="sm" c="dimmed" mb="md">
                Export your Trakt data
              </Text>
              <Group justify="flex-start">
                <Button component={Link} to="/export" variant="light">
                  Export Data
                </Button>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>
      </Paper>
    </Box>
  );
}