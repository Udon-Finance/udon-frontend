'use client';

import React, { useState } from 'react';
import { SortableTable, ColumnDef } from '@/components/common/sortable-table';
import { Button } from '@/components/common/button';
import { Switch } from '@/components/common/switch';
import { Typography } from '@/components/common/typography';
import { Badge } from '@/components/common/badge';
import { Skeleton } from '@/components/common/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/tooltip';
import { SupplyDialog } from './supply-dialog';
import { WithdrawDialog } from './withdraw-dialog';
import { LsdWithdrawDialog } from './lsd-withdraw-dialog';
import { CollateralDialog } from './collateral-dialog';
import { StakingProgressDialog } from './staking-progress-dialog';
import { SlowWithdrawProgressDialog } from './slow-withdraw-progress-dialog';
import { StchrWithdrawTransactionDialog } from './stchr-withdraw-transaction-dialog';
import { UserAccountData, UserReserveData } from '../../types';
import { useRouter } from 'next/navigation';
import CountUp from '@/components/common/count-up';
import {
  useLsdPosition,
  getStakingStatusForAsset,
  StakingStatus,
  LsdFailureStage,
  UserSupplyRecord,
  UserAccumulatedRewards,
} from '@/hooks/contracts/queries/use-lsd-position';
import {
  useSlowWithdrawPositions,
  getSlowWithdrawStatusForAsset,
} from '@/hooks/contracts/queries/use-slow-withdraw-positions';

