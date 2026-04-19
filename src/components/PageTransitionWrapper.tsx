'use client';

import { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAnimate } from 'motion/react';

const NavigateContext = createContext<(href: string) => void>(() => {});
export const useNavigate = () => useContext(NavigateContext);

export default function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const [scope, animate] = useAnimate();
  const pathname = usePathname();
  const router = useRouter();
  const wasNavigating = useRef(false);

  useEffect(() => {
    if (!wasNavigating.current) return;
    wasNavigating.current = false;
    animate(scope.current, { opacity: 1 }, { duration: 0.5, ease: 'easeOut' });
  }, [pathname, animate, scope]);

  const navigate = useCallback(async (href: string) => {
    wasNavigating.current = true;
    await animate(scope.current, { opacity: 0 }, { duration: 0.35, ease: 'easeIn' });
    router.push(href);
  }, [animate, scope, router]);

  return (
    <NavigateContext.Provider value={navigate}>
      <div ref={scope} className="h-full">
        {children}
      </div>
    </NavigateContext.Provider>
  );
}
