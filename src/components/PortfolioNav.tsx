'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Camera, Bell } from '@phosphor-icons/react';

const navItems = [
  { href: '/', icon: House, label: 'Hub', inactiveBg: 'bg-white', inactiveIcon: 'text-[#1a1a1a]' },
  { href: '/bonsai', icon: Camera, label: 'Bonsai', inactiveBg: 'bg-white', inactiveIcon: 'text-[#1a1a1a]' },
  { href: '#', icon: Bell, label: 'Soon', inactiveBg: 'bg-[#fdeed6]', inactiveIcon: 'text-[#1a1a1a]', disabled: true },
];

export default function PortfolioNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed left-[107px] top-1/2 z-20 -translate-y-1/2">
      <ul className="flex flex-col gap-4 rounded-[8px] border border-[#e1dcd3] p-2">
        {navItems.map(({ href, icon: Icon, label, inactiveBg, inactiveIcon, disabled }) => {
          const isActive = pathname === href;
          const bgClass = isActive ? 'bg-[#474747]' : inactiveBg;
          const iconClass = isActive ? 'text-white' : inactiveIcon;

          const itemContent = (
            <div className={`${bgClass} flex items-center justify-center p-2 rounded-[8px] transition-colors duration-150`}>
              <Icon size={32} className={iconClass} />
            </div>
          );

          if (disabled) {
            return (
              <li key={label}>
                <span aria-hidden="true" className="block">{itemContent}</span>
              </li>
            );
          }

          return (
            <li key={label}>
              <Link
                href={href}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="block"
              >
                {itemContent}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
