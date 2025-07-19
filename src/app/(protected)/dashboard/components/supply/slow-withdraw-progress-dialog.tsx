'use client';

import React, { useState } from 'react';
import {
  Check,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  TrendingDown,
  Wallet,
  Link,
  Timer,
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
import {
  SlowWithdrawStatus,
  SlowWithdrawFailureStage,
  SlowWithdrawPosition,
  getSlowWithdrawStatusForAsset,
} from '@/hooks/contracts/queries/use-slow-withdraw-positions';
import { useCompleteSlowWithdraw } from '@/hooks/contracts/operations/use-complete-slow-withdraw';
import { cn } from '@/utils/tailwind';
import { toast } from 'sonner';

interface SlowWithdrawProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetSymbol: string;
  slowWithdrawData?: {
    positions: SlowWithdrawPosition[];
  };
}

// Mapping từ string status sang enum number
const SLOW_WITHDRAW_STATUS_MAP: Record<string, SlowWithdrawStatus> = {
  PENDING_SLOW_WITHDRAW: SlowWithdrawStatus.PENDING_SLOW_WITHDRAW,
  PENDING_WITHDRAW_REQUESTED: SlowWithdrawStatus.PENDING_WITHDRAW_REQUESTED,
  WITHDRAW: SlowWithdrawStatus.WITHDRAW,
  TRANSFER_TO_ADMIN: SlowWithdrawStatus.TRANSFER_TO_ADMIN,
  BRIDGING_TO_CHR: SlowWithdrawStatus.BRIDGING_TO_CHR,
  CROSS_CHAIN_TRANSFERRING_TO_UDON: SlowWithdrawStatus.CROSS_CHAIN_TRANSFERRING_TO_UDON,
  WITHDRAWED: SlowWithdrawStatus.WITHDRAWED,
};

// Mapping từ string failure stage sang enum number
const SLOW_WITHDRAW_FAILURE_STAGE_MAP: Record<string, SlowWithdrawFailureStage> = {
  NO_FAILURE: SlowWithdrawFailureStage.NO_FAILURE,
  S_WITHDRAW_REQUEST: SlowWithdrawFailureStage.S_WITHDRAW_REQUEST,
  S_WITHDRAW_HANDLE: SlowWithdrawFailureStage.S_WITHDRAW_HANDLE,
  S_WITHDRAW_BRIDGE_ASSET: SlowWithdrawFailureStage.S_WITHDRAW_BRIDGE_ASSET,
  S_WITHDRAW_TRANSFER_UDON: SlowWithdrawFailureStage.S_WITHDRAW_TRANSFER_UDON,
};

const SLOW_WITHDRAW_STEPS = [
  {
    status: SlowWithdrawStatus.PENDING_SLOW_WITHDRAW,
    label: 'Withdraw Requested',
    description: 'Your slow withdraw request has been created and is being processed',
    icon: Clock,
  },
  {
    status: SlowWithdrawStatus.PENDING_WITHDRAW_REQUESTED,
    label: 'Unstaking Period',
    description: 'Waiting for 14-day unstaking period to complete',
    icon: Timer,
  },
  {
    status: SlowWithdrawStatus.WITHDRAW,
    label: 'Unstaking Complete',
    description: 'Unstaking completed, initiating withdrawal from validators',
    icon: Check,
  },
  {
    status: SlowWithdrawStatus.TRANSFER_TO_ADMIN,
    label: 'Transfer to Admin',
    description: 'Transferring assets from validator to admin pool',
    icon: ArrowRight,
  },
  {
    status: SlowWithdrawStatus.BRIDGING_TO_CHR,
    label: 'Bridge to Economy',
    description: 'Bridging assets from BSC to economy chain',
    icon: Link,
  },
  {
    status: SlowWithdrawStatus.CROSS_CHAIN_TRANSFERRING_TO_UDON,
    label: 'Ready to Withdraw',
    description: 'Assets are ready for final withdrawal to your wallet',
    icon: Wallet,
  },
  {
    status: SlowWithdrawStatus.WITHDRAWED,
    label: 'Completed',
    description: 'Withdrawal completed successfully!',
    icon: Check,
  },
];

const FAILURE_STAGE_MESSAGES = {
  [SlowWithdrawFailureStage.NO_FAILURE]: 'No issues detected',
  [SlowWithdrawFailureStage.S_WITHDRAW_REQUEST]:
    'Failed during withdraw request submission. Please contact support.',
  [SlowWithdrawFailureStage.S_WITHDRAW_HANDLE]:
    'Failed during withdraw execution. Please try again later.',
  [SlowWithdrawFailureStage.S_WITHDRAW_BRIDGE_ASSET]:
    'Failed during asset bridging back to Chromia. The bridge may be temporarily unavailable.',
  [SlowWithdrawFailureStage.S_WITHDRAW_TRANSFER_UDON]:
    'Failed during final transfer to your Udon wallet. Please contact support.',
};

