import React from 'react';
import { Link, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import {
  Factory,
  HardDrive,
  Home,
  Users,
  BetweenHorizontalEnd,
  ShieldAlert,
} from 'lucide-react';
import Logo from '../../layouts/Logo';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const navItems = [
  {
    title: 'Dashboard',
    icon: Home,
    href: '/national/home',
  },
  {
    title: 'Devices',
    icon: HardDrive,
    href: '/national/devices',
  },
  {
    title: 'Data',
    icon: BetweenHorizontalEnd,
    href: '/national/data',
  },
  {
    title: 'Data Alert',
    icon: ShieldAlert,
    href: '/national/dataalert',
  },
  {
    title: 'Factories',
    icon: Factory,
    href: '/national/factories',
  },
  {
    title: 'Users',
    icon: Users,
    href: '/national/users',
  }

];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, className, ...props }) => {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = React.useState(false);
  const location = useLocation();
  const toggleDesktopSidebar = () => {
    setIsDesktopCollapsed(!isDesktopCollapsed);
  };

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-40 transition-all duration-300 bg-[#4588B2] flex flex-col h-full',
        {
          'w-64': isOpen || !isDesktopCollapsed,
          'lg:w-16': isDesktopCollapsed,
          '-translate-x-full': !isOpen,
          'lg:translate-x-0': true,
        },
        className
      )}
      {...props}
    >
      <button
        onClick={toggleSidebar}
        className="lg:hidden flex items-center justify-center h-8 w-8 absolute -right-8 top-8 rounded-full bg-black text-white hover:bg-gray-800 transition-colors shadow-lg"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? (
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>
      <button
        onClick={toggleDesktopSidebar}
        className="hidden lg:flex items-center justify-center h-8 w-8 absolute -right-4 top-8 rounded-full bg-black text-white hover:bg-gray-800 transition-colors shadow-lg"
        aria-label="Toggle desktop sidebar"
      >
        <svg
          className={cn('h-4 w-4 transition-transform duration-300', {
            'rotate-180': isDesktopCollapsed
          })}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>


      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className={cn('hidden lg:flex items-center px-4', {
          'justify-center': isDesktopCollapsed,
          'justify-between': !isDesktopCollapsed,
        })}>
          <Logo />
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.href}
                className={cn(
                  'group flex items-center py-2 text-sm font-medium rounded-md transition-all duration-300',
                  'hover:bg-white hover:text-[#4588B2]',
                  {
                    'bg-white text-[#4588B2]': location.pathname === item.href || location.pathname.startsWith(item.href + '/'),
                    'text-gray-300': location.pathname !== item.href && !location.pathname.startsWith(item.href + '/'),
                    'px-4 justify-start': true,
                    'lg:justify-center lg:px-2': isDesktopCollapsed
                  }
                )}
                title={isDesktopCollapsed ? item.title : undefined}
              >
                <Icon className={cn('h-6 w-6 shrink-0', {
                  'mr-3': true,
                  'lg:mr-0': isDesktopCollapsed
                })} />
                <span className={cn('transition-opacity duration-300', {
                  'lg:hidden': isDesktopCollapsed
                })}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};