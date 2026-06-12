'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import TransitionLink from './TransitionLink';

export interface ProjectData {
  src: string;
  alt?: string;
  title: string;
  label: string;
  href?: string;
  description?: string;
}

interface ProjectModalProps {
  project: ProjectData | null;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = project ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [project]);

  const isVideo = project ? /\.(mp4|webm|mov)$/i.test(project.src) : false;

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Modal */}
          <motion.div
            className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto bg-[#f8f6f2]"
            initial={{ scale: 0.80, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 z-10 font-mono text-[11px] font-medium text-[#2c2c2c]/40 transition-colors hover:text-[#2c2c2c]"
            >
              ESC
            </button>

            {/* Media */}
            <div className="w-full bg-white/60 p-6">
              {isVideo ? (
                <video
                  src={project.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-auto w-full"
                />
              ) : (
                <Image
                  src={project.src}
                  alt={project.alt ?? ''}
                  width={0}
                  height={0}
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="h-auto w-full"
                />
              )}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-2 p-6">
              <p className="font-geist text-[14px] font-medium text-[#2c2c2c]">{project.title}</p>
              <p className="font-mono text-[12px] font-medium uppercase text-[#888]">{project.label}</p>
              {project.description && (
                <p className="mt-2 font-geist text-[14px] leading-relaxed text-[#2c2c2c]/60">
                  {project.description}
                </p>
              )}
              {project.href && (
                <TransitionLink
                  href={project.href}
                  className="mt-4 inline-flex items-center gap-1.5 font-mono text-[13px] font-medium text-[#2c2c2c]/50 transition-colors hover:text-[#2c2c2c]"
                >
                  VIEW CASE STUDY
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </TransitionLink>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