export const SlowWithdrawProgressDialog: React.FC<SlowWithdrawProgressDialogProps> = ({
  open,
  onOpenChange,
  assetSymbol,
  slowWithdrawData,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);

  // Complete slow withdraw hook
  const completeSlowWithdraw = useCompleteSlowWithdraw({
    onSuccess: () => {
      toast.success('Withdrawal completed successfully!');
      setIsCompleting(false);
    },
    onError: error => {
      toast.error(`Failed to complete withdrawal: ${error.message}`);
      setIsCompleting(false);
    },
  });

  if (assetSymbol !== 'tCHR' || !slowWithdrawData) {
    return null;
  }

  const withdrawInfo = getSlowWithdrawStatusForAsset(assetSymbol, slowWithdrawData);
  const { position, hasError, isCompleted, isReadyToWithdraw, canCompleteWithdraw } = withdrawInfo;

  // If no position found
  if (!position) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[50vw] w-auto max-h-[90vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle>Slow Withdraw Progress</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <Typography className="text-muted-foreground">
              No slow withdraw records found for {assetSymbol}
            </Typography>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Convert string status to enum number
  const currentStatusString = position.slowWithdrawStatus;
  const currentStatus =
    typeof currentStatusString === 'string'
      ? (SLOW_WITHDRAW_STATUS_MAP[currentStatusString as string] ??
        SlowWithdrawStatus.PENDING_SLOW_WITHDRAW)
      : (currentStatusString as number);

  // Convert position failure stage from string to enum number
  const failureStageString = position.failureStage;
  const failureStage =
    typeof failureStageString === 'string'
      ? (SLOW_WITHDRAW_FAILURE_STAGE_MAP[failureStageString as string] ??
        SlowWithdrawFailureStage.NO_FAILURE)
      : (failureStageString as number);

  const completedSteps = isCompleted
    ? SLOW_WITHDRAW_STEPS.length
    : SLOW_WITHDRAW_STEPS.filter(step => step.status < currentStatus).length;
  const totalSteps = SLOW_WITHDRAW_STEPS.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  // Calculate remaining time for unstaking period
  const unstakingAvailableTime = position.unstakingAvailableAt; // Convert to milliseconds
  const remainingTime = Math.max(0, unstakingAvailableTime - Date.now());
  const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));

  // Format date
  const formatDate = (timestamp: number | string) => {
    const timestampNumber = typeof timestamp === 'string' ? Number(timestamp) : timestamp;
    return new Date(timestampNumber).toLocaleDateString();
  };

  const handleCompleteWithdraw = async () => {
    if (!position || !canCompleteWithdraw) return;

    setIsCompleting(true);
    await completeSlowWithdraw({
      positionId: position.positionId,
      underlyingAssetId: position.underlyingAssetId,
      stAssetAmount: position.stAssetAmount,
    });
  };

  const getStepIcon = (step: (typeof SLOW_WITHDRAW_STEPS)[0], stepStatus: SlowWithdrawStatus) => {
    const Icon = step.icon;
    if (hasError && stepStatus === currentStatus) {
      return <AlertCircle className="w-4 h-4 text-white" />;
    }
    if (stepStatus < currentStatus || (stepStatus === currentStatus && isCompleted)) {
      return <Icon className="w-4 h-4 text-black" />;
    }
    if (stepStatus === currentStatus) {
      return <Loader2 className="w-4 h-4 text-white animate-spin" />;
    }
    return <Icon className="w-4 h-4 text-muted-foreground" />;
  };

  const getStepStatus = (stepStatus: SlowWithdrawStatus) => {
    if (hasError && stepStatus === currentStatus) {
      return 'error';
    }
    if (stepStatus < currentStatus || (stepStatus === currentStatus && isCompleted)) {
      return 'completed';
    }
    if (stepStatus === currentStatus) {
      return 'current';
    }
    return 'pending';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[50vw] w-auto max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Slow Withdraw Progress - {assetSymbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Withdraw Summary - Updated to match staking dialog */}
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
                  <TrendingDown className="w-4 h-4 text-black" />
                </div>
                Withdraw Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card to-muted/10">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    Withdraw Amount
                  </Typography>
                  <CountUp
                    value={position.stAssetAmount}
                    suffix=" stCHR"
                    decimals={2}
                    className="text-xl font-bold"
                  />
                </div>

                <div className="space-y-1 p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card to-muted/10">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    Expected CHR
                  </Typography>
                  <CountUp
                    value={position.assetAmount}
                    suffix=" CHR"
                    decimals={2}
                    className="text-xl font-bold"
                  />
                </div>

                <div className="space-y-1 p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card to-muted/10">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    Request Date
                  </Typography>
                  <Typography className="text-xl font-bold">
                    {position.unstakingRequestedAt
                      ? formatDate(position.unstakingRequestedAt)
                      : 'N/A'}
                  </Typography>
                </div>

                <div className="space-y-1 p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card to-muted/10">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    {isReadyToWithdraw ? 'Ready Since' : 'Available In'}
                  </Typography>
                  <Typography className="text-xl font-bold">
                    {isReadyToWithdraw ? (
                      <span className="text-[#52E5FF]">Ready Now</span>
                    ) : (
                      <span>{remainingDays > 0 ? `${remainingDays} days remaining` : 'N/A'}</span>
                    )}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information - Match staking dialog */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                Slow withdraw requires a 14-day unstaking period as per network protocol. During
                this time, your assets remain staked and continue earning rewards.
              </p>
              <p>
                Once the unstaking period is complete, you&apos;ll need to manually claim your CHR
                from this dialog.
              </p>
              {hasError && (
                <p className="font-medium">
                  If you continue to experience issues, please contact our support team with your
                  wallet address.
                </p>
              )}
            </AlertDescription>
          </Alert>

          {/* Slow Withdraw Positions */}
          <Card className="relative bg-background overflow-hidden border border-border">
            <CardHeader className="relative z-20">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF]">
                  <ArrowRight className="w-4 h-4 text-black" />
                </div>
                <CardTitle>Slow Withdraw Positions</CardTitle>
              </div>
              <CardDescription>
                View your slow withdraw positions and their progress
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-20">
              <div className="space-y-6">
                {/* Current Status Overview */}
                <Card className="bg-card border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Current Status</CardTitle>
                        <CardDescription className="mt-1">
                          {SLOW_WITHDRAW_STEPS.find(step => step.status === currentStatus)?.label ||
                            'Unknown'}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={isCompleted ? 'secondary' : hasError ? 'destructive' : 'outline'}
                        className="h-8 px-3"
                      >
                        {isCompleted
                          ? 'Completed'
                          : hasError
                            ? 'Error'
                            : canCompleteWithdraw
                              ? 'Ready'
                              : 'Processing'}
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
                              isCompleted
                                ? 'bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF]'
                                : 'bg-primary'
                            )}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Complete Withdraw Button */}
                      {canCompleteWithdraw && !isCompleted && (
                        <div className="flex items-center justify-between p-4 bg-card border border-[#52E5FF]/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-[#52E5FF]" />
                            <Typography
                              variant="small"
                              className="text-muted-foreground font-medium"
                            >
                              Your CHR is ready to be claimed
                            </Typography>
                          </div>
                          <Button
                            onClick={handleCompleteWithdraw}
                            disabled={isCompleting}
                            variant="gradient"
                          >
                            {isCompleting ? 'Claiming...' : 'Claim CHR'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Error Alert */}
                {hasError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Withdrawal Error</AlertTitle>
                    <AlertDescription className="mt-2">
                      {FAILURE_STAGE_MESSAGES[failureStage as SlowWithdrawFailureStage] ||
                        'An unknown error occurred during withdrawal.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Progress Steps */}
                <div className="space-y-4">
                  <Typography variant="h5" weight="semibold">
                    Slow Withdraw Journey
                  </Typography>

                  <div className="space-y-3">
                    {SLOW_WITHDRAW_STEPS.map((step, index) => {
                      const stepStatusType = getStepStatus(step.status);
                      const isLast = index === SLOW_WITHDRAW_STEPS.length - 1;

                      return (
                        <div key={step.status} className="relative">
                          {!isLast && (
                            <div
                              className={cn(
                                'absolute left-[29px] top-[45px] w-0.5 h-[calc(80%)]',
                                stepStatusType === 'completed' ? 'bg-[#52E5FF]' : 'bg-border/30'
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
                                  className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] p-[1px] bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF]"
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
                                    'bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF]',
                                  stepStatusType === 'current' && !hasError && 'bg-orange-500',
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
                                        'bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF] text-black',
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

                                {/* Special handling for unstaking period step */}
                                {step.status === SlowWithdrawStatus.PENDING_WITHDRAW_REQUESTED &&
                                  stepStatusType === 'current' && (
                                    <div className="mt-2 p-2 bg-card border border-[#52E5FF]/20 rounded-md">
                                      <Typography variant="small" className="text-[#52E5FF]">
                                        {remainingDays > 0
                                          ? `${remainingDays} days remaining`
                                          : 'Unstaking period completed!'}
                                      </Typography>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