import {
  useStchrWithdrawTransactions,
  getStchrWithdrawTransactionsForAsset,
} from '@/hooks/contracts/queries/use-stchr-withdraw-transactions';
import { cn } from '@/utils/tailwind';
import {
  ChevronDown,
  Coins,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Timer,
  Target,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/avatar';
// Import mapping from staking dialog
const STAKING_STATUS_MAP: Record<string, StakingStatus> = {
  PENDING_STAKING: StakingStatus.PENDING_STAKING,
  CROSS_CHAIN_TRANSFERRING_TO_ECONOMY: StakingStatus.CROSS_CHAIN_TRANSFERRING_TO_ECONOMY,
  BRIDGING_TO_BSC: StakingStatus.BRIDGING_TO_BSC,
  TRANSFER_TO_USER: StakingStatus.TRANSFER_TO_USER,
  APPROVE_ERC20: StakingStatus.APPROVE_ERC20,
  STAKED: StakingStatus.STAKED,
};

interface SupplyPositionTableProps {
  positions: UserReserveData[];
  isLoading: boolean;
  mutateAssets: () => void;
  yourSupplyBalancePosition: number;
  yourSupplyCollateralPosition: number;
  yourSupplyAPYPosition: number;
  accountData: UserAccountData;
}

export const SupplyPositionTable: React.FC<SupplyPositionTableProps> = ({
  positions,
  isLoading,
  mutateAssets,
  yourSupplyBalancePosition,
  yourSupplyCollateralPosition,
  yourSupplyAPYPosition,
  accountData,
}) => {
  const router = useRouter();

  // LSD data fetching
  const {
    data: lsdData,
    // isLoading: lsdLoading
  } = useLsdPosition();

  // LSD Withdraw data fetching
  const {
    data: slowWithdrawData,
    // isLoading: slowWithdrawLoading
  } = useSlowWithdrawPositions();

  console.log('slowWithdrawData in position', slowWithdrawData);

  // stCHR Withdraw Transaction data fetching
  const {
    data: stchrTransactionData,
    // isLoading: stchrTransactionLoading
  } = useStchrWithdrawTransactions();

  console.log('stchrTransactionData in position', stchrTransactionData);

  // Dialog state management
  const [selectedPosition, setSelectedPosition] = useState<UserReserveData | null>(null);
  const [supplyDialogOpen, setSupplyDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [lsdWithdrawDialogOpen, setLsdWithdrawDialogOpen] = useState(false);
  // Collateral dialog state
  const [collateralDialogOpen, setCollateralDialogOpen] = useState(false);
  const [selectedCollateral, setSelectedCollateral] = useState<UserReserveData | null>(null);
  // Staking progress dialog state
  const [stakingProgressDialogOpen, setStakingProgressDialogOpen] = useState(false);
  const [selectedStakingAsset, setSelectedStakingAsset] = useState<string>('');
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number>(0);
  // LSD Withdraw progress dialog states
  const [slowWithdrawProgressDialogOpen, setSlowWithdrawProgressDialogOpen] = useState(false);
  const [selectedWithdrawAsset, setSelectedWithdrawAsset] = useState<string>('');
  // stCHR Withdraw Transaction dialog state
  const [stchrTransactionDialogOpen, setStchrTransactionDialogOpen] = useState(false);
  // Expandable rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Handle supply button click for a position
  const handleSupplyClick = (position: UserReserveData) => {
    console.log('position', position);
    setSelectedPosition(position);
    setSupplyDialogOpen(true);
  };

  // Handle withdraw button click for a position
  const handleWithdrawClick = (position: UserReserveData) => {
    setSelectedPosition(position);

    // For tCHR (LSD), open LSD withdraw dialog, otherwise open normal withdraw dialog
    if (position.symbol === 'tCHR') {
      setLsdWithdrawDialogOpen(true);
    } else {
      setWithdrawDialogOpen(true);
    }
  };

  // Handle collateral switch click
  const handleCollateralSwitch = (position: UserReserveData) => {
    setSelectedCollateral(position);
    setCollateralDialogOpen(true);
  };

  // Handle staking progress pill click
  const handleStakingProgressClick = (symbol: string, recordIndex?: number) => {
    setSelectedStakingAsset(symbol);
    setSelectedRecordIndex(recordIndex ?? 0);
    setStakingProgressDialogOpen(true);
  };

  // Handle CHR withdraw progress pill click
  const handleChrWithdrawProgressClick = (symbol: string) => {
    setSelectedWithdrawAsset(symbol);
    setSlowWithdrawProgressDialogOpen(true);
  };

  // Handle stCHR withdraw transaction pill click
  const handleStchrWithdrawTransactionClick = (symbol: string) => {
    const position = positions.find(p => p.symbol === symbol);
    if (position) {
      setSelectedPosition(position);
      setStchrTransactionDialogOpen(true);
    }
  };

  // Handle expand/collapse row
  const handleExpandRow = (assetSymbol: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(assetSymbol)) {
      newExpandedRows.delete(assetSymbol);
    } else {
      newExpandedRows.add(assetSymbol);
    }
    setExpandedRows(newExpandedRows);
  };

  // Render CHR withdraw progress pill
  const renderChrWithdrawProgressPill = (symbol: string) => {
    const withdrawInfo = getSlowWithdrawStatusForAsset(symbol, slowWithdrawData);
    const { hasError, isCompleted, canCompleteWithdraw, position } = withdrawInfo;

    // Base card structure with fixed height
    const baseCardClasses =
      'group relative h-36 p-3 rounded-xl border border-border/30 bg-gradient-to-br from-card via-card/95 to-muted/20 hover:shadow-lg hover:shadow-[#52E5FF]/10 transition-all duration-300 hover:border-[#52E5FF]/40';

    if (!position) {
      return (
        <div className={baseCardClasses}>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#52E5FF]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-muted/20 group-hover:bg-[#52E5FF]/10 transition-colors duration-300">
                <Clock className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#52E5FF] transition-colors duration-300" />
              </div>
              <div className="flex flex-col">
                <Typography
                  variant="small"
                  className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300 truncate"
                >
                  CHR Withdraw
                </Typography>
                <Typography variant="small" className="text-muted-foreground/60 text-xs">
                  14-day period
                </Typography>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center items-center">
              <Typography
                variant="small"
                className="text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors duration-300 text-center text-xs"
              >
                No active withdrawals
              </Typography>
            </div>

            {/* Empty Progress */}
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                <div className="w-0 h-full bg-[#52E5FF]/30 transition-all duration-300" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    const amount = position.stAssetAmount;
    const expectedAmount = position.assetAmount;

    // Calculate remaining time for display
    const unstakingAvailableTime = position.unstakingAvailableAt;
    const remainingTime =
      unstakingAvailableTime === 0 ? 0 : Math.max(0, unstakingAvailableTime - Date.now());
    const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div
              className={cn(baseCardClasses, 'cursor-pointer hover:scale-[1.02]')}
              onClick={() => handleChrWithdrawProgressClick(symbol)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#52E5FF]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg transition-all duration-300',
                      hasError
                        ? 'bg-red-500/10 group-hover:bg-red-500/20'
                        : isCompleted
                          ? 'bg-[#52E5FF]/10 group-hover:bg-[#52E5FF]/20'
                          : canCompleteWithdraw
                            ? 'bg-[#52E5FF]/10 group-hover:bg-[#52E5FF]/20'
                            : 'bg-orange-500/10 group-hover:bg-orange-500/20'
                    )}
                  >
                    <Clock
                      className={cn(
                        'w-3.5 h-3.5 transition-colors duration-300',
                        hasError
                          ? 'text-red-500'
                          : isCompleted || canCompleteWithdraw
                            ? 'text-[#52E5FF]'
                            : 'text-orange-500'
                      )}
                    />
                  </div>
                  <div className="flex flex-col">
                    <Typography
                      variant="small"
                      className="font-semibold group-hover:text-[#52E5FF] transition-colors duration-300 truncate"
                    >
                      CHR Withdraw
                    </Typography>
                    <Typography
                      variant="small"
                      className="text-muted-foreground/70 text-xs truncate"
                    >
                      {hasError
                        ? 'Error'
                        : isCompleted
                          ? 'Done'
                          : canCompleteWithdraw
                            ? 'Ready'
                            : unstakingAvailableTime === 0
                              ? 'Request Pending'
                              : `${remainingDays}d left`}
                    </Typography>
                  </div>
                </div>

                {/* Amount Info */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between items-center">
                    <Typography variant="small" className="text-muted-foreground/70 text-xs">
                      Amount:
                    </Typography>
                    <Typography variant="small" className="text-[#52E5FF] font-semibold text-sm">
                      {amount}
                    </Typography>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography variant="small" className="text-muted-foreground/70 text-xs">
                      Expected:
                    </Typography>
                    <Typography variant="small" className="text-muted-foreground text-xs">
                      {expectedAmount} CHR
                    </Typography>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-2">
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 w-full justify-center',
                      hasError
                        ? 'bg-red-500/10 text-red-500 group-hover:bg-red-500/20'
                        : isCompleted
                          ? 'bg-[#52E5FF]/10 text-[#52E5FF] group-hover:bg-[#52E5FF]/20'
                          : canCompleteWithdraw
                            ? 'bg-[#52E5FF]/10 text-[#52E5FF] group-hover:bg-[#52E5FF]/20'
                            : 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20'
                    )}
                  >
                    {hasError ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : canCompleteWithdraw ? (
                      <Target className="w-3 h-3" />
                    ) : (
                      <Timer className="w-3 h-3" />
                    )}
                    <span className="truncate">
                      {hasError
                        ? 'Failed'
                        : isCompleted
                          ? 'Completed'
                          : canCompleteWithdraw
                            ? 'Ready'
                            : 'Processing'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="h-1.5 rounded-full border border-border/20 bg-muted/10 overflow-hidden">
                    <div
                      className={cn(
                        'w-full h-full transition-all duration-500 rounded-full',
                        hasError
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : isCompleted
                            ? 'bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF]'
                            : canCompleteWithdraw
                              ? 'bg-gradient-to-r from-[#52E5FF]/80 via-[#36B1FF]/80 to-[#E4F5FF]/80'
                              : 'bg-gradient-to-r from-orange-400 to-orange-500'
                      )}
                    >
                      {!isCompleted && !hasError && !canCompleteWithdraw && (
                        <div className="w-full h-full bg-white/30 animate-pulse rounded-full" />
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#52E5FF]/20 via-[#36B1FF]/20 to-[#E4F5FF]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <Typography variant="small" weight="semibold">
                CHR Withdraw Details
              </Typography>
              <div className="text-xs space-y-1.5">
                <div>
                  Amount: {amount} stCHR → {expectedAmount} CHR
                </div>
                <div>
                  Status:{' '}
                  {hasError
                    ? 'Failed'
                    : isCompleted
                      ? 'Completed'
                      : canCompleteWithdraw
                        ? 'Ready to claim'
                        : `${remainingDays} days remaining`}
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Render stCHR withdraw transaction pill
  const renderStchrWithdrawTransactionPill = (symbol: string) => {
    const { transactions, hasTransactions, totalWithdrawn } = getStchrWithdrawTransactionsForAsset(
      symbol,
      stchrTransactionData
    );

    // Base card structure with fixed height
    const baseCardClasses =
      'group relative h-36 p-3 rounded-xl border border-border/30 bg-gradient-to-br from-card via-card/95 to-muted/20 hover:shadow-lg hover:shadow-[#52E5FF]/10 transition-all duration-300 hover:border-[#52E5FF]/40';

    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div
              className={cn(baseCardClasses, 'cursor-pointer hover:scale-[1.02]')}
              onClick={() => handleStchrWithdrawTransactionClick(symbol)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#52E5FF]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-muted/20 group-hover:bg-[#52E5FF]/10 transition-colors duration-300">
                    <Zap className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#52E5FF] transition-colors duration-300" />
                  </div>
                  <div className="flex flex-col">
                    <Typography
                      variant="small"
                      className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300 truncate"
                    >
                      stCHR History
                    </Typography>
                    <Typography variant="small" className="text-muted-foreground/60 text-xs">
                      {hasTransactions ? `${transactions.length} transactions` : 'No transactions'}
                    </Typography>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-center">
                  {hasTransactions ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Typography variant="small" className="text-muted-foreground/70 text-xs">
                          Total Withdrawn:
                        </Typography>
                        <Typography variant="small" className="font-medium text-[#52E5FF] text-xs">
                          <CountUp value={totalWithdrawn} decimals={3} /> stCHR
                        </Typography>
                      </div>
                      <div className="flex items-center justify-between">
                        <Typography variant="small" className="text-muted-foreground/70 text-xs">
                          Transactions:
                        </Typography>
                        <Typography variant="small" className="font-medium text-foreground text-xs">
                          {transactions.length}
                        </Typography>
                      </div>
                    </div>
                  ) : (
                    <Typography
                      variant="small"
                      className="text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors duration-300 text-center text-xs"
                    >
                      No stCHR transactions
                    </Typography>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                    <div
                      className="h-full bg-[#52E5FF]/70 transition-all duration-300"
                      style={{ width: hasTransactions ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1 text-xs">
              {hasTransactions ? (
                <>
                  <p>
                    <strong>stCHR Withdraw History</strong>
                  </p>
                  <p>
                    Total Withdrawn: <CountUp value={totalWithdrawn} decimals={6} /> stCHR
                  </p>
                  <p>Number of Transactions: {transactions.length}</p>
                  <p>Click to view detailed transaction history</p>
                </>
              ) : (
                <>
                  <p>
                    <strong>stCHR Transaction History</strong>
                  </p>
                  <p>No stCHR withdrawals yet</p>
                  <p>Your transaction history will appear here</p>
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Render staking progress pills for multiple records
  const renderStakingProgressPills = (
    symbol: string,
    records: UserSupplyRecord[],
    accumulatedRewards: UserAccumulatedRewards[]
  ) => {
    // Base card structure with fixed height
    const baseCardClasses =
      'group relative h-36 p-3 rounded-xl border border-border/30 bg-gradient-to-br from-card via-card/95 to-muted/20 hover:shadow-lg hover:shadow-[#52E5FF]/10 transition-all duration-300 hover:border-[#52E5FF]/40';

    if (!records || records.length === 0) {
      return (
        <div className={baseCardClasses}>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#52E5FF]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-muted/20 group-hover:bg-[#52E5FF]/10 transition-colors duration-300">
                <Coins className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#52E5FF] transition-colors duration-300" />
              </div>
              <div className="flex flex-col">
                <Typography
                  variant="small"
                  className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300 truncate"
                >
                  Staking
                </Typography>
                <Typography variant="small" className="text-muted-foreground/60 text-xs">
                  Earn rewards
                </Typography>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center items-center">
              <Typography
                variant="small"
                className="text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors duration-300 text-center text-xs"
              >
                No active staking
              </Typography>
            </div>

            {/* Empty Progress */}
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                <div className="w-0 h-full bg-[#52E5FF]/30 transition-all duration-300" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Calculate summary stats
    const totalAmount = accumulatedRewards[0]?.totalAssetCollected || 0;

    const stakedCount = records.filter(record => {
      const stakingStatus =
        typeof record.stakingStatus === 'string'
          ? (STAKING_STATUS_MAP[record.stakingStatus] ?? StakingStatus.PENDING_STAKING)
          : record.stakingStatus;
      return stakingStatus === StakingStatus.STAKED;
    }).length;

    const hasError =
      lsdData?.positions?.[0]?.status !== LsdFailureStage.NO_FAILURE &&
      lsdData?.positions?.[0]?.status !== 'NO_FAILURE';
    const pendingCount = records.length - stakedCount;

    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div
              className={cn(baseCardClasses, 'cursor-pointer hover:scale-[1.02]')}
              onClick={() => handleStakingProgressClick(symbol, 0)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#52E5FF]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg transition-all duration-300',
                      hasError
                        ? 'bg-red-500/10 group-hover:bg-red-500/20'
                        : stakedCount > 0
                          ? 'bg-[#52E5FF]/10 group-hover:bg-[#52E5FF]/20'
                          : 'bg-orange-500/10 group-hover:bg-orange-500/20'
                    )}
                  >
                    <Coins
                      className={cn(
                        'w-3.5 h-3.5 transition-colors duration-300',
                        hasError
                          ? 'text-red-500'
                          : stakedCount > 0
                            ? 'text-[#52E5FF]'
                            : 'text-orange-500'
                      )}
                    />
                  </div>
                  <div className="flex flex-col">
                    <Typography
                      variant="small"
                      className="font-semibold group-hover:text-[#52E5FF] transition-colors duration-300 truncate"
                    >
                      Staking
                    </Typography>
                    <Typography
                      variant="small"
                      className="text-muted-foreground/70 text-xs truncate"
                    >
                      {records.length} position{records.length > 1 ? 's' : ''}
                    </Typography>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between items-center">
                    <Typography variant="small" className="text-muted-foreground/70 text-xs">
                      Total:
                    </Typography>
                    <CountUp value={totalAmount} className="text-sm text-primary" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography variant="small" className="text-muted-foreground/70 text-xs">
                      Status:
                    </Typography>
                    <div className="flex items-center gap-1">
                      {stakedCount > 0 && (
                        <div className="flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-[#52E5FF]" />
                          <Typography
                            variant="small"
                            className="text-[#52E5FF] font-medium text-xs"
                          >
                            {stakedCount}
                          </Typography>
                        </div>
                      )}
                      {pendingCount > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 text-orange-500" />
                          <Typography
                            variant="small"
                            className="text-orange-500 font-medium text-xs"
                          >
                            {pendingCount}
                          </Typography>
                        </div>
                      )}
                      {hasError && (
                        <div className="flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                          <Typography variant="small" className="text-red-500 font-medium text-xs">
                            Error
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-2">
                  <div
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 w-full justify-center',
                      hasError
                        ? 'bg-red-500/10 text-red-500 group-hover:bg-red-500/20'
                        : stakedCount > 0
                          ? 'bg-[#52E5FF]/10 text-[#52E5FF] group-hover:bg-[#52E5FF]/20'
                          : 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500/20'
                    )}
                  >
                    {hasError ? (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span className="truncate">Error Detected</span>
                      </>
                    ) : stakedCount > 0 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="truncate">Active Staking</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3" />
                        <span className="truncate">Processing</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar - Segmented */}
                <div className="relative">
                  <div className="flex h-1.5 rounded-full border border-border/20 bg-muted/10 overflow-hidden">
                    {records.map((record, index) => {
                      const stakingStatus =
                        typeof record.stakingStatus === 'string'
                          ? (STAKING_STATUS_MAP[record.stakingStatus] ??
                            StakingStatus.PENDING_STAKING)
                          : record.stakingStatus;

                      const isStaked = stakingStatus === StakingStatus.STAKED;
                      const isProcessing = !isStaked && !hasError;

                      let segmentColor = 'bg-orange-500/40';
                      if (hasError) segmentColor = 'bg-red-500';
                      else if (isStaked) segmentColor = 'bg-[#52E5FF]';
                      else if (isProcessing) segmentColor = 'bg-orange-500';

                      return (
                        <div
                          key={index}
                          className={cn(
                            'flex-1 h-full transition-all duration-500',
                            segmentColor,
                            'first:rounded-l-full last:rounded-r-full'
                          )}
                        >
                          {isProcessing && (
                            <div className="w-full h-full bg-white/30 animate-pulse first:rounded-l-full last:rounded-r-full" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#52E5FF]/20 via-[#36B1FF]/20 to-[#E4F5FF]/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-2">
              <Typography variant="small" weight="semibold">
                Staking Overview
              </Typography>
              <div className="text-xs space-y-1.5">
                <div>
                  Total: <CountUp value={totalAmount} decimals={2} /> CHR
                </div>
                <div>Positions: {records.length}</div>
                {stakedCount > 0 && <div>Staked: {stakedCount}</div>}
                {pendingCount > 0 && <div>Pending: {pendingCount}</div>}
                {hasError && <div>Error detected</div>}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Handle asset click
  const handleAssetClick = (asset: string) => {
    router.push(`/reserve/${asset}`);
  };

  // Render asset icon and symbol
  // Render reserve. icon and symbol
  const renderAssetCell = (reserve: UserReserveData) => {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => handleAssetClick(reserve.assetId.toString('hex'))}
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={reserve.iconUrl} alt={reserve.symbol} />
                <AvatarFallback>{reserve.symbol.charAt(0)}</AvatarFallback>
              </Avatar>
              <Typography weight="medium">{reserve.symbol}</Typography>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{reserve.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Define columns for the positions table
  const columns: ColumnDef<UserReserveData>[] = [
    {
      header: 'Assets',
      accessorKey: 'symbol',
      cell: ({ row }) => renderAssetCell(row),
      enableSorting: true,
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
      header: 'Amount',
      accessorKey: 'currentATokenBalance',
      enableSorting: true,
      cell: ({ row }) => {
        const balance = row.currentATokenBalance;
        const balanceUsd = Number(balance) * (row.price || 0);
        return (
          <div className="flex flex-col gap-2">
            <CountUp value={Number(balance)} className="text-base" />
            <Typography variant="small" color="submerged">
              <CountUp value={balanceUsd} prefix="$" className="text-sm text-submerged" />
            </Typography>
          </div>
        );
      },
      meta: {
        skeleton: (
          <div>
            <Skeleton className="w-24 h-5 mb-1" />
            <Skeleton className="w-16 h-4" />
          </div>
        ),
      },
    },
    {
      header: 'APY',
      accessorKey: 'supplyAPY',
      enableSorting: true,
      cell: ({ row }) => {
        const stakingInfo = getStakingStatusForAsset(row.symbol, lsdData);
        const hasStakingAPY = stakingInfo.isStaked && stakingInfo.stakingAPY > 0;
        const totalAPY = row.supplyAPY + (hasStakingAPY ? stakingInfo.stakingAPY : 0);

        if (totalAPY === 0) {
          return <Typography>_</Typography>;
        }

        // For tCHR, show combined APY with tooltip breakdown
        if (row.symbol === 'tCHR') {
          return (
            <TooltipProvider>
              <Tooltip delayDuration={200}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <div className="flex items-center gap-1">
                      {hasStakingAPY && (
                        <div className="flex -space-x-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
                          <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                        </div>
                      )}
                      <CountUp
                        value={totalAPY}
                        suffix="%"
                        className="text-sm font-semibold"
                        decimals={2}
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <Typography variant="small">
                        Lending APY: <CountUp value={row.supplyAPY} decimals={2} suffix="%" />
                      </Typography>
                    </div>
                    {hasStakingAPY && (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <Typography variant="small">
                          Staking APY:{' '}
                          <CountUp value={stakingInfo.stakingAPY} decimals={2} suffix="%" />
                        </Typography>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 mt-2">
                      <Typography variant="small" weight="semibold">
                        Total APY: <CountUp value={totalAPY} decimals={2} suffix="%" />
                      </Typography>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }

        // For other assets, show simple APY
        return <CountUp value={row.supplyAPY} suffix="%" className="text-sm" decimals={2} />;
      },
      meta: {
        skeleton: <Skeleton className="w-20 h-5" />,
      },
    },
    {
      header: 'Collateral',
      accessorKey: 'usageAsCollateralEnabled',
      cell: ({ row }) => (
        <Switch
          checked={row.usageAsCollateralEnabled}
          onCheckedChange={() => handleCollateralSwitch(row)}
        />
      ),
      meta: {
        skeleton: <Skeleton className="w-10 h-5 rounded-full" />,
      },
    },
    {
      header: 'LSD',
      accessorKey: 'symbol',
      cell: ({ row }) => {
        // Only show for tCHR
        if (row.symbol !== 'tCHR') {
          return <Typography>_</Typography>;
        }

        const isExpanded = expandedRows.has(row.symbol);

        return (
          <div
            onClick={() => handleExpandRow(row.symbol)}
            className="flex flex-row justify-center items-center cursor-pointer gap-1"
          >
            <Typography className="text-embossed">View More</Typography>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-white transition-transform duration-200 ease-out',
                isExpanded ? 'animate-chevron-rotate-up' : 'animate-chevron-rotate-down'
              )}
            />
          </div>
        );
      },
      meta: {
        skeleton: <Skeleton className="w-8 h-8 rounded-full" />,
      },
    },
    {
      header: '',
      accessorKey: 'symbol',
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <div className="flex flex-col gap-2">
              <Button
                variant="gradient"
                className="w-[100px]"
                onClick={() => handleSupplyClick(row)}
              >
                Supply
              </Button>
              <Button
                variant="outlineGradient"
                className="w-[100px]"
                onClick={() => handleWithdrawClick(row)}
              >
                Withdraw
              </Button>
            </div>
          </div>
        );
      },
      meta: {
        skeleton: (
          <div className="flex justify-end">
            <div className="flex flex-col gap-2">
              <Skeleton className="w-[100px] h-9" />
              <Skeleton className="w-[100px] h-9" />
            </div>
          </div>
        ),
      },
    },
  ];

  // Render expandable row content
  const renderExpandableContent = (symbol: string) => {
    if (symbol !== 'tCHR') return null;

    const supplyRecords = lsdData?.supplyRecords || [];
    const accumulatedRewards = lsdData?.rewards || [];

    return (
      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          {/* Staking Progress */}
          <div className="space-y-2">
            <Typography variant="small" weight="semibold" className="text-muted-foreground">
              Staking Progress
            </Typography>
            {renderStakingProgressPills(symbol, supplyRecords, accumulatedRewards)}
          </div>

          {/* CHR Withdraw Progress */}
          <div className="space-y-2">
            <Typography variant="small" weight="semibold" className="text-muted-foreground">
              CHR Withdraw Progress
            </Typography>
            {renderChrWithdrawProgressPill(symbol)}
          </div>

          {/* stCHR Withdraw Transaction */}
          <div className="space-y-2">
            <Typography variant="small" weight="semibold" className="text-muted-foreground">
              stCHR Withdraw Transaction
            </Typography>
            {renderStchrWithdrawTransactionPill(symbol)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
      {isLoading ? (
        <Skeleton className="h-8 w-48 mb-4" />
      ) : (
        <Typography variant="h4" weight="semibold" className="mb-4 text-2xl">
          Your Supply
        </Typography>
      )}
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex gap-4 mb-4 flex-wrap">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
          <SortableTable<UserReserveData>
            data={[]}
            columns={columns}
            pageSize={4}
            className="bg-transparent border-none"
            isLoading={true}
            skeletonRows={3}
          />
        </div>
      ) : (
        <>
          {positions.length > 0 ? (
            <>
              <div className="flex gap-4 mb-4 flex-wrap">
                <Badge variant="outline" className="text-base px-3 gap-1">
                  <Typography weight="medium">Balance:</Typography>
                  {yourSupplyBalancePosition ? (
                    <CountUp
                      value={yourSupplyBalancePosition}
                      prefix="$"
                      className="text-base ml-1"
                    />
                  ) : (
                    <Typography>_</Typography>
                  )}
                </Badge>
                <Badge variant="outline" className="text-base px-3 gap-1">
                  <Typography weight="medium">APY:</Typography>
                  {yourSupplyAPYPosition ? (
                    <CountUp
                      value={yourSupplyAPYPosition}
                      suffix="%"
                      className="text-base ml-1"
                      decimals={2}
                    />
                  ) : (
                    <Typography>_</Typography>
                  )}
                </Badge>
                <Badge variant="outline" className="text-base px-3 gap-1">
                  <Typography weight="medium">Collateral:</Typography>
                  {yourSupplyCollateralPosition ? (
                    <CountUp
                      value={yourSupplyCollateralPosition}
                      prefix="$"
                      className="text-base ml-1"
                    />
                  ) : (
                    <Typography>_</Typography>
                  )}
                </Badge>
              </div>

              <SortableTable<UserReserveData>
                data={positions}
                columns={columns}
                className="bg-transparent border-none"
                expandedRows={expandedRows}
                renderExpandableContent={renderExpandableContent}
              />
            </>
          ) : (
            <div className="flex flex-grow items-center justify-center">
              <Typography className="text-submerged text-center text-lg">
                No supply positions found. <br />
                Start supplying assets to earn interest.
              </Typography>
            </div>
          )}
        </>
      )}

      {/* Supply Dialog */}
      {selectedPosition && supplyDialogOpen && (
        <SupplyDialog
          open={supplyDialogOpen}
          onOpenChange={setSupplyDialogOpen}
          reserve={selectedPosition}
          mutateAssets={mutateAssets}
          accountData={accountData}
        />
      )}

      {/* Withdraw Dialog */}
      {selectedPosition && withdrawDialogOpen && (
        <WithdrawDialog
          open={withdrawDialogOpen}
          onOpenChange={setWithdrawDialogOpen}
          reserve={selectedPosition}
          mutateAssets={mutateAssets}
          accountData={accountData}
        />
      )}

      {/* LSD Withdraw Dialog */}
      {selectedPosition && lsdWithdrawDialogOpen && (
        <LsdWithdrawDialog
          open={lsdWithdrawDialogOpen}
          onOpenChange={setLsdWithdrawDialogOpen}
          reserve={selectedPosition}
          mutateAssets={mutateAssets}
          accountData={accountData}
        />
      )}

      {/* Collateral Dialog */}
      {selectedCollateral && (
        <CollateralDialog
          open={collateralDialogOpen}
          onOpenChange={setCollateralDialogOpen}
          reserve={selectedCollateral}
          accountData={accountData}
          mutateAssets={mutateAssets}
        />
      )}

      {/* Staking Progress Dialog */}
      {selectedStakingAsset && (
        <StakingProgressDialog
          open={stakingProgressDialogOpen}
          onOpenChange={setStakingProgressDialogOpen}
          assetSymbol={selectedStakingAsset}
          selectedRecordIndex={selectedRecordIndex}
          lsdData={lsdData}
        />
      )}

      {/* Slow Withdraw Progress Dialog */}
      {selectedWithdrawAsset && (
        <SlowWithdrawProgressDialog
          open={slowWithdrawProgressDialogOpen}
          onOpenChange={setSlowWithdrawProgressDialogOpen}
          assetSymbol={selectedWithdrawAsset}
          slowWithdrawData={slowWithdrawData}
        />
      )}

      {/* Stchr Withdraw Transaction Dialog */}
      {selectedPosition && stchrTransactionDialogOpen && (
        <StchrWithdrawTransactionDialog
          open={stchrTransactionDialogOpen}
          onOpenChange={setStchrTransactionDialogOpen}
          reserve={selectedPosition}
        />
      )}
    </div>
  );
};
