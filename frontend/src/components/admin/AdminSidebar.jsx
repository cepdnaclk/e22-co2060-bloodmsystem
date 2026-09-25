
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import {
  Activity,
  Users,
  Droplet,
  FileText,
  CheckCircle,
  Menu,
  X,
  LogOut,
  Settings,
  Calendar,
  Boxes,
} from 'lucide-react';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarLinks = [
    { path: '/admin', icon: Activity, label: 'Dashboard' },
    { path: '/admin?tab=donors', icon: Users, label: 'Manage Donors' },
    { path: '/admin?tab=camps', icon: Calendar, label: 'Camp Organizers' },
    { path: '/admin/doctors', icon: Users, label: 'Doctors' },
    { path: '/admin/inventory', icon: Droplet, label: 'Inventory' },
    { path: '/admin/check-inventory', icon: Boxes, label: 'Check Stock' },
    { path: '/admin/requests', icon: FileText, label: 'Blood Requests' },
    { path: '/admin/donations', icon: CheckCircle, label: 'Donations' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && window.innerWidth <= 768 && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo">
          <Droplet className="sidebar-logo-icon" size={28} style={{ fill: 'currentColor' }} />
          <div className="sidebar-branding">
            <h2>HOPEDROP</h2>
            <p>Admin Panel</p>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarLinks.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={() => {
                const currentPath = location.pathname + location.search;
                const isActive = currentPath === path || (path === '/admin' && location.pathname === '/admin' && !location.search);
                return `nav-item ${isActive ? 'active' : ''}`;
              }}
              onClick={closeSidebar}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.username || 'Admin'}</p>
              <p className="user-email">{user?.email || 'admin@hopedrop.com'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="nav-item logout-btn"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Toggle (Floating) */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="menu-toggle floating-toggle"
          aria-label="Toggle menu"
        >
          <Menu size={24} />
        </button>
      )}
    </>
  );
};

export default AdminSidebar;