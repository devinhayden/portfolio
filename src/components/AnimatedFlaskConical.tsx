"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedFlaskConicalHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AnimatedFlaskConicalProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const G_VARIANTS: Variants = {
  initial: {
    y: 0,
    rotate: 0,
  },
  animate: {
    y: [0, -0.5, -0.5, 0],
    rotate: [0, 11, -11, 11, -11, 0],
    transition: {
      duration: 1.5,
      ease: "easeInOut",
    },
  },
};

const PATH_VARIANTS: Variants = {
  initial: {
    x: 0,
    y: 0,
    rotate: 0,
  },
  animate: {
    x: [0, -1, 1, -1, 1, 0],
    y: [0, 1, 1, 0],
    rotate: [0, -20, 20, -20, 20, 0],
    transition: {
      duration: 1.5,
      ease: "easeInOut",
    },
  },
};

const AnimatedFlaskConical = forwardRef<AnimatedFlaskConicalHandle, AnimatedFlaskConicalProps>(
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
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.g
            variants={G_VARIANTS}
            animate={controls}
            initial="initial"
          >
            <path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" />
            <motion.path
              d="M6.453 15h11.094"
              variants={PATH_VARIANTS}
              animate={controls}
              initial="initial"
            />
            <path d="M8.5 2h7" />
          </motion.g>
        </svg>
      </div>
    );
  }
);

AnimatedFlaskConical.displayName = "AnimatedFlaskConical";

export { AnimatedFlaskConical };
