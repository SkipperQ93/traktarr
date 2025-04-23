import { ReactNode } from 'react';
import { GITHUB_URL } from '../config';
import {
  AppShell,
  Group,
  Title,
  NavLink,
  ActionIcon,
  rem,
  useMantineColorScheme,
  ScrollArea,
  Divider,
} from '@mantine/core';
import {
  IconHome,
  IconHistory,
  IconPhoto,
  IconStar,
  IconChartBar,
  IconFileDownload,
  IconSettings,
  IconLogout,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

const navLinks = [
  { label: 'Dashboard', icon: IconHome, to: '/' },
  { label: 'History', icon: IconHistory, to: '/history' },
  { label: 'Collection', icon: IconPhoto, to: '/collection' },
  { label: 'Ratings', icon: IconStar, to: '/ratings' },
  { label: 'Stats', icon: IconChartBar, to: '/stats' },
  { label: 'Export', icon: IconFileDownload, to: '/export' },
  { label: 'Settings', icon: IconSettings, to: '/settings' },
];

export default function AppLayout({ children, onLogout }: AppLayoutProps) {
  const location = useLocation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <AppShell
      padding="md"
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: true, desktop: false },
      }}
      header={{ height: 60 }}
      styles={{
        main: {
          background: 'var(--mantine-color-body)',
          minHeight: '100vh',
          paddingBottom: '2rem',
        },
        header: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },
        navbar: {
          boxShadow: '1px 0px 3px rgba(0, 0, 0, 0.05)',
        }
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Title order={3} fw={700} style={{ letterSpacing: '-1px' }}>
            Traktarr
          </Title>
          <ActionIcon
            variant="outline"
            color={colorScheme === 'dark' ? 'yellow' : 'blue'}
            onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
            size="lg"
            aria-label="Toggle color scheme"
          >
            {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              component={Link}
              to={link.to}
              label={link.label}
              leftSection={<link.icon size={20} />}
              active={location.pathname === link.to}
              variant="light"
              mb="xs"
              style={{ borderRadius: rem(8) }}
            />
          ))}
        </AppShell.Section>
        <Divider my="sm" />
        <AppShell.Section pb="md">
          <NavLink
            label="Logout"
            leftSection={<IconLogout size={20} />}
            onClick={onLogout}
            variant="subtle"
            color="red"
            style={{ borderRadius: rem(8) }}
          />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>
        {children}
        <footer
          style={{
            width: '100%',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--mantine-color-dimmed, #888)',
            marginTop: '2rem',
            padding: '1rem 0 0.5rem 0',
            opacity: 0.8,
          }}
        >
          Not affiliated with Trakt or trakt, inc. |{' '}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            GitHub
          </a>
        </footer>
      </AppShell.Main>
    </AppShell>
  );
}