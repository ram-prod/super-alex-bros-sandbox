import { motion } from 'framer-motion';

export default function BackButton({ onClick, label = 'Back' }) {
  return (
    <motion.button
      onClick={onClick}
      className="group flex items-center gap-2"
      whileHover={{ x: -4 }}
      whileTap={{ scale: 0.93 }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2 border-2 border-gray-600/60 bg-gray-900/80 backdrop-blur-sm
          text-gray-400 text-sm font-bold uppercase tracking-wider
          group-hover:border-cyan-400/60 group-hover:text-cyan-300 group-hover:bg-cyan-500/10
          group-hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]
          transition-all duration-200"
        style={{ transform: 'skewX(-10deg)' }}
      >
        <span style={{ transform: 'skewX(10deg)' }} className="flex items-center gap-2">
          <span className="text-lg">‹</span>
          <span>{label}</span>
        </span>
      </div>
    </motion.button>
  );
}
