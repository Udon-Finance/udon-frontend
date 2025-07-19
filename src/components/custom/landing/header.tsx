import React from 'react';
import { Typography } from '@/components/common/typography';
import Image from 'next/image';
import { Button } from '@/components/common/button';
import { useRouter } from 'next/navigation';
import { ShineBorder } from '@/components/common/shine-border';
import { SparklesIcon } from 'lucide-react';
import { cn } from '@/utils/tailwind';

// Testnet badge component
const TestnetBadge = () => {
  return (
    <div
      className={cn(
        'relative overflow-hidden inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium',
        'absolute right-[-54px] top-[-15px]',
        'bg-black/5'
      )}
    >
      <ShineBorder shineColor={['#36B1FF', '#E4F5FF']} duration={10} />
      <SparklesIcon className="w-3 h-3" />
      <Typography weight="medium" className="text-[8px] uppercase text-bold">
        Testnet
      </Typography>
    </div>
  );
};

export const Header: React.FC = () => {
  const router = useRouter();
  return (
    <div className="fixed top-0 left-0 right-0 z-[20] flex flex-row px-4 sm:px-16 justify-between items-center py-4 bg-white/0 backdrop-blur-md border-b border-border">
      <div className="w-[94px] h-[46px] relative cursor-pointer" onClick={() => router.push('/')}>
        <Image src="/logo/logo-shorttext-black.png" alt="Logo" fill className="object-contain" />
        <TestnetBadge />
      </div>
      <Button
        variant="default"
        onClick={() => {
          router.push('/dashboard');
        }}
      >
        <Typography size="base" weight="medium">
          Launch App
        </Typography>
      </Button>
    </div>
  );
};
