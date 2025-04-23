import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAtom } from 'jotai';
import { isAuthenticatedAtom, logout } from '../../store/auth';
import { 
  AppShell,
  Burger,
  NavLink,
  Divider,
  Group,
  Title,
  Button,
  ScrollArea
} from '@mantine/core';
import {
  IconHome,
  IconHistory,
  IconPhoto,
  IconStar,
  IconChartBar,
  IconFileDownload,
  IconSettings,
  IconLogout
} from '@tabler/icons-react';

const DRAWER_WIDTH = 240;

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAuthenticatedAtom);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await logout(
      setIsAuthenticated,
      () => {}, // setLoading
      () => {}  // setError
    );
  };

  const menuItems = [
    { text: 'Dashboard', icon: <IconHome size={20} />, path: '/' },
    { text: 'History', icon: <IconHistory size={20} />, path: '/history' },
    { text: 'Collection', icon: <IconPhoto size={20} />, path: '/collection' },
    { text: 'Ratings', icon: <IconStar size={20} />, path: '/ratings' },
    { text: 'Stats', icon: <IconChartBar size={20} />, path: '/stats' },
    { text: 'Export', icon: <IconFileDownload size={20} />, path: '/export' },
    { text: 'Settings', icon: <IconSettings size={20} />, path: '/settings' },
  ];

  // For unauthenticated users, show a simplified layout with just Settings
  if (!isAuthenticated) {
    return (
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: DRAWER_WIDTH,
          breakpoint: 'sm',
          collapsed: { mobile: !mobileOpen }
        }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger
                opened={mobileOpen}
                onClick={handleDrawerToggle}
                hiddenFrom="sm"
                size="sm"
              />
              <Title order={4}>Traktarr</Title>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <AppShell.Section>
            <Group justify="space-between" mb="xs">
              <Title order={5}>Trakt Export</Title>
            </Group>
          </AppShell.Section>

          <Divider my="sm" />

          <AppShell.Section grow component={ScrollArea}>
            <NavLink
              component={Link}
              to="/settings"
              label="Settings"
              leftSection={<IconSettings size={20} />}
              active={location.pathname === '/settings'}
              variant="filled"
              mb="xs"
            />
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main>
          {children}
        </AppShell.Main>
      </AppShell>
    );
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: DRAWER_WIDTH,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpen }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={mobileOpen}
              onClick={handleDrawerToggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={4}>Traktarr</Title>
          </Group>
          <Button variant="subtle" onClick={handleLogout} visibleFrom="sm">
            Logout
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section>
          <Group justify="space-between" mb="xs">
            <Title order={5}>Trakt Export</Title>
          </Group>
        </AppShell.Section>

        <Divider my="sm" />

        <AppShell.Section grow component={ScrollArea}>
          {menuItems.map((item) => (
            <NavLink
              key={item.text}
              component={Link}
              to={item.path}
              label={item.text}
              leftSection={item.icon}
              active={location.pathname === item.path}
              variant="filled"
              mb="xs"
            />
          ))}
        </AppShell.Section>

        <Divider my="sm" />

        <AppShell.Section>
          <NavLink
            label="Logout"
            leftSection={<IconLogout size={20} />}
            onClick={handleLogout}
            variant="subtle"
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}