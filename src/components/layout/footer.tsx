import React from 'react';
import Image from 'next/image';
import { Typography } from '../common/typography';
import { GridPattern } from '../common/grid-pattern';
import { cn } from '@/utils/tailwind';
import Link from 'next/link';
import { env } from '@/utils/env';

const SocialIcon = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <svg
    className={cn('w-6 h-6 fill-current', className)}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
);

const linkFooter = [
  {
    title: 'Dashboard',
    url: '/dashboard',
  },
  {
    title: 'Docs',
    url: env.docs,
  },
  {
    title: 'Report Bug',
    url: env.reportBugFormUrl,
  },
];

const linkSocial = [
  {
    title: 'Twitter',
    url: 'https://x.com/udonfi_chromia',
    icon: (
      <SocialIcon>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </SocialIcon>
    ),
  },
  // {
  //   title: 'Discord',
  //   url: 'https://discord.gg/udonfinance',
  //   icon: (
  //     <SocialIcon>
  //       <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  //     </SocialIcon>
  //   ),
  // },
  // {
  //   title: 'Telegram',
  //   url: 'https://t.me',
  //   icon: (
  //     <SocialIcon>
  //       <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  //     </SocialIcon>
  //   ),
  // },
  {
    title: 'GitHub',
    url: 'https://github.com/udon-Finance',
    icon: (
      <SocialIcon>
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </SocialIcon>
    ),
  },
];

export const Footer: React.FC = () => {
  return (
    <footer className="relative flex flex-col w-full max-md:max-w-full sm:h-[450px] h-[300px] bg-black rounded-tr-[60px]">
      <GridPattern
        width={115}
        height={115}
        className={cn('[mask-image:linear-gradient(to_top,white,white,transparent)]')}
      />
      <div className="flex flex-grow-[0.8] relative  sm:top-[-60px] top-[10px] justify-center items-center">
        <div className="absolute sm:w-full w-[90%] h-[400px] ">
          <Image
            src={'/images/landing/footer/udon-text.png'}
            fill
            alt="udon-text"
            className="object-contain w-auto"
          />
        </div>
      </div>
      <div className="flex flex-grow-[0.2] flex-col-reverse sm:flex-row text-white sm:items-center sm:justify-between px-8 gap-6">
        <Typography>@2025 Udon Finance. All rights reserved.</Typography>
        <div className="flex flex-col w-auto gap-3 sm:items-end">
          <div className="flex flex-row items-center gap-10">
            {linkFooter.map(({ title, url }) => {
              return (
                <Link href={url} key={url}>
                  {title}
                </Link>
              );
            })}
          </div>
          <div className="flex flex-row items-center gap-10">
            {linkSocial.map(({ title, url, icon }) => (
              <Link
                href={url}
                key={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80 transition-opacity text-white"
                title={title}
              >
                {icon}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
