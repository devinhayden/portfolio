"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AnimatedIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const G_VARIANTS: Variants = {
  initial: {
    rotate: 0,
    x: 0,
  },
  animate: {
    rotate: [-8, 8, -8, 8, -8, 8, -8, 8],
    x: [0, 6],
    transition: {
      duration: 1,
      ease: "easeOut",
    },
  },
};

const PATH_VARIANTS: Variants = {
  initial: {
    pathLength: 1,
    pathOffset: 0,
    opacity: 1,
  },
  animate: {
    pathLength: [1, 0],
    pathOffset: [0, 1],
    opacity: [1, 1, 0],
    transition: {
      duration: 1,
      ease: "linear",
    },
  },
};

const AnimatedEraser = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("initial"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("initial");
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          viewBox="0 0 32 32"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.g
            variants={G_VARIANTS}
            animate={controls}
            initial="initial"
          >
            <path
              d="M6.58557 19.4141C6.96052 19.7891 10.5796 23.4131 10.5796 23.4131C10.5796 23.4131 11.4996 24.5 12.6665 25.5C13.8334 26.5 14.9996 25.5 14.9996 25.5L25.4136 15.4141C25.7885 15.039 25.9991 14.5304 25.9991 14.0001C25.9991 13.4697 25.7885 12.9611 25.4136 12.5861L19.4146 6.58607C19.2288 6.40027 19.0083 6.25288 18.7656 6.15232C18.5229 6.05176 18.2628 6 18.0001 6C17.7374 6 17.4772 6.05176 17.2345 6.15232C16.9918 6.25288 16.7713 6.40027 16.5856 6.58607L6.58557 16.5861C6.21063 16.9611 6 18.0001 6 18.0001C6 18.0001 6.21063 19.039 6.58557 19.4141Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9.99963 14L17.9996 22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
          <motion.path
            d="M14 26H22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={1}
            variants={PATH_VARIANTS}
            animate={controls}
            initial="initial"
          />
        </svg>
      </div>
    );
  }
);

AnimatedEraser.displayName = "AnimatedEraser";

export { AnimatedEraser };
