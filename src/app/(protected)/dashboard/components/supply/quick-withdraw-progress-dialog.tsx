'use client';

import React, { useState } from 'react';
import { Check, AlertCircle, Loader2, ArrowRight, Wallet, Zap, RefreshCw } from 'lucide-react';
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
  QuickWithdrawStatus,
  QuickWithdrawFailureStage,
  QuickWithdrawPosition,
  getQuickWithdrawStatusForAsset,
  getQuickWithdrawPositionStatus,
} from '@/hooks/contracts/queries/use-quick-withdraw-positions';
import { useCompleteQuickWithdraw } from '@/hooks/contracts/operations/use-complete-quick-withdraw';
import { cn } from '@/utils/tailwind';
import { toast } from 'sonner';

interface QuickWithdrawProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetSymbol: string;
  quickWithdrawData?: {
    positions: QuickWithdrawPosition[];
  };
}

// Mapping từ string status sang enum number
const QUICK_WITHDRAW_STATUS_MAP: Record<string, QuickWithdrawStatus> = {
  PENDING_QUICK_WITHDRAW: QuickWithdrawStatus.PENDING_QUICK_WITHDRAW,
  CROSS_CHAIN_TRANSFERRING_TO_DEX: QuickWithdrawStatus.CROSS_CHAIN_TRANSFERRING_TO_DEX,
  SWAP_STCHR_TO_CHR: QuickWithdrawStatus.SWAP_STCHR_TO_CHR,
  CROSS_CHAIN_TRANSFERRING_TO_UDON: QuickWithdrawStatus.CROSS_CHAIN_TRANSFERRING_TO_UDON,
  WITHDRAWED: QuickWithdrawStatus.WITHDRAWED,
};

// Mapping từ string failure stage sang enum number
const QUICK_WITHDRAW_FAILURE_STAGE_MAP: Record<string, QuickWithdrawFailureStage> = {
  NO_FAILURE: QuickWithdrawFailureStage.NO_FAILURE,
  Q_WITHDRAW_TRANSFER_DEX: QuickWithdrawFailureStage.Q_WITHDRAW_TRANSFER_DEX,
  Q_WITHDRAW_HANDLE_SWAP: QuickWithdrawFailureStage.Q_WITHDRAW_HANDLE_SWAP,
  Q_WITHDRAW_TRANSFER_UDON: QuickWithdrawFailureStage.Q_WITHDRAW_TRANSFER_UDON,
};

const QUICK_WITHDRAW_STEPS = [
  {
    status: QuickWithdrawStatus.PENDING_QUICK_WITHDRAW,
    label: 'Quick Withdraw Requested',
    description: 'Your quick withdraw request has been created and is being processed',
    icon: Zap,
  },
  {
    status: QuickWithdrawStatus.CROSS_CHAIN_TRANSFERRING_TO_DEX,
    label: 'Transferring to DEX',
    description: 'Transferring stCHR to the decentralized exchange for swapping',
    icon: ArrowRight,
  },
  {
    status: QuickWithdrawStatus.SWAP_STCHR_TO_CHR,
    label: 'Swapping stCHR to CHR',
    description: 'Converting stCHR to CHR using DEX liquidity pools',
    icon: RefreshCw,
  },
  {
    status: QuickWithdrawStatus.CROSS_CHAIN_TRANSFERRING_TO_UDON,
    label: 'Ready to Withdraw',
    description: 'CHR is ready for final withdrawal to your wallet',
    icon: Wallet,
  },
  {
    status: QuickWithdrawStatus.WITHDRAWED,
    label: 'Completed',
    description: 'Quick withdrawal completed successfully!',
    icon: Check,
  },
];

const FAILURE_STAGE_MESSAGES = {
  [QuickWithdrawFailureStage.NO_FAILURE]: 'No issues detected',
  [QuickWithdrawFailureStage.Q_WITHDRAW_TRANSFER_DEX]:
    'Failed during transfer to DEX. Please contact support.',
  [QuickWithdrawFailureStage.Q_WITHDRAW_HANDLE_SWAP]:
    'Failed during swap execution. This might be due to insufficient DEX liquidity.',
  [QuickWithdrawFailureStage.Q_WITHDRAW_TRANSFER_UDON]:
    'Failed during final transfer to your Udon wallet. Please contact support.',
};

