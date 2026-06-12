'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

interface ProjectCardProps {
  src: string;
  alt?: string;
  title: string;
  label: string;
  onClick?: () => void;
  padding?: string;
}

export default function ProjectCard({ src, alt = '', title, label, onClick, padding = 'p-6' }: ProjectCardProps) {
  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <button
        onClick={onClick}
        className="group flex w-full cursor-pointer flex-col gap-4 text-left"
      >
        <div className={`w-full bg-white/40 ${padding}`}>
          {/\.(mp4|webm|mov)$/i.test(src) ? (
            <video src={src} autoPlay loop muted playsInline className="h-auto w-full" />
          ) : (
            <Image
              src={src}
              alt={alt}
              width={0}
              height={0}
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="h-auto w-full"
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-geist text-[14px] font-medium text-[#2c2c2c]">{title}</p>
          <p className="font-mono text-[12px] font-medium uppercase text-[#888]">{label}</p>
        </div>
      </button>
    </motion.div>
  );
}
