'use client';

import React, { useState } from 'react';
import { Receipt, ArrowDown, Info, Zap } from 'lucide-react';
import { format } from 'date-fns';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/dialog';
import { Typography } from '@/components/common/typography';

import { Badge } from '@/components/common/badge';
import { Skeleton } from '@/components/common/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/common/alert';
import CountUp from '@/components/common/count-up';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/tab/anim-slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/tooltip';
import { cn } from '@/utils/tailwind';
import {
  useStchrWithdrawTransactions,
  getStchrWithdrawTransactionsForAsset,
} from '@/hooks/contracts/queries/use-stchr-withdraw-transactions';
import { UserReserveData } from '../../types';

export interface StchrWithdrawTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reserve: UserReserveData;
}

export const StchrWithdrawTransactionDialog: React.FC<StchrWithdrawTransactionDialogProps> = ({
  open,
  onOpenChange,
  reserve,
}) => {
  const [activeTab, setActiveTab] = useState('0');

  // Fetch stCHR withdraw transactions
  const { data: transactionData, isLoading } = useStchrWithdrawTransactions(open);

  const { transactions, hasTransactions, totalWithdrawn } = getStchrWithdrawTransactionsForAsset(
    reserve.symbol,
    transactionData
  );

  // Sync activeTab when dialog opens
  React.useEffect(() => {
    if (open) {
      setActiveTab('0');
    }
  }, [open]);

  // Determine withdraw type badge color and text
  const getWithdrawTypeBadge = (withdrawType: string) => {
    switch (withdrawType) {
      case 'lending_only':
        return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', text: 'Lending Pool' };
      case 'hybrid':
        return { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', text: 'Hybrid' };
      case 'max':
        return {
          color: 'bg-green-500/10 text-green-400 border-green-500/20',
          text: 'Max Withdraw',
        };
      default:
        return { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', text: 'Unknown' };
    }
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
  };

  // If no transactions, show empty state
  if (!isLoading && !hasTransactions) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <TooltipProvider delayDuration={300}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#52E5FF]/10 border border-[#52E5FF]/20">
                  <Receipt className="w-5 h-5 text-[#52E5FF]" />
                </div>
                <div>
                  <Typography variant="h3" className="text-foreground">
                    stCHR Withdraw History
                  </Typography>
                  <Typography variant="small" className="text-muted-foreground">
                    {reserve.name} • {reserve.symbol}
                  </Typography>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Receipt className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <Typography variant="h4" className="text-muted-foreground mb-2">
                No Withdraw History
              </Typography>
              <Typography variant="small" className="text-muted-foreground/70 max-w-sm">
                You haven&apos;t made any stCHR withdrawals yet. Your future withdraw transactions
                will appear here.
              </Typography>
            </div>
          </TooltipProvider>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[50vw] w-auto max-h-[90vh] overflow-y-auto rounded-xl">
        <TooltipProvider delayDuration={300}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              stCHR Withdraw History - {reserve.symbol}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Summary Card */}
            <Card className="relative bg-background border-transparent overflow-hidden">
              {/* Outline gradient border */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] p-[1px] bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-[1px] z-10 rounded-[inherit] bg-background"
              />
              <CardHeader className="relative z-20">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF]">
                    <Receipt className="w-4 h-4 text-black" />
                  </div>
                  Transaction Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-20">
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 p-3 rounded-lg border border-border/50">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <div className="space-y-1 p-3 rounded-lg border border-border/50">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card to-muted/10">
                      <Typography variant="small" className="text-muted-foreground font-medium">
                        Total Transactions
                      </Typography>
                      <Typography className="text-2xl font-bold">{transactions.length}</Typography>
                    </div>

                    <div className="space-y-1 p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card to-muted/10">
                      <Typography variant="small" className="text-muted-foreground font-medium">
                        Total Withdrawn
                      </Typography>
                      <CountUp
                        value={totalWithdrawn}
                        decimals={6}
                        suffix=" stCHR"
                        className="text-2xl font-bold"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Important Information */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Transaction History Information</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>
                  This shows your complete stCHR withdrawal history including amounts withdrawn from
                  lending pools and staking rewards.
                </p>
                <p>
                  Each transaction shows the portfolio state before withdrawal for transparency.
                </p>
              </AlertDescription>
            </Alert>

            {isLoading ? (
              // Loading State
              <Card className="relative bg-background overflow-hidden border border-border">
                <CardHeader>
                  <CardTitle>Loading Transaction Details...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 rounded-xl border border-border/30">
                        <div className="flex items-center gap-3 mb-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-24 h-3" />
                          </div>
                        </div>
                        <Skeleton className="w-full h-16 mb-4" />
                        <div className="space-y-2">
                          <Skeleton className="w-full h-8" />
                          <Skeleton className="w-full h-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Transaction Details with Tabs
              <Card className="relative bg-background overflow-hidden border border-border">
                <CardHeader className="relative z-20">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF]">
                      <ArrowDown className="w-4 h-4 text-black" />
                    </div>
                    <CardTitle>Withdrawal Transactions</CardTitle>
                  </div>
                  <CardDescription>
                    Select a transaction to view detailed information
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-20">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* Tabs with primary underline */}
                    <TabsList className="justify-start bg-transparent p-0 h-auto border-b border-border overflow-x-auto scrollbar-none flex-nowrap w-full">
                      {transactions
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )
                        .map((_, index) => (
                          <TabsTrigger
                            key={index}
                            value={index.toString()}
                            className="px-6 py-3 text-sm font-medium data-[state=active]:text-embossed data-[state=inactive]:text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent data-[state=active]:border-[#52E5FF]"
                          >
                            Transaction #{String(transactions.length - index).padStart(3, '0')}
                          </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* Tab Contents */}
                    {transactions
                      .sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      )
                      .map((transaction, index) => {
                        const typeBadge = getWithdrawTypeBadge(transaction.withdrawType);

                        return (
                          <TabsContent
                            key={index}
                            value={index.toString()}
                            className="mt-6 space-y-6"
                          >
                            {/* Transaction Overview */}
                            <div className="space-y-4">
                              {/* Main info in a clean grid */}
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1 p-4 rounded-lg bg-card border border-border/50">
                                  <Typography
                                    variant="small"
                                    className="text-muted-foreground font-medium"
                                  >
                                    Total Withdrawn
                                  </Typography>
                                  <CountUp
                                    value={totalWithdrawn}
                                    decimals={6}
                                    suffix=" stCHR"
                                    className="text-2xl font-bold"
                                  />
                                </div>

                                <div className="space-y-1 p-4 rounded-lg bg-card border border-border/50">
                                  <Typography
                                    variant="small"
                                    className="text-muted-foreground font-medium"
                                  >
                                    Transaction Date
                                  </Typography>
                                  <Typography className="text-xl font-bold">
                                    {formatDate(transaction.createdAt)}
                                  </Typography>
                                </div>

                                <div className="flex flex-col space-y-1 p-4 rounded-lg bg-card border border-border/50">
                                  <Typography
                                    variant="small"
                                    className="text-muted-foreground font-medium"
                                  >
                                    Withdraw Type
                                  </Typography>
                                  <Badge
                                    className={cn(
                                      'text-sm font-medium mt-1 border',
                                      typeBadge.color
                                    )}
                                  >
                                    {typeBadge.text}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Portfolio State Before Withdraw */}
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger asChild>
                                <div className="space-y-4 bg-card border border-border/50 rounded-lg p-4 cursor-help">
                                  <div className="flex items-center gap-2 mb-4">
                                    <Info className="w-4 h-4 text-muted-foreground" />
                                    <Typography variant="h5" weight="semibold">
                                      Portfolio Before Withdraw
                                    </Typography>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/10 border border-border/10">
                                        <Typography
                                          variant="small"
                                          className="text-muted-foreground font-medium"
                                        >
                                          Principal:
                                        </Typography>
                                        <Typography variant="small" className="font-bold">
                                          <CountUp
                                            value={transaction.stakingPrincipalBefore}
                                            decimals={3}
                                          />
                                        </Typography>
                                      </div>
                                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/10 border border-border/10">
                                        <Typography
                                          variant="small"
                                          className="text-muted-foreground font-medium"
                                        >
                                          Staking Rewards:
                                        </Typography>
                                        <Typography variant="small" className="font-bold">
                                          <CountUp
                                            value={transaction.stakingRewardsBefore}
                                            decimals={3}
                                          />
                                        </Typography>
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/10 border border-border/10">
                                        <Typography
                                          variant="small"
                                          className="text-muted-foreground font-medium"
                                        >
                                          Lending Rewards:
                                        </Typography>
                                        <Typography variant="small" className="font-bold">
                                          <CountUp
                                            value={transaction.lendingRewardsBefore}
                                            decimals={3}
                                          />
                                        </Typography>
                                      </div>
                                      <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-[#52E5FF]/5 to-[#36B1FF]/5 border border-[#52E5FF]/20">
                                        <Typography
                                          variant="small"
                                          className="text-[#52E5FF] font-medium"
                                        >
                                          Total stCHR:
                                        </Typography>
                                        <Typography
                                          variant="small"
                                          className="font-bold text-[#52E5FF]"
                                        >
                                          <CountUp
                                            value={transaction.totalStchrBefore}
                                            decimals={3}
                                          />
                                        </Typography>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-sm">
                                <div className="space-y-1 text-xs">
                                  <p>
                                    <strong>Principal:</strong> Original CHR staked amount
                                  </p>
                                  <p>
                                    <strong>Staking Rewards:</strong> Rewards from BSC staking
                                  </p>
                                  <p>
                                    <strong>Lending Rewards:</strong> Rewards from lending pool
                                  </p>
                                  <p>
                                    <strong>Total:</strong> Sum of all stCHR holdings before this
                                    withdrawal
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TabsContent>
                        );
                      })}
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};
