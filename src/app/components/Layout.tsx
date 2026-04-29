import { Outlet, NavLink } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  Calendar, 
  Bot, 
  Sparkles, 
  Settings as SettingsIcon,
  Menu,
  X,
  Zap,
  LogOut,
  User
} from 'lucide-react';
import { signOut, getCurrentUser } from '../utils/authService';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const currentUser = getCurrentUser();

  // Close the topbar user menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    if (window.confirm('Are you sure you want to logout?')) {
      signOut();
    }
  };

  const initials = (currentUser?.name || currentUser?.email || 'M')
    .trim()
    .charAt(0)
    .toUpperCase();

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Keyword Management', path: '/keywords', icon: Target },
    { name: 'Content Calendar', path: '/calendar', icon: Calendar },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot },
    { name: 'AI Content Manager', path: '/content-manager', icon: Sparkles },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:block p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-700" />
              </button>
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-700" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Motopsy AI Marketing</h1>
                  <p className="text-xs text-slate-600">Social Media + SEO Automation</p>
                </div>
              </div>
            </div>
            
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {currentUser?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {currentUser?.email || 'motopsy.com'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {initials}
                </div>
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-[60]"
                >
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {currentUser?.name || 'Admin'}
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      {currentUser?.email || ''}
                    </p>
                  </div>
                  <NavLink
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Settings
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-200"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          } min-h-screen sticky top-16`}
        >
          <nav className="p-4 flex-1">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && <span className="font-medium">{item.name}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* User Info and Logout at Bottom */}
          <div className="p-4 border-t border-slate-200 space-y-2">
            {sidebarOpen && currentUser && (
              <div className="px-4 py-2 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-slate-600" />
                  <p className="text-xs font-semibold text-slate-900">{currentUser.name || 'Admin'}</p>
                </div>
                <p className="text-xs text-slate-600">{currentUser.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all font-medium"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* Sidebar - Mobile */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-slate-900/50"
              onClick={() => setMobileSidebarOpen(false)}
            ></div>
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 shadow-xl">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="font-bold text-slate-900">Menu</h2>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4">
                <ul className="space-y-2">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          end={item.path === '/'}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                              isActive
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`
                          }
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}