"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-md"
          />

          {/* 3D Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20, rotateX: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative z-10 w-full max-w-md rounded-3xl bg-white p-7 border border-sky-100 shadow-[0_25px_60px_-15px_rgba(2,132,199,0.3)] overflow-hidden"
          >
            {/* Top decorative gradient bar */}
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0284C7] via-[#0A567D] to-[#2563EB]" />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
