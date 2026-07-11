import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TeamMember, SectionKey } from '../store/teamStore';
import TeamMemberCard from './TeamMemberCard';

interface Props {
  members: TeamMember[];
  compact?: boolean;
  hideBio?: boolean;
  currentSection?: SectionKey;
  currentGroup?: 'onekey' | 'vanstring';
}

const TeamCarousel: React.FC<Props> = ({ members, compact, hideBio, currentSection, currentGroup }) => {
  const trackRef  = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const targetVelocityRef = useRef(0);
  const currentVelocityRef = useRef(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const showArrows = members.length > 4;

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateArrows); ro.disconnect(); };
  }, [updateArrows]);

  const stopWheelAnimation = useCallback(() => {
    trackRef.current?.classList.remove('tc__track--wheel-scrolling');

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    lastFrameTimeRef.current = null;
    targetVelocityRef.current = 0;
    currentVelocityRef.current = 0;
  }, []);

  const runWheelAnimation = useCallback((time: number) => {
    const el = trackRef.current;
    if (!el) {
      stopWheelAnimation();
      return;
    }

    const lastFrameTime = lastFrameTimeRef.current ?? time;
    const frameScale = Math.min((time - lastFrameTime) / 16.67, 2);
    lastFrameTimeRef.current = time;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const currentVelocity = currentVelocityRef.current;
    const targetVelocity = targetVelocityRef.current;
    const nextVelocity = currentVelocity + (targetVelocity - currentVelocity) * 0.16;
    const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, el.scrollLeft + nextVelocity * frameScale));

    el.scrollLeft = nextScrollLeft;
    currentVelocityRef.current = nextVelocity * 0.92;
    targetVelocityRef.current *= 0.9;

    const isAtStart = nextScrollLeft <= 0;
    const isAtEnd = nextScrollLeft >= maxScrollLeft;
    const isPushingPastEdge = (isAtStart && targetVelocityRef.current < 0) || (isAtEnd && targetVelocityRef.current > 0);

    if (
      isPushingPastEdge ||
      (Math.abs(currentVelocityRef.current) < 0.1 && Math.abs(targetVelocityRef.current) < 0.1)
    ) {
      stopWheelAnimation();
      return;
    }

    animationFrameRef.current = requestAnimationFrame(runWheelAnimation);
  }, [stopWheelAnimation]);

  const handleWheel = useCallback((event: WheelEvent) => {
    const el = trackRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;

    const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : el.clientHeight;
    const deltaX = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? event.deltaX : event.deltaX * unit;
    const deltaY = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? event.deltaY : event.deltaY * unit;

    // Only capture horizontal-intent wheels; let vertical scrolls move the page, not the carousel.
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    event.preventDefault();
    el.classList.add('tc__track--wheel-scrolling');

    targetVelocityRef.current = Math.max(-140, Math.min(140, targetVelocityRef.current + deltaX * 0.18));

    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(runWheelAnimation);
    }
  }, [runWheelAnimation]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      stopWheelAnimation();
    };
  }, [handleWheel, stopWheelAnimation]);

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -el.clientWidth : el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="tc">
      {showArrows && (
        <motion.button
          className="tc__arrow tc__arrow--prev"
          onClick={() => scroll('left')}
          disabled={!canPrev}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </motion.button>
      )}

      <div ref={trackRef} className="tc__track">
        {members.map((m) => (
          <div key={m.id} className="tc__item">
            <TeamMemberCard member={m} compact={compact} hideBio={hideBio} currentSection={currentSection} currentGroup={currentGroup} />
          </div>
        ))}
      </div>

      {showArrows && (
        <motion.button
          className="tc__arrow tc__arrow--next"
          onClick={() => scroll('right')}
          disabled={!canNext}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          aria-label="Scroll right"
        >
          <ChevronRight size={20} strokeWidth={2} />
        </motion.button>
      )}
    </div>
  );
};

export default TeamCarousel;
