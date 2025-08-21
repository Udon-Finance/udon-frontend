'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/common/button';
import { Typography } from '@/components/common/typography';
import { ColumnDef, SortableTable } from '@/components/common/sortable-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/tooltip';
import { Skeleton } from '@/components/common/skeleton';
import { useFaucet } from '@/hooks/contracts/operations/use-faucet';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTokenBalance } from '@/hooks/contracts/queries/use-token-balance';
import { normalizeBN } from '@/utils/bignumber';

// Token definitions
const TOKENS = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/1.png',
    mintAmount: 1,
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/1027.png',
    mintAmount: 10,
  },
  {
    name: 'MyNeighborAlice',
    symbol: 'ALICE',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/8766.png',
    mintAmount: 1000,
  },
  {
    name: 'DAR Open Network',
    symbol: 'D',
    decimals: 18,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/11374.png',
    mintAmount: 1000,
  },
  {
    name: 'Chromia',
    symbol: 'CHR',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
    mintAmount: 1000,
  },
  {
    name: 'USDT',
    symbol: 'USDT',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/825.png',
    mintAmount: 1000,
  },
  {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png',
    mintAmount: 1000,
  },
  {
    name: 'Iso DAR Open Network',
    symbol: 'isotD',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/11374.png',
    mintAmount: 1000,
  },
];

interface FaucetAsset {
  name: string;
  symbol: string;
  decimals: number;
  icon: string;
  balance: string;
  mintAmount: number;
}

export default function FaucetPage() {
  const router = useRouter();
  const { balances, isLoading: isLoadingBalances, refreshBalance } = useTokenBalance();
  const { requestTokens, isPending } = useFaucet();

  // Combine TOKENS with actual balances from the wallet
  const assets = useMemo(() => {
    return TOKENS.map(token => {
      // Find matching balance by symbol
      const matchingBalance = balances.find(
        balance => balance.asset.symbol.toUpperCase() === token.symbol.toUpperCase()
      );

      // Format the balance if found, otherwise use "0"
      const balance = matchingBalance
        ? normalizeBN(
            matchingBalance.amount.value.toString(),
            matchingBalance.asset.decimals
          ).toString()
        : '0';

      return {
        ...token,
        balance,
        mintAmount: token.mintAmount,
      };
    });
  }, [balances]);

  const handleFaucetClick = async (asset: FaucetAsset) => {
    try {
      await requestTokens(asset.symbol, asset.decimals, asset.mintAmount);
      // Refresh balances after successful request
      await refreshBalance();
    } catch (error) {
      console.error(`Failed to get ${asset.symbol} tokens:`, error);
    }
  };

  // Render asset icon and symbol
  const renderAssetCell = (asset: FaucetAsset) => {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={asset.icon} alt={asset.symbol} />
                <AvatarFallback>{asset.symbol.charAt(0)}</AvatarFallback>
              </Avatar>
              <Typography weight="medium">{asset.symbol.replace(/USD$/, '').trim()}</Typography>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {asset.name.replace(/USD$/, '')} - Mint {asset.mintAmount} tokens
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Define columns for the faucet table
  const faucetColumns: ColumnDef<FaucetAsset>[] = [
    {
      header: 'Assets',
      accessorKey: 'symbol',
      enableSorting: true,
      cell: ({ row }) => renderAssetCell(row),
      meta: {
        skeleton: (
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-24 h-5" />
          </div>
        ),
      },
    },
    {
      header: 'Mint Amount',
      accessorKey: 'mintAmount',
      enableSorting: true,
      cell: ({ row }) => <Typography>{row.mintAmount}</Typography>,
      meta: {
        skeleton: <Skeleton className="w-20 h-5" />,
      },
    },
    {
      header: 'Wallet balance',
      accessorKey: 'balance',
      enableSorting: true,
      cell: ({ row }) => <Typography>{row.balance}</Typography>,
      meta: {
        skeleton: <Skeleton className="w-20 h-5" />,
      },
    },
    {
      header: '',
      accessorKey: 'symbol',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="gradient"
            onClick={() => handleFaucetClick(row)}
            disabled={isPending || isLoadingBalances}
            aria-label={`Get ${row.symbol} from faucet`}
            className="w-[100px]"
          >
            Faucet
          </Button>
        </div>
      ),
      meta: {
        skeleton: (
          <div className="flex justify-end">
            <Skeleton className="w-[100px] h-9" />
          </div>
        ),
      },
    },
  ];

  return (
    <main className="px-4 sm:px-32 py-[100px] sm:py-[200px]">
      <div className="mb-8">
        <Button
          variant="secondary"
          className="w-10 h-10 p-0 rounded-full flex items-center justify-center mb-4"
          onClick={() => router.back()}
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </Button>
        <Typography variant="h2" weight="semibold">
          Test Assets
        </Typography>
        <Typography className="text-base text-submerged mt-2">
          With testnet Faucet you can get free assets to test the Protocol. Make sure your wallet is
          connected, select the desired asset, and click &apos;Faucet&apos; to get tokens
          transferred to your wallet. Each request mints specific amounts: 1 BTC, 10 ETH, and 1000
          for other tokens (ALICE, DUSD, CHR, USDT, USDC).
        </Typography>
        <Typography className="text-base text-submerged mt-2">
          The assets on a testnet have no monetary value. They are only for testing purposes.
        </Typography>
      </div>

      <div className="flex-1 border bg-card p-3 sm:p-5 rounded-[18px] border-solid border-border">
        <Typography variant="h4" weight="semibold" className="mb-4 text-2xl">
          Test Assets
        </Typography>

        <div className="mt-3 sm:mt-5">
          <SortableTable<FaucetAsset>
            data={assets}
            columns={faucetColumns}
            pageSize={10}
            className="p-0 border-none"
            isLoading={isLoadingBalances}
            skeletonRows={4}
          />
        </div>
      </div>
    </main>
  );
}
