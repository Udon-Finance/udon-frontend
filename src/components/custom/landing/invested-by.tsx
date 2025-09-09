import React from 'react';
import { Typography } from '@/components/common/typography';
import Image from 'next/image';

export const BackedBySection: React.FC = () => {
  return (
    <section className="min-h-[100vh] sm:min-h-[80vh]">
      <div className="container mx-auto flex flex-col items-center py-32 md:py-40 px-6 md:px-20">
        <div className="absolute w-[50vw] h-[200px] rounded-full blur-[100px] bg-[#8ab7f669]/40 z-0"></div>
        <div className="max-w-xl w-full flex flex-col items-center z-10">
          <Typography
            as="h2"
            className="text-4xl md:text-10xl text-center text-foreground font-normal"
          >
            Invested by
          </Typography>

          <div className="relative w-[384px] h-[88px] mt-4 md:mt-6 mr-5">
            <Image
              alt="logo"
              src="/images/landing/backedby/chromia.png"
              fill
              className="object-contain transition-all duration-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
