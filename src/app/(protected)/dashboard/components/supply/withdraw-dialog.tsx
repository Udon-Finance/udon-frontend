'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CircleX, Info, ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { debounce } from 'lodash';
import { useAssetPrice } from '@/hooks/contracts/queries/use-asset-price';
import { useWithdraw } from '@/hooks/contracts/operations/use-withdraw';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import { Typography } from '@/components/common/typography';
import { Input } from '@/components/common/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/common/avatar';
import { Skeleton } from '@/components/common/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/common/tooltip';
import { UserAccountData, UserReserveData } from '../../types';
import CountUp from '@/components/common/count-up';
import { useMaxAmount } from '@/hooks/contracts/queries/use-max-amount';
import { normalize, normalizeBN, valueToBigNumber } from '@/utils/bignumber';
import { calculateHFAfterWithdraw } from '@/utils/hf';

const withdrawFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required!')
    .refine(
      val => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      {
        message: 'Please enter a valid positive number',
      }
    ),
});

type WithdrawFormValues = z.infer<typeof withdrawFormSchema>;

export interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reserve: UserReserveData;
  accountData: UserAccountData;
  mutateAssets: () => void;
}

// Create a debounced fetch function with lodash
const debouncedFn = debounce((callback: () => void) => {
  callback();
}, 1000);

