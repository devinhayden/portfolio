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
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
  animate: {
    rotate: [0, -90],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
    },
  },
};

const PATH_VARIANTS: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
  animate: {
    pathLength: [0, 1],
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeInOut",
    },
  },
};

const AnimatedPencil = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
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
              d="M25.1739 10.8124C25.7026 10.2838 25.9997 9.56685 25.9998 8.81923C25.9999 8.07162 25.703 7.35459 25.1744 6.82588C24.6459 6.29717 23.9289 6.00009 23.1813 6C22.4337 5.99991 21.7166 6.2968 21.1879 6.82538L7.84193 20.1744C7.60975 20.4059 7.43805 20.6909 7.34193 21.0044L6.02093 25.3564C5.99509 25.4429 5.99314 25.5347 6.01529 25.6222C6.03743 25.7097 6.08285 25.7896 6.14673 25.8534C6.21061 25.9172 6.29055 25.9624 6.37809 25.9845C6.46563 26.0065 6.55749 26.0044 6.64393 25.9784L10.9969 24.6584C11.3101 24.5631 11.5951 24.3925 11.8269 24.1614L25.1739 10.8124Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18.9999 9L22.9999 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
          <motion.path
            d="M6 26C9.16667 29.5 17.6 34.4 26 26"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            variants={PATH_VARIANTS}
            animate={controls}
            initial="initial"
          />
        </svg>
      </div>
    );
  }
);

AnimatedPencil.displayName = "AnimatedPencil";

export { AnimatedPencil };
