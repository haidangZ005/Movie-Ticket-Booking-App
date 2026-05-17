import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/movies', label: 'Movies', icon: 'movie' },
  { to: '/cinemas', label: 'Cinemas', icon: 'theaters' },
  { to: '/products', label: 'Products', icon: 'fastfood' },
  { to: '/vouchers', label: 'Vouchers', icon: 'local_offer' },
  { to: '/bookings', label: 'Bookings', icon: 'confirmation_number' },
  { to: '/customers', label: 'Customers', icon: 'group' },
  { to: '/transactions', label: 'Transactions', icon: 'receipt_long' },
  { to: '/analytics', label: 'Analytics', icon: 'analytics' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const accountType = localStorage.getItem('accountType') || 'ADMIN';

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accountType');
    navigate('/login');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-page-bg text-on-surface antialiased">
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-[240px] flex-col border-r border-border-default bg-surface md:flex">
        <div className="flex h-[64px] items-center border-b border-border-default px-6">
          <span className="material-symbols-outlined mr-2 text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>movie</span>
          <span className="text-[20px] font-bold text-on-surface">FlickTickets</span>
        </div>
        <div className="px-6 py-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-muted">Cinema Admin</p>
        </div>
        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-body-md transition-colors ${
                  isActive
                    ? 'border-l-4 border-primary bg-accent-soft font-semibold text-primary'
                    : 'text-on-surface-variant hover:bg-surface-variant/70'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <header className="fixed right-0 top-0 z-30 hidden h-[64px] w-[calc(100%-240px)] items-center justify-between border-b border-border-default bg-surface px-container-padding md:flex">
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input className="w-full rounded-lg border border-border-default bg-surface-container-low py-2 pl-10 pr-4 text-sm text-text-primary outline-none transition-shadow placeholder:text-text-muted focus:ring-2 focus:ring-primary/30" placeholder="Search" type="text" />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative rounded-full p-2 text-text-secondary transition-colors hover:bg-surface-container-low hover:text-primary" title="Notifications">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-surface bg-danger" />
          </button>
          <div className="flex items-center gap-3 border-l border-border-default pl-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-inverse-on-surface">A</div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-primary">Admin</span>
              <span className="text-xs capitalize text-text-muted">{accountType.replace('_', ' ')}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="ml-2 rounded-lg p-2 text-text-muted transition-colors hover:bg-danger-bg hover:text-danger"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="p-container-padding pt-[64px] md:ml-[240px]">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
