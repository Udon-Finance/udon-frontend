import { useQuery } from '@tanstack/react-query';
import { useChromiaAccount } from '../../configs/chromia-hooks';
import { normalize, normalizeBN } from '@/utils/bignumber';

// Types for the new 3-option withdraw system
export interface UserStChrBreakdown {
  stakingPrincipalStchr: number; // CHR gốc được stake
  stakingRewardsStchr: number; // Thưởng từ BSC staking
  lendingRewardsStchr: number; // Thưởng từ lending pool
  totalStchr: number; // Tổng tất cả
  maxWithdrawAmount: number; // Max amount có thể rút từ lending pool (collateral constraints)
}

export interface UserWithdrawOptions {
  maxChrWithdraw: number; // Max CHR có thể rút (slow withdraw)
  maxStchrImmediateWithdraw: number; // Max stCHR có thể rút ngay
  maxTotalValue: number; // Tổng giá trị sở hữu
}

export interface HybridValidation {
  finalStchrAmount: number;
  finalChrAmount: number;
  isValid: boolean;
}

export interface WithdrawDashboard {
  stakingPrincipalStchr: number;
  stakingRewardsStchr: number;
  lendingRewardsStchr: number;
  totalStchr: number;
  maxChrWithdraw: number;
  maxStchrImmediateWithdraw: number;
  maxTotalValue: number;
}

/**
 * Hook to get user's stCHR breakdown into 3 types
 */
export function useUserStChrBreakdown(
  assetId: Buffer,
  decimals: number = 18,
  enabled: boolean = true
) {
  const { client, account } = useChromiaAccount();

  return useQuery({
    queryKey: ['user-stchr-breakdown', account?.id, assetId],
    queryFn: async (): Promise<UserStChrBreakdown> => {
      if (!client || !account?.id || !assetId) {
        throw new Error('Client, Account ID, or Asset ID is missing');
      }

      try {
        const response = await client.query('get_user_stchr_breakdown_query', {
          user_id: account.id,
          asset_id: assetId,
        });

        // Response is tuple: [staking_principal, staking_rewards, lending_rewards, total, max_withdraw_amount]
        const [stakingPrincipal, stakingRewards, lendingRewards, total, maxWithdraw] =
          response as unknown as number[];

        return {
          stakingPrincipalStchr: normalize(stakingPrincipal.toString(), decimals).toNumber(),
          stakingRewardsStchr: normalize(stakingRewards.toString(), decimals).toNumber(),
          lendingRewardsStchr: normalize(lendingRewards.toString(), decimals).toNumber(),
          totalStchr: normalize(total.toString(), decimals).toNumber(),
          maxWithdrawAmount: normalize(maxWithdraw.toString(), decimals).toNumber(),
        };
      } catch (error) {
        console.error('Error fetching stCHR breakdown:', error);
        throw error;
      }
    },
    enabled: enabled && !!client && !!account?.id && !!assetId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000,
  });
}

/**
 * Hook to get user's withdraw options with max amounts
 */
