import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Home, BarChart3, Calendar, User, LogOut, Settings, ShoppingBag, Egg } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve user data from localStorage as we are using custom Firestore-based login
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationCount] = useState(3);

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Successfully logged out');
    navigate('/');
  };

  const mainNavItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Egg, label: 'Egg Count', path: '/dashboard/egg-count' },
    { icon: BarChart3, label: 'Production Reports', path: '/dashboard/production-reports' },
    { icon: ShoppingBag, label: 'Feed Inventory', path: '/dashboard/feed-inventory' },
    { icon: Calendar, label: 'Schedule', path: '/dashboard/schedule' },
    { icon: Bell, label: 'Alerts', path: '/dashboard/alerts' },
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
  ];

  const bottomNavItems = [
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
    { icon: LogOut, label: 'Logout', action: handleLogout },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[#2D5016] text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/logo_quailfarm.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg leading-tight">Waje's Quail Farm</h1>
                <p className="text-xs text-white/60">Farm Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-white text-[#2D5016] shadow-lg'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
                {item.label === 'Alerts' && notificationCount > 0 && (
                  <span className="ml-auto bg-yellow-400 text-[#2D5016] text-xs font-bold px-2 py-0.5 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-white/10 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <button
                key={item.label}
                onClick={item.action || (() => item.path && navigate(item.path))}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-all"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-white/10 hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5 mx-auto" />
        </button>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mainNavItems.find(item => item.path === location.pathname)?.label || 'Farm Overview'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button
                onClick={() => navigate('/dashboard/alerts')}
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Bell className="w-6 h-6 text-gray-600" fill="#FFD700" stroke="#2D5016" strokeWidth={2} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* User Profile */}
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="flex items-center gap-3 hover:bg-gray-100 rounded-full pl-1 pr-4 py-1 transition-colors"
              >
                <div className="w-10 h-10 bg-[#2D5016] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.fullName || user.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">Farm Owner</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
