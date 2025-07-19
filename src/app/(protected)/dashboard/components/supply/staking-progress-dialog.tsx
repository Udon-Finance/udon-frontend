'use client';

import React, { useState } from 'react';
import {
  Check,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  TrendingUp,
  Wallet,
  Link,
  Coins,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/dialog';
import { Typography } from '@/components/common/typography';
import { Badge } from '@/components/common/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/common/alert';
import CountUp from '@/components/common/count-up';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Button } from '@/components/common/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/tab/anim-slider';
import {
  StakingStatus,
  LsdFailureStage,
  UserLsdPosition,
  UserSupplyRecord,
  UserAccumulatedRewards,
} from '@/hooks/contracts/queries/use-lsd-position';
import { cn } from '@/utils/tailwind';
import { isTestnet } from '@/utils/env';
import { copyToClipboard, truncateAddress } from '@/utils/string';

interface StakingProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetSymbol: string;
  selectedRecordIndex?: number;
  lsdData?: {
    positions: UserLsdPosition[];
    supplyRecords: UserSupplyRecord[];
    rewards: UserAccumulatedRewards[];
  };
}

// Mapping từ string status sang enum number
const STAKING_STATUS_MAP: Record<string, StakingStatus> = {
  PENDING_STAKING: StakingStatus.PENDING_STAKING,
  CROSS_CHAIN_TRANSFERRING_TO_ECONOMY: StakingStatus.CROSS_CHAIN_TRANSFERRING_TO_ECONOMY,
  BRIDGING_TO_BSC: StakingStatus.BRIDGING_TO_BSC,
  TRANSFER_TO_USER: StakingStatus.TRANSFER_TO_USER,
  APPROVE_ERC20: StakingStatus.APPROVE_ERC20,
  STAKED: StakingStatus.STAKED,
};

// Mapping từ string failure stage sang enum number
const LSD_FAILURE_STAGE_MAP: Record<string, LsdFailureStage> = {
  NO_FAILURE: LsdFailureStage.NO_FAILURE,
  STAKING_TRANSFER_ECONOMY: LsdFailureStage.STAKING_TRANSFER_ECONOMY,
  STAKING_BRIDGING_BSC: LsdFailureStage.STAKING_BRIDGING_BSC,
  STAKING_TRANSFER_USER_BSC: LsdFailureStage.STAKING_TRANSFER_USER_BSC,
  STAKING_APPROVE_ERC20_BSC: LsdFailureStage.STAKING_APPROVE_ERC20_BSC,
  STAKING_HANDLE: LsdFailureStage.STAKING_HANDLE,
  S_WITHDRAW_REQUEST: LsdFailureStage.S_WITHDRAW_REQUEST,
  S_WITHDRAW_HANDLE: LsdFailureStage.S_WITHDRAW_HANDLE,
  S_WITHDRAW_BRIDGE_ASSET: LsdFailureStage.S_WITHDRAW_BRIDGE_ASSET,
  S_WITHDRAW_TRANSFER_UDON: LsdFailureStage.S_WITHDRAW_TRANSFER_UDON,
  Q_WITHDRAW_TRANSFER_DEX: LsdFailureStage.Q_WITHDRAW_TRANSFER_DEX,
  Q_WITHDRAW_HANDLE_SWAP: LsdFailureStage.Q_WITHDRAW_HANDLE_SWAP,
  Q_WITHDRAW_TRANSFER_UDON: LsdFailureStage.Q_WITHDRAW_TRANSFER_UDON,
};

const STAKING_STEPS = [
  {
    status: StakingStatus.PENDING_STAKING,
    label: 'Pending Staking',
    description: 'Your staking request has been created and is waiting to be processed',
    icon: Clock,
  },
  {
    status: StakingStatus.CROSS_CHAIN_TRANSFERRING_TO_ECONOMY,
    label: 'Cross-chain Transfer',
    description: 'Transferring CHR from Udon pool to the economy chain',
    icon: ArrowRight,
  },
  {
    status: StakingStatus.BRIDGING_TO_BSC,
    label: 'Bridging to BSC',
    description: 'Bridging your assets from Chromia to BSC network',
    icon: Link,
  },
  {
    status: StakingStatus.TRANSFER_TO_USER,
    label: 'Wallet Setup',
    description: 'Transferring to your dedicated staking wallet on BSC',
    icon: Wallet,
  },
  {
    status: StakingStatus.APPROVE_ERC20,
    label: 'Token Approval',
    description: 'Approving CHR tokens for the staking contract',
    icon: Check,
  },
  {
    status: StakingStatus.STAKED,
    label: 'Successfully Staked',
    description: 'Your CHR is now staked and earning rewards!',
    icon: Coins,
  },
];

