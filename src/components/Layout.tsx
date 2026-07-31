import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Dumbbell, Languages, FileText, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/', icon: Home, label: '首页' },
  { path: '/english', icon: Languages, label: '英语' },
  { path: '/reading', icon: BookOpen, label: '阅读' },
  { path: '/sports', icon: Dumbbell, label: '运动' },
  { path: '/report', icon: FileText, label: '周报' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">玄</span>
          </div>
          <span className="font-semibold text-gray-800 text-lg">玄英拾光</span>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center active:bg-gray-100"
        >
          <Settings size={18} className="text-gray-500" />
        </button>
      </header>

      {/* Content */}
      <main className="px-4 pt-4 pb-4 animate-fade-in">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 min-w-[56px] transition-colors ${
                active ? 'text-primary-700' : 'text-gray-400'
              }`}
            >
              <item.icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* PWA Install Banner */}
      {showInstall && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[400px] bg-primary-700 text-white rounded-2xl p-4 shadow-xl animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">添加到手机桌面</p>
              <p className="text-xs text-primary-100 mt-0.5">像App一样使用玄英拾光</p>
            </div>
            <button
              onClick={() => setShowInstall(false)}
              className="px-4 py-2 bg-white text-primary-700 rounded-xl text-sm font-medium"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
