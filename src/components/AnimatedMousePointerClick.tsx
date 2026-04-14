"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface AnimatedMousePointerClickHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AnimatedMousePointerClickProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const PATH_1_VARIANTS: Variants = {
  initial: { x: 0, y: 0, opacity: 1 },
  animate: {
    x: [-1, 6],
    y: [1, -5],
    opacity: [0, 1, 1, 0],
    transition: { duration: 0.7, ease: "easeIn", delay: 0.2 },
  },
};

const PATH_2_VARIANTS: Variants = {
  initial: { x: 0, y: 0, opacity: 1 },
  animate: {
    x: [1, -6],
    y: [1, -4],
    opacity: [0, 1, 1, 0],
    transition: { duration: 0.7, ease: "easeIn", delay: 0.2 },
  },
};

const PATH_3_VARIANTS: Variants = {
  initial: { x: 0, y: 0, opacity: 1 },
  animate: {
    x: [1, -5],
    y: [-1, 6],
    opacity: [0, 1, 1, 0],
    transition: { duration: 0.7, ease: "easeIn", delay: 0.2 },
  },
};

const PATH_4_VARIANTS: Variants = {
  initial: { x: 0, y: 0, opacity: 1 },
  animate: {
    x: [0, -2],
    y: [2, -6],
    opacity: [0, 1, 1, 0],
    transition: { duration: 0.6, ease: "easeIn", delay: 0.2 },
  },
};

const PATH_5_VARIANTS: Variants = {
  initial: { x: 0, y: 0, scale: 1, strokeWidth: 1.5 },
  animate: {
    x: [0, -2, 0],
    y: [0, -2, 0],
    scale: [1, 0.7, 1],
    strokeWidth: [1.5, 1.9, 1.5],
    transition: { duration: 0.5, ease: "easeOut", delay: 0.2 },
  },
};

const AnimatedMousePointerClick = forwardRef<
  AnimatedMousePointerClickHandle,
  AnimatedMousePointerClickProps
>(({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
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
        strokeWidth="1.5"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path d="M14 4.1 12 6" variants={PATH_1_VARIANTS} animate={controls} initial="initial" />
        <motion.path d="m5.1 8-2.9-.8" variants={PATH_2_VARIANTS} animate={controls} initial="initial" />
        <motion.path d="m6 12-1.9 2" variants={PATH_3_VARIANTS} animate={controls} initial="initial" />
        <motion.path d="M7.2 2.2 8 5.1" variants={PATH_4_VARIANTS} animate={controls} initial="initial" />
        <motion.path
          d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"
          stroke="currentColor"
          variants={PATH_5_VARIANTS}
          animate={controls}
          initial="initial"
        />
      </svg>
    </div>
  );
});

AnimatedMousePointerClick.displayName = "AnimatedMousePointerClick";

export { AnimatedMousePointerClick };