export const QuickWithdrawProgressDialog: React.FC<QuickWithdrawProgressDialogProps> = ({
  open,
  onOpenChange,
  assetSymbol,
  quickWithdrawData,
}) => {
  const [isCompleting, setIsCompleting] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('0');

  // Sync activeTab when dialog opens
  React.useEffect(() => {
    if (open) {
      setActiveTab('0');
    }
  }, [open]);

  // Complete quick withdraw hook
  const completeQuickWithdraw = useCompleteQuickWithdraw({
    onSuccess: () => {
      toast.success('Quick withdrawal completed successfully!');
      setIsCompleting({});
    },
    onError: error => {
      toast.error(`Failed to complete withdrawal: ${error.message}`);
      setIsCompleting({});
    },
  });

  if (assetSymbol !== 'tCHR' || !quickWithdrawData) {
    return null;
  }

  const withdrawInfo = getQuickWithdrawStatusForAsset(assetSymbol, quickWithdrawData);
  const { withdrawPositions, canCompleteWithdraws } = withdrawInfo;

  console.log('withdrawPositions', withdrawPositions);
  // If no positions found
  if (withdrawPositions.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle>Quick Withdraw Progress</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">
            <Typography className="text-muted-foreground">
              No quick withdraw records found for {assetSymbol}
            </Typography>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Calculate total amounts
  const totalStAssetAmount = withdrawPositions.reduce((sum, pos) => sum + pos.stAssetAmount, 0);
  const totalAssetAmount = withdrawPositions.reduce((sum, pos) => sum + pos.assetAmount, 0);

  // Format date
  const formatDate = (timestamp: number | string) => {
    const timestampNumber = typeof timestamp === 'string' ? Number(timestamp) : timestamp;
    return new Date(timestampNumber).toLocaleDateString();
  };

  const handleCompleteWithdraw = async (position: QuickWithdrawPosition) => {
    const positionKey = position.positionId.toString();
    setIsCompleting(prev => ({ ...prev, [positionKey]: true }));

    console.log('position', position);
    console.log('position.positionId', position.positionId.toString('hex'));
    console.log('position.underlyingAssetId', position.underlyingAssetId.toString('hex'));
    console.log('position.stAssetAmount', position.stAssetAmount.toString());

    await completeQuickWithdraw({
      positionId: position.positionId,
      underlyingAssetId: position.underlyingAssetId,
      stAssetAmount: position.stAssetAmount,
    });
  };

  const getStepIcon = (
    step: (typeof QUICK_WITHDRAW_STEPS)[0],
    stepStatus: QuickWithdrawStatus,
    currentStatus: QuickWithdrawStatus,
    hasError: boolean,
    isCompleted: boolean
  ) => {
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

  const getStepStatus = (
    stepStatus: QuickWithdrawStatus,
    currentStatus: QuickWithdrawStatus,
    hasError: boolean,
    isCompleted: boolean
  ) => {
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
            <Zap className="w-5 h-5" />
            Quick Withdraw Progress - {assetSymbol}
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
                  <Zap className="w-4 h-4 text-black" />
                </div>
                Quick Withdraw Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-20">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card to-muted/10">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    Total Positions
                  </Typography>
                  <Typography className="text-2xl font-bold">{withdrawPositions.length}</Typography>
                </div>

                <div className="space-y-1 p-3 rounded-lg border border-border/50 bg-gradient-to-br from-card to-muted/10">
                  <Typography variant="small" className="text-muted-foreground font-medium">
                    Total stCHR
                  </Typography>
                  <CountUp
                    value={totalStAssetAmount}
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
                    value={totalAssetAmount}
                    suffix=" CHR"
                    decimals={2}
                    className="text-xl font-bold"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Information */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Information</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                Quick withdraw provides instant liquidity by swapping your stCHR for CHR using DEX
                liquidity. Each withdrawal is processed as a separate position.
              </p>
              <p>
                This method incurs higher transaction fees and potential slippage but bypasses the
                14-day unstaking period.
              </p>
              {canCompleteWithdraws.length > 0 && (
                <p className="font-medium">
                  You have {canCompleteWithdraws.length} position(s) ready for final withdrawal.
                </p>
              )}
            </AlertDescription>
          </Alert>

          {/* Status Overview with all status information */}
          <Card className="relative bg-background overflow-hidden border border-border">
            <CardHeader className="relative z-20">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-[#52E5FF] via-[#36B1FF] to-[#E4F5FF]">
                  <ArrowRight className="w-4 h-4 text-black" />
                </div>
                <CardTitle>Quick Withdraw Positions</CardTitle>
              </div>
              <CardDescription>Select a position to view its withdrawal progress</CardDescription>
            </CardHeader>
            <CardContent className="relative z-20">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Tabs with primary underline */}
                <TabsList className="justify-start bg-transparent p-0 h-auto border-b border-border overflow-x-auto scrollbar-none flex-nowrap w-full">
                  {withdrawPositions.map((position, index) => (
                    <TabsTrigger
                      key={index}
                      value={index.toString()}
                      className="px-6 py-3 text-sm font-medium data-[state=active]:text-embossed data-[state=inactive]:text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent data-[state=active]:border-[#52E5FF]"
                    >
                      Position #{index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Tab Contents with proper grid layout */}
                {withdrawPositions.map((position, index) => {
                  const positionStatus = getQuickWithdrawPositionStatus(position);
                  const { isCompleted, hasError, canComplete, statusLabel } = positionStatus;

                  // Convert string status to enum number
                  const currentStatusString = position.quickWithdrawStatus;
                  const currentStatus =
                    typeof currentStatusString === 'string'
                      ? (QUICK_WITHDRAW_STATUS_MAP[currentStatusString as string] ??
                        QuickWithdrawStatus.PENDING_QUICK_WITHDRAW)
                      : (currentStatusString as number);

                  const failureStageString = position.failureStage;
                  const failureStage =
                    typeof failureStageString === 'string'
                      ? (QUICK_WITHDRAW_FAILURE_STAGE_MAP[failureStageString as string] ??
                        QuickWithdrawFailureStage.NO_FAILURE)
                      : (failureStageString as number);

                  const completedSteps = isCompleted
                    ? QUICK_WITHDRAW_STEPS.length
                    : QUICK_WITHDRAW_STEPS.filter(step => step.status < currentStatus).length;
                  const totalSteps = QUICK_WITHDRAW_STEPS.length;
                  const progressPercentage = (completedSteps / totalSteps) * 100;

                  const positionKey = position.positionId.toString();

                  return (
                    <TabsContent key={index} value={index.toString()} className="mt-6 space-y-6">
                      {/* Position Details */}
                      <div className="space-y-4">
                        {/* Main info in a clean grid */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1 p-4 rounded-lg bg-card border border-border/50">
                            <Typography
                              variant="small"
                              className="text-muted-foreground font-medium"
                            >
                              stCHR Amount
                            </Typography>
                            <Typography className="text-xl font-bold">
                              {position.stAssetAmount} stCHR
                            </Typography>
                          </div>
                          <div className="space-y-1 p-4 rounded-lg bg-card border border-border/50">
                            <Typography
                              variant="small"
                              className="text-muted-foreground font-medium"
                            >
                              Expected CHR
                            </Typography>
                            <Typography className="text-xl font-bold">
                              {position.assetAmount} CHR
                            </Typography>
                          </div>
                          <div className="flex flex-col space-y-1 p-4 rounded-lg bg-card border border-border/50">
                            <Typography
                              variant="small"
                              className="text-muted-foreground font-medium"
                            >
                              Status
                            </Typography>
                            <Badge
                              variant="outline"
                              className="text-sm border-[#52E5FF]/30 text-[#52E5FF] mt-1"
                            >
                              {typeof position.quickWithdrawStatus === 'string'
                                ? position.quickWithdrawStatus.replace(/_/g, ' ')
                                : 'Unknown'}
                            </Badge>
                          </div>
                        </div>

                        {/* Additional details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 p-4 rounded-lg bg-card border border-border/50">
                            <Typography
                              variant="small"
                              className="text-muted-foreground font-medium"
                            >
                              Request Date
                            </Typography>
                            <Typography className="text-xl font-bold">
                              {formatDate(position.createdAt)}
                            </Typography>
                          </div>
                          <div className="space-y-1 p-4 rounded-lg bg-card border border-border/50">
                            <Typography
                              variant="small"
                              className="text-muted-foreground font-medium"
                            >
                              Swap Timestamp
                            </Typography>
                            <Typography className="text-xl font-bold">
                              {position.swapTimestamp ? formatDate(position.swapTimestamp) : 'N/A'}
                            </Typography>
                          </div>
                        </div>
                      </div>

                      {/* Current Status */}
                      <div className="space-y-4 bg-card border border-border/50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Typography variant="h5" weight="semibold">
                              Current Status
                            </Typography>
                            <Typography variant="small" className="text-muted-foreground mt-1">
                              {QUICK_WITHDRAW_STEPS.find(step => step.status === currentStatus)
                                ?.label || 'Unknown'}
                            </Typography>
                          </div>
                          <Badge
                            variant={
                              isCompleted ? 'secondary' : hasError ? 'destructive' : 'outline'
                            }
                            className="h-8 px-3"
                          >
                            {statusLabel}
                          </Badge>
                        </div>

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
                        {canComplete && !isCompleted && (
                          <div className="flex items-center justify-between p-4 bg-card border border-[#52E5FF]/20 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Wallet className="w-4 h-4 text-[#52E5FF]" />
                              <Typography
                                variant="small"
                                className="text-muted-foreground font-medium"
                              >
                                CHR is ready to be claimed
                              </Typography>
                            </div>
                            <Button
                              onClick={() => handleCompleteWithdraw(position)}
                              disabled={isCompleting[positionKey]}
                              variant="gradient"
                            >
                              {isCompleting[positionKey] ? 'Claiming...' : 'Claim CHR'}
                            </Button>
                          </div>
                        )}

                        {/* Error Alert */}
                        {hasError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Withdrawal Error</AlertTitle>
                            <AlertDescription className="mt-2">
                              {FAILURE_STAGE_MESSAGES[failureStage as QuickWithdrawFailureStage] ||
                                'An unknown error occurred during withdrawal.'}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Quick Withdraw Journey */}
                        <div className="space-y-4">
                          <Typography variant="h5" weight="semibold">
                            Quick Withdraw Journey
                          </Typography>

                          <div className="space-y-3">
                            {QUICK_WITHDRAW_STEPS.map((step, stepIndex) => {
                              const stepStatusType = getStepStatus(
                                step.status,
                                currentStatus,
                                hasError,
                                isCompleted
                              );
                              const isLast = stepIndex === QUICK_WITHDRAW_STEPS.length - 1;

                              return (
                                <div key={step.status} className="relative">
                                  {!isLast && (
                                    <div
                                      className={cn(
                                        'absolute left-[29px] top-[45px] w-0.5 h-[calc(80%)]',
                                        stepStatusType === 'completed'
                                          ? 'bg-[#52E5FF]'
                                          : 'bg-border/30'
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
                                          stepStatusType === 'current' &&
                                            !hasError &&
                                            'bg-orange-500',
                                          stepStatusType === 'error' && 'bg-destructive',
                                          stepStatusType === 'pending' && 'bg-muted'
                                        )}
                                      >
                                        {getStepIcon(
                                          step,
                                          step.status,
                                          currentStatus,
                                          hasError,
                                          isCompleted
                                        )}
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
                                                  : `Step ${stepIndex + 1}`}
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
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