const FAILURE_STAGE_MESSAGES = {
  [LsdFailureStage.NO_FAILURE]: 'No issues detected',
  [LsdFailureStage.STAKING_TRANSFER_ECONOMY]:
    'Failed during cross-chain transfer to economy chain. Please contact support.',
  [LsdFailureStage.STAKING_BRIDGING_BSC]:
    'Failed while bridging to BSC network. The bridge may be temporarily unavailable.',
  [LsdFailureStage.STAKING_TRANSFER_USER_BSC]:
    'Failed during transfer to your BSC staking wallet. Please try again later.',
  [LsdFailureStage.STAKING_APPROVE_ERC20_BSC]:
    'Failed during ERC20 token approval. This may be a temporary issue.',
  [LsdFailureStage.STAKING_HANDLE]:
    'Failed during the staking transaction. Please ensure sufficient gas fees.',
  [LsdFailureStage.S_WITHDRAW_REQUEST]: 'Failed during slow withdraw request submission.',
  [LsdFailureStage.S_WITHDRAW_HANDLE]: 'Failed during slow withdraw execution.',
  [LsdFailureStage.S_WITHDRAW_BRIDGE_ASSET]: 'Failed during asset bridging back to Chromia.',
  [LsdFailureStage.S_WITHDRAW_TRANSFER_UDON]: 'Failed during final transfer to your Udon wallet.',
  [LsdFailureStage.Q_WITHDRAW_TRANSFER_DEX]: 'Failed during quick withdraw transfer to DEX.',
  [LsdFailureStage.Q_WITHDRAW_HANDLE_SWAP]: 'Failed during DEX swap execution.',
  [LsdFailureStage.Q_WITHDRAW_TRANSFER_UDON]: 'Failed during quick withdraw final transfer.',
};

// Helper function to get BSC explorer URL
const getBscExplorerUrl = (address: string): string => {
  const baseUrl = isTestnet ? 'https://testnet.bscscan.com' : 'https://bscscan.com';
  return `${baseUrl}/address/${address}`;
};