export function useUserWithdrawOptions(
  assetId: Buffer,
  decimals: number = 18,
  enabled: boolean = true
) {
  const { client, account } = useChromiaAccount();

  return useQuery({
    queryKey: ['user-withdraw-options', account?.id, assetId],
    queryFn: async (): Promise<UserWithdrawOptions> => {
      if (!client || !account?.id || !assetId) {
        throw new Error('Client, Account ID, or Asset ID is missing');
      }

      try {
        const response = await client.query('get_user_withdraw_options_query', {
          user_id: account.id,
          asset_id: assetId,
        });

        // Response is tuple: [max_chr_withdraw, max_stchr_immediate_withdraw, max_total_value]
        const [maxChr, maxStchrImmediate, maxTotal] = response as unknown as number[];

        return {
          maxChrWithdraw: normalize(maxChr.toString(), decimals).toNumber(),
          maxStchrImmediateWithdraw: normalize(maxStchrImmediate.toString(), decimals).toNumber(),
          maxTotalValue: normalize(maxTotal.toString(), decimals).toNumber(),
        };
      } catch (error) {
        console.error('Error fetching withdraw options:', error);
        throw error;
      }
    },
    enabled: enabled && !!client && !!account?.id && !!assetId,
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

/**
 * Hook to validate hybrid withdraw amounts before submission
 */
export function useValidateHybridWithdraw(
  assetId: Buffer,
  stchrAmount: number,
  chrAmount: number,
  decimals: number = 18,
  enabled: boolean = true
) {
  const { client, account } = useChromiaAccount();

  return useQuery({
    queryKey: ['validate-hybrid-withdraw', account?.id, assetId, stchrAmount, chrAmount],
    queryFn: async (): Promise<HybridValidation> => {
      if (!client || !account?.id || !assetId) {
        throw new Error('Client, Account ID, or Asset ID is missing');
      }

      try {
        const response = await client.query('validate_hybrid_withdraw_query', {
          user_id: account.id,
          asset_id: assetId,
          requested_stchr_amount: normalizeBN(stchrAmount.toString(), decimals),
          requested_chr_amount: normalizeBN(chrAmount.toString(), decimals),
        });

        // Response is tuple: [final_stchr, final_chr, is_valid]
        const [finalStchr, finalChr, isValid] = response as unknown as [number, number, boolean];

        return {
          finalStchrAmount: normalize(finalStchr.toString(), decimals).toNumber(),
          finalChrAmount: normalize(finalChr.toString(), decimals).toNumber(),
          isValid,
        };
      } catch (error) {
        console.error('Error validating hybrid withdraw:', error);
        return {
          finalStchrAmount: 0,
          finalChrAmount: 0,
          isValid: false,
        };
      }
    },
    enabled:
      enabled && !!client && !!account?.id && !!assetId && (stchrAmount > 0 || chrAmount > 0),
    staleTime: 5000, // Shorter stale time for real-time validation
    refetchInterval: false, // Don't auto-refetch for validation
  });
}

/**
 * Hook to get complete dashboard data for withdraw interface
 */
export function useWithdrawDashboard(
  assetId: Buffer,
  decimals: number = 18,
  enabled: boolean = true
) {
  const { client, account } = useChromiaAccount();

  return useQuery({
    queryKey: ['withdraw-dashboard', account?.id, assetId],
    queryFn: async (): Promise<WithdrawDashboard> => {
      if (!client || !account?.id || !assetId) {
        throw new Error('Client, Account ID, or Asset ID is missing');
      }

      try {
        const response = await client.query('get_user_withdraw_dashboard', {
          user_id: account.id,
          asset_id: assetId,
        });

        // Response is map/object with named fields
        const data = response as Record<string, number>;

        return {
          stakingPrincipalStchr: normalize(
            (data.staking_principal_stchr || 0).toString(),
            decimals
          ).toNumber(),
          stakingRewardsStchr: normalize(
            (data.staking_rewards_stchr || 0).toString(),
            decimals
          ).toNumber(),
          lendingRewardsStchr: normalize(
            (data.lending_rewards_stchr || 0).toString(),
            decimals
          ).toNumber(),
          totalStchr: normalize((data.total_stchr || 0).toString(), decimals).toNumber(),
          maxChrWithdraw: normalize((data.max_chr_withdraw || 0).toString(), decimals).toNumber(),
          maxStchrImmediateWithdraw: normalize(
            (data.max_stchr_immediate_withdraw || 0).toString(),
            decimals
          ).toNumber(),
          maxTotalValue: normalize((data.max_total_value || 0).toString(), decimals).toNumber(),
        };
      } catch (error) {
        console.error('Error fetching withdraw dashboard:', error);
        throw error;
      }
    },
    enabled: enabled && !!client && !!account?.id && !!assetId,
    staleTime: 30000,
    refetchInterval: 30000,
  });
}

/**
 * Hook to get hybrid withdraw constraints for UI guidance
 */
export function useHybridWithdrawConstraints(
  assetId: Buffer,
  decimals: number = 18,
  enabled: boolean = true
) {
  const { client, account } = useChromiaAccount();

  return useQuery({
    queryKey: ['hybrid-withdraw-constraints', account?.id, assetId],
    queryFn: async (): Promise<Record<string, number>> => {
      if (!client || !account?.id || !assetId) {
        throw new Error('Client, Account ID, or Asset ID is missing');
      }

      try {
        const response = await client.query('get_hybrid_withdraw_constraints', {
          user_id: account.id,
          asset_id: assetId,
        });

        // Response is map/object with constraint values
        const constraints = response as Record<string, number>;

        // Convert all values using normalize for consistency
        const normalizedConstraints: Record<string, number> = {};
        for (const [key, value] of Object.entries(constraints)) {
          normalizedConstraints[key] = normalize((value || 0).toString(), decimals).toNumber();
        }

        return normalizedConstraints;
      } catch (error) {
        console.error('Error fetching hybrid constraints:', error);
        throw error;
      }
    },
    enabled: enabled && !!client && !!account?.id && !!assetId,
    staleTime: 60000, // 1 minute - constraints don't change often
    refetchInterval: false,
  });
}
