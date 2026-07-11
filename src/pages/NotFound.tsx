import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound: React.FC = () => (
  <section className="flex min-h-[70vh] items-center justify-center px-6">
    <motion.div
      className="text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <p className="font-mono text-sm tracking-[0.3em] text-earth-400">404</p>
      <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">Page not found</h1>
      <p className="mx-auto mt-4 max-w-md text-stone-400">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="mt-8 inline-block">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-earth-400/40 hover:bg-earth-500/10"
        >
          ← Back home
        </Link>
      </motion.div>
    </motion.div>
  </section>
);

export default NotFound;
