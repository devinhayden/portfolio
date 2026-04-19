'use client';

import { useNavigate } from './PageTransitionWrapper';

interface Props {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function TransitionLink({ href, children, className }: Props) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(href)} className={className}>
      {children}
    </button>
  );
}