export const WithdrawDialog: React.FC<WithdrawDialogProps> = ({
  open,
  onOpenChange,
  reserve,
  accountData,
  mutateAssets,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | undefined>(reserve.price);
  const [isRefetchEnabled, setIsRefetchEnabled] = useState(false);
  const [calculatedHealthFactor, setCalculatedHealthFactor] = useState<number>(-1);

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: {
      amount: '',
    },
  });

  // Use the asset price hook with TanStack Query
  const {
    data: priceData,
    isLoading: isPriceFetching,
    refetch: fetchPrice,
  } = useAssetPrice(reserve.assetId, isRefetchEnabled);

  const { data: maxWithdrawAmount, isLoading: isMaxWithdrawFetching } = useMaxAmount(
    reserve.assetId,
    reserve.decimals,
    'get_max_withdraw_amount'
  );

  // Use the withdraw hook
  const withdraw = useWithdraw({
    onSuccess: (result, params) => {
      console.log('Withdraw success:', { result, params });
      mutateAssets();
    },
    onError: (error, params) => {
      console.error('Withdraw error:', { error, params });
    },
  });

  // Calculate health factor based on current input
  const calculateHealthFactor = useCallback(() => {
    if (accountData.healthFactor === -1) {
      setCalculatedHealthFactor(-1);
      return;
    }

    const amount = form.watch('amount');
    if (!amount || Number(amount) <= 0) {
      setCalculatedHealthFactor(
        Number(normalizeBN(valueToBigNumber(accountData.healthFactor.toString()), 18))
      );
      return;
    }

    const hf = calculateHFAfterWithdraw(
      valueToBigNumber(accountData.totalCollateralBase.toString()),
      valueToBigNumber(normalize(reserve.price.toString(), 18)).multipliedBy(
        valueToBigNumber(amount)
      ),
      (Number(accountData.currentLiquidationThreshold) / 100).toString(),
      reserve.liquidationThreshold.toString(),
      valueToBigNumber(accountData.totalDebtBase.toString()),
      valueToBigNumber(accountData.healthFactor.toString()),
      reserve.usageAsCollateralEnabled
    );

    console.log('hf after withdraw', hf.toString());
    setCalculatedHealthFactor(Number(hf));
  }, [
    accountData,
    form,
    reserve.liquidationThreshold,
    reserve.price,
    reserve.usageAsCollateralEnabled,
  ]);

  // Handle price fetch with lodash debounce
  const handleFetchPrice = useCallback(() => {
    debouncedFn(() => {
      // Don't allow value > supply balance
      const valueWithBalance =
        Number(form.watch('amount')) > Number(maxWithdrawAmount)
          ? maxWithdrawAmount
          : form.watch('amount');
      const needToChangeValue = valueWithBalance !== form.watch('amount');
      if (needToChangeValue) {
        form.setValue('amount', valueWithBalance.toString());
      }
      setIsRefetchEnabled(true);
      fetchPrice();
      // Calculate health factor after debounce
      calculateHealthFactor();
    });
  }, [fetchPrice, form, maxWithdrawAmount, calculateHealthFactor]);

  // Update price when data is fetched
  useEffect(() => {
    if (priceData !== null && priceData !== undefined) {
      setCurrentPrice(priceData);
      // Disable refetching to prevent unnecessary calls
      setIsRefetchEnabled(false);
    }
  }, [priceData]);

  // Initialize with asset price and calculate initial health factor
  useEffect(() => {
    setCurrentPrice(reserve.price);
    calculateHealthFactor();
  }, [reserve.price, calculateHealthFactor]);

  // Watch for input changes and fetch price
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only allow numbers and a single decimal point
    const regex = /^$|^[0-9]+\.?[0-9]*$/;
    if (!regex.test(value)) {
      // if don't pass set input with 0
      form.setValue('amount', '0');
      return;
    }

    form.setValue('amount', value);

    if (value && parseFloat(value) > 0) {
      handleFetchPrice();
    } else {
      // If amount is empty or 0, reset health factor to current
      setCalculatedHealthFactor(
        accountData.healthFactor === -1
          ? -1
          : Number(normalizeBN(valueToBigNumber(accountData.healthFactor.toString()), 18))
      );
    }
  };

  const handleMaxAmount = () => {
    // Use supply balance as the max amount
    form.setValue('amount', maxWithdrawAmount.toString());
    handleFetchPrice();
  };

  const onSubmit = async (data: WithdrawFormValues) => {
    try {
      const amount = Number(data.amount);

      // Final validation checks before submission
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid positive number');
        return;
      }

      const balance = Number(maxWithdrawAmount);
      if (amount > balance) {
        toast.error(`Amount exceeds your supply balance of ${maxWithdrawAmount} ${reserve.symbol}`);
        return;
      }

      setIsSubmitting(true);

      // Use the withdraw hook
      const withdrawResult = await withdraw({
        assetId: reserve.assetId,
        amount: data.amount,
        decimals: reserve.decimals,
        isUserWithdrawMax: Number(form.watch('amount')) === Number(maxWithdrawAmount),
        withdrawType: 'none',
      });

      console.log('Withdraw submitted:', {
        amount: data.amount,
        result: withdrawResult,
      });

      if (withdrawResult.success) {
        toast.success(`Successfully withdraw ${data.amount} ${reserve.symbol}`);
        // Close dialog after successful operation
        onOpenChange(false);
      } else {
        toast.error(`Failed to withdraw: ${withdrawResult.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting withdraw:', error);
      toast.error('Failed to submit withdraw transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentHealthFactor =
    accountData.healthFactor === -1
      ? -1
      : normalizeBN(valueToBigNumber(accountData.healthFactor.toString()), 18);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-xl">
        <TooltipProvider delayDuration={300}>
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-2xl font-semibold">
                Withdraw {reserve.symbol}
              </DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Typography className="flex items-center gap-1">Amount</Typography>
                </div>

                <div className="border px-3 py-2 rounded-lg">
                  <div className="relative">
                    <Input
                      {...form.register('amount')}
                      autoComplete="off"
                      placeholder="0.00"
                      className="p-0 text-xl font-medium placeholder:text-submerged focus-visible:ring-tranparent focus-visible:outline-none focus-visible:ring-0 w-[60%]"
                      inputMode="decimal"
                      pattern="[0-9]*[.]?[0-9]*"
                      min={0.0}
                      max={maxWithdrawAmount}
                      step="any"
                      onChange={handleAmountChange}
                    />
                    <div className="flex items-center gap-2 absolute right-0 top-1/2 -translate-y-1/2">
                      {/* clear icon */}
                      {form.watch('amount') && (
                        <Button
                          variant="none"
                          size="icon"
                          onClick={() => {
                            form.setValue('amount', '');
                            // Reset health factor when clearing input
                            setCalculatedHealthFactor(
                              accountData.healthFactor === -1
                                ? -1
                                : Number(
                                    normalizeBN(
                                      valueToBigNumber(accountData.healthFactor.toString()),
                                      18
                                    )
                                  )
                            );
                          }}
                          className="hover:opacity-70"
                        >
                          <CircleX className="h-6 w-6 text-embossed" />
                        </Button>
                      )}
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={reserve.iconUrl} alt={reserve.symbol} />
                        <AvatarFallback>{reserve.symbol.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-row items-center gap-1">
                        <span className="font-medium text-lg">{reserve.symbol}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-base">
                    {isPriceFetching ? (
                      <Skeleton className="h-5 w-20" />
                    ) : (
                      <CountUp
                        value={(currentPrice || 0) * Number(form.watch('amount'))}
                        prefix="$"
                        className="text-base"
                      />
                    )}
                    <div
                      className="flex flex-row items-center gap-1 text-primary cursor-pointer"
                      onClick={handleMaxAmount}
                    >
                      <div className="flex flex-row items-center gap-1 cursor-pointer">
                        <Typography>Available: </Typography>
                        {isMaxWithdrawFetching ? (
                          <Skeleton className="h-5 w-20" />
                        ) : (
                          <Typography className="font-bold">{maxWithdrawAmount}</Typography>
                        )}
                        <Typography className="font-bold text-primary">MAX</Typography>
                      </div>
                    </div>
                  </div>
                </div>

                {form.formState.errors.amount && (
                  <Typography className="text-destructive">
                    {form.formState.errors.amount.message}
                  </Typography>
                )}
              </div>

              <div className="space-y-4">
                <Typography weight="semibold" className="text-lg">
                  Transaction overview
                </Typography>

                <div className="flex justify-between items-center">
                  <Typography className="flex items-center gap-1">Remaining supply</Typography>
                  <Typography weight="medium">
                    <CountUp
                      value={maxWithdrawAmount - Number(form.watch('amount'))}
                      suffix={` ${reserve.symbol}`}
                      decimals={6}
                    />
                  </Typography>
                </div>

                <div className="flex justify-between items-center">
                  <Typography className="flex items-center gap-1">
                    Health factor
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger type="button">
                        <Info className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Liquidation occurs when health factor is below 1.0</p>
                      </TooltipContent>
                    </Tooltip>
                  </Typography>

                  <div className="flex flex-row items-center justify-center gap-1">
                    {Number(currentHealthFactor) === -1 ? (
                      <Typography className="text-green-500 text-3xl text-bold">∞</Typography>
                    ) : (
                      <CountUp
                        value={Number(currentHealthFactor)}
                        decimals={2}
                        className={
                          Number(currentHealthFactor) === -1
                            ? 'text-green-500'
                            : Number(currentHealthFactor) <= 1.25
                              ? 'text-red-500'
                              : Number(currentHealthFactor) <= 1.5
                                ? 'text-amber-500'
                                : 'text-green-500'
                        }
                      />
                    )}

                    {/* icon arrow left to right */}
                    <ArrowRight className="h-4 w-4 mb-1 text-muted-foreground" />

                    {!form.watch('amount') || Number(form.watch('amount')) === 0 ? (
                      <Typography className="text-muted-foreground font-medium">_</Typography>
                    ) : calculatedHealthFactor === -1 ? (
                      <Typography className="!text-green-500 text-3xl text-bold">∞</Typography>
                    ) : (
                      <CountUp
                        value={calculatedHealthFactor}
                        decimals={2}
                        className={
                          calculatedHealthFactor === -1
                            ? 'text-green-500'
                            : calculatedHealthFactor <= 1.25
                              ? 'text-red-500'
                              : calculatedHealthFactor <= 1.5
                                ? 'text-amber-500'
                                : 'text-green-500'
                        }
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Typography className="flex items-center gap-1">Withdraw amount</Typography>
                  <div className="font-medium text-base flex flex-row items-center gap-1">
                    <CountUp
                      value={Number(form.watch('amount'))}
                      suffix={` ${reserve.symbol}`}
                      decimals={6}
                    />
                    ~{' '}
                    {isPriceFetching ? (
                      <Skeleton className="inline-block h-5 w-20" />
                    ) : (
                      <CountUp
                        value={(currentPrice || 0) * Number(form.watch('amount'))}
                        prefix="$"
                        className="text-base"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {isSubmitting ? (
                <Button disabled className="w-full bg-muted text-muted-foreground text-lg py-6">
                  Processing...
                </Button>
              ) : !form.watch('amount') || parseFloat(form.watch('amount')) === 0 ? (
                <Button disabled className="w-full text-lg py-6">
                  Enter an amount
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  type="submit"
                  className="w-full text-lg py-6"
                  disabled={!form.watch('amount')}
                >
                  Withdraw {reserve.symbol}
                </Button>
              )}
            </div>
          </form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};
