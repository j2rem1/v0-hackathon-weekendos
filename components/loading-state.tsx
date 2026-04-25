"use client";

import { motion } from "framer-motion";

const PLANNING_MESSAGES = [
  "Checking venue hours...",
  "Calculating transit times...",
  "Matching your vibe...",
  "Optimizing budget...",
  "Finalizing plan...",
];

export function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-16"
    >
      {/* Animated dots */}
      <div className="flex gap-2 mb-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-primary"
            animate={{
              y: [0, -12, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>

      {/* Rotating messages */}
      <div className="h-6 overflow-hidden">
        <motion.div
          animate={{
            y: [0, -24, -48, -72, -96],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            times: [0, 0.2, 0.4, 0.6, 0.8],
            ease: "easeInOut",
          }}
        >
          {PLANNING_MESSAGES.map((message, i) => (
            <div
              key={i}
              className="h-6 flex items-center justify-center text-sm text-muted-foreground"
            >
              {message}
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