export const StakingProgressDialog: React.FC<StakingProgressDialogProps> = ({
  open,
  onOpenChange,
  assetSymbol,
  selectedRecordIndex = 0,
  lsdData,
}) => {
  const [activeTab, setActiveTab] = useState(selectedRecordIndex.toString());
  const [copiedChromia, setCopiedChromia] = useState(false);

  // Sync activeTab with selectedRecordIndex when dialog opens or selectedRecordIndex changes
  React.useEffect(() => {
    if (open && selectedRecordIndex !== undefined) {
      setActiveTab(selectedRecordIndex.toString());
    }
  }, [open, selectedRecordIndex]);

  if (assetSymbol !== 'tCHR' || !lsdData) {
    return null;
  }

  const { positions, supplyRecords, rewards } = lsdData;
  console.log('lsdData', lsdData);
  console.log('rewards', rewards);

  // If no supply records found
  if (!supplyRecords || supplyRecords.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[50vw] w-auto max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Staking Progress</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <Typography className="text-muted-foreground">
              No staking records found for {assetSymbol}
            </Typography>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Get current active record
  const currentRecordIndex = parseInt(activeTab);
  const supplyRecord = supplyRecords[currentRecordIndex];
  const reward = rewards[0]; // Rewards are accumulated across all records

  if (!supplyRecord) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[50vw] w-auto max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Staking Progress</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <Typography className="text-muted-foreground">
              Selected staking record not found
            </Typography>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Convert string status to enum number for step calculation
  const currentStatusString = supplyRecord.stakingStatus;
  const currentStatus =
    typeof currentStatusString === 'string'
      ? (STAKING_STATUS_MAP[currentStatusString as string] ?? StakingStatus.PENDING_STAKING)
      : (currentStatusString as number);

  // Convert position status from string to enum number
  const positionStatusString = positions[0]?.status;
  const positionStatus =
    typeof positionStatusString === 'string'
      ? (LSD_FAILURE_STAGE_MAP[positionStatusString as string] ?? LsdFailureStage.NO_FAILURE)
      : (positionStatusString as number) || LsdFailureStage.NO_FAILURE;

  const hasError = positionStatus !== LsdFailureStage.NO_FAILURE;
  const isStaked = currentStatus === StakingStatus.STAKED;
  const completedSteps = isStaked
    ? STAKING_STEPS.length
    : STAKING_STEPS.filter(step => step.status < currentStatus).length;
  const totalSteps = STAKING_STEPS.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  // Calculate staking APY for current record
  let stakingAPY = 0;
  if (isStaked && reward && reward.totalStakingRewards > 0 && reward.bscStakeAmount > 0) {
    // stakingAPY = (reward.totalStakingRewards / reward.bscStakeAmount) * 100 * 365; // Annualized
    stakingAPY = 3;
  }

  const getStepIcon = (step: (typeof STAKING_STEPS)[0], stepStatus: StakingStatus) => {
    const Icon = step.icon;
    if (hasError && stepStatus === currentStatus) {
      return <AlertCircle className="w-4 h-4 text-white" />;
    }
    if (stepStatus < currentStatus || (stepStatus === currentStatus && isStaked)) {
      return <Icon className="w-4 h-4 text-black" />;
    }
    if (stepStatus === currentStatus) {
      return <Loader2 className="w-4 h-4 text-white animate-spin" />;
    }
    return <Icon className="w-4 h-4 text-muted-foreground" />;
  };

  const getStepStatus = (stepStatus: StakingStatus) => {
    if (hasError && stepStatus === currentStatus) {
      return 'error';
    }
    if (stepStatus < currentStatus || (stepStatus === currentStatus && isStaked)) {
      return 'completed';
    }
    if (stepStatus === currentStatus) {
      return 'current';
    }
    return 'pending';
  };

  // Add copy handler
  const handleCopyChromia = async (address: string) => {
    await copyToClipboard(address);
    setCopiedChromia(true);
    setTimeout(() => setCopiedChromia(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[50vw] w-auto max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Staking Progress - {assetSymbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Staking Summary - Always show */}
          <Card className="relative bg-background border-transparent overflow-hidden">
            {/* Outline gradient border */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] p-[1px] bg-gradient-to-r from-primary via-[#36B1FF] to-[#E4F5FF]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[1px] z-10 rounded-[inherit] bg-background"
            />
            <CardHeader className="relative z-20">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-primary via-[#36B1FF] to-[#E4F5FF]">
                  <Coins className="w-4 h-4 text-black" />
                </div>
                Staking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 rounded-lg bg-card border border-border/50">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    Total Collected
                  </Typography>
                  <CountUp
                    value={reward?.totalAssetCollected || 0}
                    suffix=" CHR"
                    decimals={2}
                    className="text-xl font-bold"
                  />
                </div>

                <div className="space-y-1 p-3 rounded-lg bg-card border border-border/50">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    Total Staked
                  </Typography>
                  <CountUp
                    value={reward?.totalLendingRewards || 0}
                    suffix=" CHR"
                    decimals={2}
                    className="text-xl font-bold"
                  />
                </div>

                <div className="space-y-1 p-3 rounded-lg bg-card border">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    Total Rewards
                  </Typography>
                  <CountUp
                    value={reward?.totalStakingRewards || 0}
                    // value={0}
                    suffix=" CHR"
                    decimals={4}
                    className="text-xl font-bold"
                  />
                </div>

                <div className="space-y-1 p-3 rounded-lg bg-card border">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    Current Rewards
                  </Typography>
                  <CountUp
                    value={reward?.currentStakingRewards || 0}
                    suffix=" CHR"
                    decimals={4}
                    className="text-xl font-bold"
                  />
                </div>

                <div className="space-y-1 p-3 rounded-lg bg-card border border-border/50">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    Last Update
                  </Typography>
                  <Typography className="text-xl font-bold">
                    {reward ? new Date(Number(reward.lastUpdateTimestamp)).toLocaleString() : 'N/A'}
                  </Typography>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border/50">
                  <div className="flex flex-row items-center justify-between mt-1">
                    <div className="flex flex-col space-y-1">
                      <Typography variant="small" className="text-muted-foreground font-medium">
                        BSC Address Staking
                      </Typography>
                      <div className="flex flex-row gap-1">
                        <Typography variant="p" className="text-xl font-bold">
                          {reward?.bscStakingAddress
                            ? truncateAddress(reward?.bscStakingAddress)
                            : 'N/A'}
                        </Typography>
                        <button
                          onClick={() => handleCopyChromia(reward?.bscStakingAddress || '')}
                          className="text-primary/70 hover:text-primary transition-colors cursor-pointer"
                        >
                          {copiedChromia ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      variant="gradient"
                      size="sm"
                      className="max-w-[100px] flex-shrink-0"
                      onClick={() =>
                        window.open(getBscExplorerUrl(reward?.bscStakingAddress || ''), '_blank')
                      }
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      BSCScan
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information - Always show */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                The staking process involves multiple blockchain networks and may take 5-10 minutes
                to complete.
              </p>
              <p>
                Your staking rewards are automatically compounded and will be reflected in your
                total balance.
              </p>
              {hasError && (
                <p className="font-medium">
                  If you continue to experience issues, please contact our support team with your
                  wallet address.
                </p>
              )}
            </AlertDescription>
          </Alert>

          {/* Supply Records - Always show with improved layout */}
          <Card className="relative bg-background overflow-hidden border border-border">
            <CardHeader className="relative z-20">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-primary via-[#36B1FF] to-[#E4F5FF]">
                  <ArrowRight className="w-4 h-4 text-black" />
                </div>
                <CardTitle>Supply Records</CardTitle>
              </div>
              <CardDescription>Select a supply record to view its staking progress</CardDescription>
            </CardHeader>
            <CardContent className="relative z-20">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Tabs with primary underline */}
                <TabsList className="justify-center bg-transparent p-0 h-auto border-b border-border">
                  {supplyRecords.map((record, index) => (
                    <TabsTrigger
                      key={index}
                      value={index.toString()}
                      className="px-6 py-3 text-sm font-medium data-[state=active]:text-embossed data-[state=inactive]:text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent data-[state=active]:border-primary"
                    >
                      Supply #{index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Tab Contents with proper grid layout */}
                {supplyRecords.map((record, index) => (
                  <TabsContent key={index} value={index.toString()} className="mt-6">
                    <div className="space-y-6">
                      {/* Main info in a clean grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1 p-4 rounded-lg bg-card border border-border/50">
                          <Typography variant="small" className="text-muted-foreground font-medium">
                            Amount
                          </Typography>
                          <Typography className="text-xl font-bold">
                            {record.netAmount} {assetSymbol}
                          </Typography>
                        </div>
                        <div className="space-y-1 p-4 rounded-lg bg-card border border-border/50">
                          <Typography variant="small" className="text-muted-foreground font-medium">
                            Supply Date
                          </Typography>
                          <Typography className="text-xl font-bold">
                            {new Date(Number(record.createdAt)).toLocaleString()}
                          </Typography>
                        </div>
                        <div className="flex flex-col space-y-1 p-4 rounded-lg bg-card border border-border/50">
                          <Typography variant="small" className="text-muted-foreground font-medium">
                            Status
                          </Typography>
                          <Badge
                            variant="outline"
                            className="text-sm border-primary/30 text-primary mt-1"
                          >
                            {typeof record.stakingStatus === 'string'
                              ? record.stakingStatus.replace(/_/g, ' ')
                              : 'Unknown'}
                          </Badge>
                        </div>
                      </div>

                      {/* Additional details in a 2-column grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 p-4 rounded-lg bg-card border border-border/50">
                          <Typography variant="small" className="text-muted-foreground font-medium">
                            Amount
                          </Typography>
                          <Typography variant="p" className="text-lg font-bold">
                            {record.netAmount} {assetSymbol}
                          </Typography>
                        </div>

                        <div className="space-y-1 p-4 rounded-lg bg-card border border-border/50">
                          <Typography variant="small" className="text-muted-foreground font-medium">
                            Supply Fee
                          </Typography>
                          <Typography variant="p" className="text-lg font-bold">
                            {record.supplyFee} {assetSymbol}
                          </Typography>
                        </div>
                      </div>

                      {/* Progress Overview */}
                      <Card className="bg-card border-border/50">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle>Current Status</CardTitle>
                              <CardDescription className="mt-1">
                                {STAKING_STEPS.find(step => step.status === currentStatus)?.label ||
                                  'Unknown'}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                isStaked ? 'secondary' : hasError ? 'destructive' : 'outline'
                              }
                              className="h-8 px-3"
                            >
                              {isStaked ? 'Staked' : hasError ? 'Error' : 'Processing'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {completedSteps} of {totalSteps} steps
                                </span>
                              </div>
                              {/* Progress bar implementation */}
                              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                                <div
                                  className={cn(
                                    'h-full transition-all duration-500 ease-in-out rounded-full',
                                    isStaked
                                      ? 'bg-gradient-to-r from-primary via-[#36B1FF] to-[#E4F5FF]'
                                      : 'bg-primary'
                                  )}
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                            </div>

                            {isStaked && stakingAPY > 0 && (
                              <div className="flex items-center justify-between p-4 bg-card border border-primary/20 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-primary" />
                                  <Typography
                                    variant="small"
                                    className="text-muted-foreground font-medium"
                                  >
                                    Estimated Staking APY
                                  </Typography>
                                </div>
                                <CountUp
                                  value={stakingAPY}
                                  suffix="%"
                                  decimals={2}
                                  className="text-lg font-bold text-primary"
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Error Alert */}
                      {hasError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Staking Error</AlertTitle>
                          <AlertDescription className="mt-2">
                            {FAILURE_STAGE_MESSAGES[positionStatus as LsdFailureStage] ||
                              'An unknown error occurred during staking.'}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Progress Steps */}
                      <div className="space-y-4">
                        <Typography variant="h5" weight="semibold">
                          Staking Journey
                        </Typography>

                        <div className="space-y-3">
                          {STAKING_STEPS.map((step, index) => {
                            const stepStatusType = getStepStatus(step.status);
                            const isLast = index === STAKING_STEPS.length - 1;

                            return (
                              <div key={step.status} className="relative">
                                {!isLast && (
                                  <div
                                    className={cn(
                                      'absolute left-[29px] top-[45px] w-0.5 h-[calc(80%)]',
                                      stepStatusType === 'completed' ? 'bg-primary' : 'bg-border/30'
                                    )}
                                  />
                                )}

                                <div
                                  className={cn(
                                    'relative overflow-hidden rounded-lg transition-all z-10 bg-card',
                                    stepStatusType === 'completed' && 'border-transparent',
                                    stepStatusType === 'current' &&
                                      !hasError &&
                                      'border border-orange-500/30 shadow-sm',
                                    stepStatusType === 'error' && 'border border-destructive/30',
                                    stepStatusType === 'pending' && 'border border-muted/20'
                                  )}
                                >
                                  {/* Outline gradient border for completed steps */}
                                  {stepStatusType === 'completed' && (
                                    <>
                                      <div
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] p-[1px] bg-gradient-to-r from-primary via-[#36B1FF] to-[#E4F5FF]"
                                      />
                                      <div
                                        aria-hidden
                                        className="pointer-events-none absolute inset-[1px] z-10 rounded-[inherit] bg-card"
                                      />
                                    </>
                                  )}

                                  <div className="flex items-start gap-4 p-4 relative z-20">
                                    <div
                                      className={cn(
                                        'flex-shrink-0 mt-0.5 rounded-full p-2',
                                        stepStatusType === 'completed' &&
                                          'bg-gradient-to-r from-primary via-[#36B1FF] to-[#E4F5FF]',
                                        stepStatusType === 'current' &&
                                          !hasError &&
                                          'bg-orange-500',
                                        stepStatusType === 'error' && 'bg-destructive',
                                        stepStatusType === 'pending' && 'bg-muted'
                                      )}
                                    >
                                      {getStepIcon(step, step.status)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <Typography weight="semibold" className="text-embossed">
                                          {step.label}
                                        </Typography>

                                        <div
                                          className={cn(
                                            'text-xs h-5 px-2 rounded-full flex items-center font-medium',
                                            stepStatusType === 'completed' &&
                                              'bg-gradient-to-r from-primary via-[#36B1FF] to-[#E4F5FF] text-black',
                                            stepStatusType === 'current' &&
                                              !hasError &&
                                              'border border-orange-500/30 text-orange-500 bg-orange-500/10',
                                            stepStatusType === 'error' &&
                                              'border border-destructive/30 text-destructive bg-destructive/10',
                                            stepStatusType === 'pending' &&
                                              'border border-muted/30 text-muted-foreground bg-muted/10'
                                          )}
                                        >
                                          {stepStatusType === 'completed'
                                            ? 'Complete'
                                            : stepStatusType === 'current' && !hasError
                                              ? 'In Progress'
                                              : stepStatusType === 'error'
                                                ? '✗ Failed'
                                                : `Step ${index + 1}`}
                                        </div>
                                      </div>

                                      <Typography variant="small" className="text-submerged">
                                        {step.description}
                                      </Typography>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
