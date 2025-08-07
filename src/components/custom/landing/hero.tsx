import { ChevronRight } from 'lucide-react';
import React from 'react';
import { StatCard } from './stat-card';
import { Button } from '@/components/common/button';
import { Typography } from '@/components/common/typography';
import { useRouter } from 'next/navigation';
import { useStatsSupplyDeposit } from '@/hooks/contracts/queries/use-stats-supply-deposit';

export default function Hero() {
  const router = useRouter();
  const { totalValueDeposited, totalValueBorrowed, isLoading } = useStatsSupplyDeposit();

  return (
    <div className="min-h-screen bg-background relative">
      <div className="container h-full flex flex-col justify-center pt-[10vh] md:pt-[20vh] relative z-10">
        {/* Main Content Section */}
        <div className="relative flex flex-col justify-center">
          {/* Background Video - Mobile Only (Centered) */}
          <div className="flex justify-center mb-6 md:hidden">
            <div className="w-full max-w-[300px] aspect-square">
              <video
                src="/images/landing/hero/cube-rotate.webm"
                autoPlay
                loop
                muted
                playsInline
                className="object-contain w-full h-full opacity-80"
              />
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
            {/* Left Column - Content */}
            <div className="col-span-1 md:col-span-3 space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Typography
                  as="h1"
                  weight="semibold"
                  className="text-6xl md:text-15xl leading-tight text-center md:text-left"
                >
                  Unlocking Liquidity
                </Typography>
                <Typography className="text-3xl md:text-10xl max-w-2xl text-center md:text-left">
                  Money Markets and Leverage on Chromia
                </Typography>
                <Typography
                  weight="medium"
                  className="text-xl md:text-2xl pt-2 text-center md:text-left"
                >
                  Udon Finance is your secure, efficient, and flexible solution for lending and
                  leverage.
                </Typography>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row items-center justify-center md:justify-start gap-3 pb-6 sm:pb-8 md:pb-16 pt-2 sm:pt-4 flex-wrap">
                {/* Earn Button */}
                <Button
                  variant={'gradient'}
                  className="flex flex-row flex-1 sm:flex-none sm:w-[140px] md:w-auto min-w-[100px] sm:min-w-[120px]"
                  onClick={() => {
                    router.push('/dashboard');
                  }}
                >
                  <Typography size="base" weight="normal">
                    Earn
                  </Typography>
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Borrow Button */}
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none sm:w-[140px] md:w-auto min-w-[100px] sm:min-w-[120px]"
                  onClick={() => {
                    router.push('/dashboard');
                  }}
                >
                  <Typography size="base" weight="normal">
                    Borrow
                  </Typography>
                  <ChevronRight className="w-4 h-4" />
                </Button>

                {/* Leveraged Yield Button */}
                <Button
                  badgeLabel="Coming Soon"
                  badgePosition="top-right"
                  badgeClassName="rotate-12 top-[-5px] right-[-10px] text-xs"
                  variant="disabled"
                  className="flex-1 sm:flex-none sm:w-[140px] md:w-auto min-w-[100px] sm:min-w-[120px]"
                >
                  <Typography size="base" weight="normal">
                    Leveraged Yield
                  </Typography>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Right Column - Background Video (Desktop Only) */}
            <div className="hidden md:block md:col-span-2 relative">
              <div className="absolute inset-0 w-[600px] aspect-square -translate-x-[20%] -top-[100px] -z-10">
                <video
                  src="/images/landing/hero/cube-rotate.webm"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-9 px-4 md:px-0 mt-4 sm:mt-0 relative z-20">
            <StatCard
              value={totalValueDeposited}
              label="Total Deposits"
              iconUrl={'/images/landing/hero/coin-stack.svg'}
              videoUrl={'/images/landing/hero/coin-stack.webm'}
              isLoading={isLoading}
            />
            <StatCard
              value={totalValueBorrowed}
              label="Total Borrows"
              iconUrl={'/images/landing/hero/saving-piggy.svg'}
              videoUrl={'/images/landing/hero/saving-piggy.webm'}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
