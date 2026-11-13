import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setToken } from './lib/api';
import { useRoute, go } from './lib/router';
import { BottomNav, Spinner } from './components/ui';
import Auth from './pages/Auth';
import GroupSetup from './pages/GroupSetup';
import Home from './pages/Home';
import MyReport from './pages/MyReport';
import Snap from './pages/Snap';
import Me from './pages/Me';
import Sidebar from './components/Sidebar';

const GROUP_KEY = 'report.group';
const savedGroup = () => { try { return localStorage.getItem(GROUP_KEY); } catch { return null; } };

export default function App() {
  const route = useRoute();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState(null);
  const [groupId, setGroupIdState] = useState(savedGroup);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [loadError, setLoadError] = useState(null);

  const setGroupId = (id) => {
    setGroupIdState(id);
    try { localStorage.setItem(GROUP_KEY, id); } catch { /* ignore */ }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setGroups(null);
    go('/');
  }, []);

  const load = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    try {
      const [{ user: u }, { groups: g }] = await Promise.all([api('/auth/me'), api('/groups')]);
      setUser(u);
      setGroups(g);
    } catch (err) {
      if (err.status !== 401) setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    window.addEventListener('report:logout', logout);
    return () => window.removeEventListener('report:logout', logout);
  }, [logout]);

  const refreshGroups = useCallback(async () => {
    const { groups: g } = await api('/groups');
    setGroups(g);
    return g;
  }, []);

  if (loading) return <div className="page paper-grid"><Spinner text="Opening your journal…" /></div>;
  if (loadError) {
    return (
      <div className="page paper-grid">
        <div className="center">
          <p className="sub">{loadError}</p>
          <button type="button" className="btn primary" onClick={load}>Try again</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onDone={(u, token) => { setToken(token); setUser(u); load(); }} />;
  }

  const onGroupReady = async (g) => {
    await refreshGroups();
    setGroupId(g.id);
    go('/');
  };

  if (!groups || groups.length === 0 || route === '/join' || route === '/create') {
    return (
      <GroupSetup
        first={!groups || groups.length === 0}
        initialTab={route === '/create' ? 'create' : 'join'}
        onReady={onGroupReady}
        onLogout={logout}
      />
    );
  }

  const group = groups.find((g) => g.id === groupId) || groups[0];
  const shared = {
    user, setUser, group, groups, setGroupId, refreshGroups, logout,
  };

  let screen;
  if (route === '/report') screen = <MyReport {...shared} />;
  else if (route === '/snap') screen = <Snap {...shared} />;
  else if (route === '/me') screen = <Me {...shared} />;
  else screen = <Home {...shared} />;

  return (
    <div className="shell">
      <Sidebar route={route} group={group} />
      {screen}
      {route !== '/me' && <BottomNav route={route} />}
    </div>
  );
}
