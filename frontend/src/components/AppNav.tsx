import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';

export function AppNav() {
  return (
    <div className="app-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        <NavLink to="/dashboard" className="app-nav-brand">
          <Logo />
          Petri
        </NavLink>
        <div className="app-nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/board" className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}>
            Board
          </NavLink>
          <NavLink to="/archive" className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}>
            Archive
          </NavLink>
        </div>
      </div>
      <UserMenu />
    </div>
  );
}
