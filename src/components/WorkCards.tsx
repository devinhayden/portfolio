"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";

export type Project = {
  title: string;
  status: string;
  description: string;
  background?: string;
  mockup?: string;
  /** Intrinsic pixel size of the mockup file, used to render every mockup at the same height. */
  mockupWidth?: number;
  mockupHeight?: number;
  /** Left position (px) of the mockup within the collapsed 200px card. */
  mockupOffset?: number;
};

const CARD_EXPANDED_WIDTH = 600;
const MOCKUP_HEIGHT = 400;
const CARD_TRANSITION = { duration: 0.75, ease: [0.65, 0, 0.35, 1] as const };

function getMockupDisplayWidth(project: Project) {
  if (!project.mockupWidth || !project.mockupHeight) return MOCKUP_HEIGHT;
  return (MOCKUP_HEIGHT * project.mockupWidth) / project.mockupHeight;
}

export function WorkCards({ projects }: { projects: Project[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div ref={scrollRef} className="scrollbar-hide -mx-6 w-full overflow-x-auto overflow-y-hidden">
      <div className="flex w-max gap-[12px] px-[63px]">
        {projects.map((project, index) => {
          const expanded = index === activeIndex;
          const mockupWidth = getMockupDisplayWidth(project);
          const mockupExpandedLeft = (CARD_EXPANDED_WIDTH - mockupWidth) / 2;
          return (
            <motion.div
              key={project.title}
              onMouseEnter={() => setActiveIndex(index)}
              animate={{ width: expanded ? CARD_EXPANDED_WIDTH : 200 }}
              transition={CARD_TRANSITION}
              className="relative h-[456px] shrink-0 overflow-hidden rounded-lg bg-[#d9d9d9]"
            >
              {project.background && (
                <Image
                  src={project.background}
                  alt=""
                  fill
                  sizes="600px"
                  className="object-cover"
                />
              )}
              {project.mockup && (
                <motion.div
                  animate={{
                    left: expanded
                      ? mockupExpandedLeft
                      : (project.mockupOffset ?? 0),
                  }}
                  transition={CARD_TRANSITION}
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ width: mockupWidth, height: MOCKUP_HEIGHT }}
                >
                  <Image
                    src={project.mockup}
                    alt={`${project.title} interface`}
                    fill
                    sizes={`${Math.round(mockupWidth)}px`}
                    className="object-contain"
                  />
                </motion.div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[16px] leading-[1.4] font-medium text-white">
                    {project.title}
                  </span>
                  <span className="rounded-sm bg-white/25 px-1 py-0.5 text-[10px] leading-[1.4] font-medium text-white">
                    {project.status}
                  </span>
                </div>
                <p className="text-[14px] leading-[1.4] text-white">
                  {project.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
