'use client';

import Hero from '@/components/custom/landing/hero';
import React, { useEffect, useState, useRef } from 'react';
import { BackedBySection } from '@/components/custom/landing/invested-by';
import { UpcomingFeatures } from '@/components/custom/landing/upcoming-features';
import { Header } from '@/components/custom/landing/header';
import { InfrastructureSection } from '@/components/custom/landing/infrastructure';
import { Footer } from '@/components/layout/footer';
import { cn } from '@/utils/tailwind';

export const Landing = () => {
  const [visibleSections, setVisibleSections] = useState<{
    [key: string]: boolean;
  }>({
    hero: false,
    infrastructure: false,
    backedBy: false,
    upcoming: false,
    footer: false,
  });

  // Refs for sections
  const sectionRefs = {
    hero: useRef<HTMLDivElement>(null),
    infrastructure: useRef<HTMLDivElement>(null),
    backedBy: useRef<HTMLDivElement>(null),
    upcoming: useRef<HTMLDivElement>(null),
    footer: useRef<HTMLDivElement>(null),
  };

  // Add intersection observer to handle section animations on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15, // Trigger when 15% of the section is visible
    };

    const observerCallback: IntersectionObserverCallback = entries => {
      entries.forEach(entry => {
        const sectionId = entry.target.getAttribute('data-section-id');
        if (sectionId && entry.isIntersecting) {
          setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        ref.current.setAttribute('data-section-id', key);
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Define animation classes for sections
  const getSectionAnimationClass = (sectionId: string) => {
    return visibleSections[sectionId]
      ? 'opacity-100 translate-y-0 transition-all duration-1000'
      : 'opacity-0 translate-y-16 transition-all duration-1000';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Content */}
      <div className="relative flex flex-col min-h-screen">
        <Header />

        <div ref={sectionRefs.hero} className={getSectionAnimationClass('hero')}>
          <Hero />
        </div>

        <div
          ref={sectionRefs.infrastructure}
          className={getSectionAnimationClass('infrastructure')}
        >
          <InfrastructureSection />
        </div>

        <div ref={sectionRefs.backedBy} className={getSectionAnimationClass('backedBy')}>
          <BackedBySection />
        </div>

        <div
          ref={sectionRefs.upcoming}
          className={cn(getSectionAnimationClass('upcoming'), 'pb-[20vh]')}
        >
          <UpcomingFeatures />
        </div>

        <div ref={sectionRefs.footer} className={getSectionAnimationClass('footer')}>
          <Footer />
        </div>
      </div>
    </div>
  );
};
