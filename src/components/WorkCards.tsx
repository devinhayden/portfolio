"use client";

import { useState } from "react";
import Image from "next/image";

export type Project = {
  title: string;
  status: string;
  description: string;
  background?: string;
  mockup?: string;
  /** Intrinsic pixel size of the mockup file, used to render every mockup at the same height. */
  mockupWidth?: number;
  mockupHeight?: number;
  /** Left position (px) of the mockup within the collapsed card. */
  mockupOffset?: number;
};

const COLLAPSED_WIDTH = 200;
const MOCKUP_HEIGHT = 220;
const TRANSITION = "0.75s cubic-bezier(0.65, 0, 0.35, 1)";

function getMockupDisplayWidth(project: Project) {
  if (!project.mockupWidth || !project.mockupHeight) return MOCKUP_HEIGHT;
  return (MOCKUP_HEIGHT * project.mockupWidth) / project.mockupHeight;
}

export function WorkCards({
  projects,
  defaultExpandedTitle,
}: {
  projects: Project[];
  defaultExpandedTitle?: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(() => {
    if (!defaultExpandedTitle) return null;
    const index = projects.findIndex((p) => p.title === defaultExpandedTitle);
    return index === -1 ? null : index;
  });

  return (
    <div className="flex min-h-0 w-full flex-1 gap-[12px]">
      {projects.map((project, index) => {
        const expanded = index === activeIndex;
        const mockupWidth = getMockupDisplayWidth(project);
        const mockupCollapsedLeft = (project.mockupOffset ?? 0) + mockupWidth / 2;
        return (
          <div
            key={project.title}
            onMouseEnter={() => setActiveIndex(index)}
            className="relative shrink-0 overflow-hidden rounded bg-[#d9d9d9]"
            style={{
              flexBasis: COLLAPSED_WIDTH,
              flexGrow: expanded ? 1 : 0,
              transition: `flex-grow ${TRANSITION}`,
            }}
          >
            {project.background && (
              <Image
                src={project.background}
                alt=""
                fill
                sizes="700px"
                className="object-cover"
              />
            )}
            {project.mockup && (
              <div
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: mockupWidth,
                  height: MOCKUP_HEIGHT,
                  left: expanded ? "50%" : mockupCollapsedLeft,
                  transition: `left ${TRANSITION}`,
                }}
              >
                <Image
                  src={project.mockup}
                  alt={`${project.title} interface`}
                  fill
                  sizes={`${Math.round(mockupWidth)}px`}
                  className="object-contain"
                />
              </div>
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 45%)",
              }}
            />
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
          </div>
        );
      })}
    </div>
  );
}
