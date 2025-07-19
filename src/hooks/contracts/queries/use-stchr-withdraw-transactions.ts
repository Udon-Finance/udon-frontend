import { useQuery } from '@tanstack/react-query';
import { useChromiaAccount } from '../../configs/chromia-hooks';
import { keysToCamelCase } from '@/utils/object';
import { normalizeBN } from '@/utils/bignumber';

export interface StchrWithdrawTransaction {
  transactionId: Buffer<ArrayBufferLike>;
  userAccountId: Buffer<ArrayBufferLike>;
  underlyingAssetId: Buffer<ArrayBufferLike>;
  totalStchrAmount: number;
  amountFromLending: number;
  amountFromStakingRewards: number;
  stakingPrincipalBefore: number;
  stakingRewardsBefore: number;
  lendingRewardsBefore: number;
  totalStchrBefore: number;
  withdrawType: string; // "lending_only", "hybrid", "max"
  createdAt: number;
}

/**
 * Hook to fetch user's stCHR withdraw transaction history
 */
export function useStchrWithdrawTransactions(enabled: boolean = true) {
  const { client, account } = useChromiaAccount();

  const query = useQuery({
    queryKey: ['stchr-withdraw-transactions', account?.id],
    queryFn: async () => {
      if (!client || !account) {
        throw new Error('Missing client or account');
      }

      console.log('Fetching stCHR withdraw transactions for user:', account.id);

      // Fetch all stCHR withdraw transactions for the user
      const transactionsResult = await client.query('get_user_stchr_withdraw_transactions', {
        user_account_id: account.id,
      });

      console.log('stCHR withdraw transactions raw results:', transactionsResult);

      const rawTransactions = (Array.isArray(transactionsResult) ? transactionsResult : []).map(t =>
        keysToCamelCase(t)
      ) as StchrWithdrawTransaction[];

      // Format transactions with proper number conversion (assuming 6 decimals for tCHR)
      const transactions = rawTransactions.map(t => ({
        ...t,
        totalStchrAmount: Number(normalizeBN(t.totalStchrAmount.toString(), 6)),
        amountFromLending: Number(normalizeBN(t.amountFromLending.toString(), 6)),
        amountFromStakingRewards: Number(normalizeBN(t.amountFromStakingRewards.toString(), 6)),
        stakingPrincipalBefore: Number(normalizeBN(t.stakingPrincipalBefore.toString(), 6)),
        stakingRewardsBefore: Number(normalizeBN(t.stakingRewardsBefore.toString(), 6)),
        lendingRewardsBefore: Number(normalizeBN(t.lendingRewardsBefore.toString(), 6)),
        totalStchrBefore: Number(normalizeBN(t.totalStchrBefore.toString(), 6)),
      }));

      return {
        transactions,
      };
    },
    enabled: enabled && !!client && !!account?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 30000, // 30 seconds
    retry: 2,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Helper function to get stCHR withdraw transaction status for a specific asset
 */
export function getStchrWithdrawTransactionsForAsset(
  assetSymbol: string,
  transactionData?: {
    transactions: StchrWithdrawTransaction[];
  }
): {
  transactions: StchrWithdrawTransaction[];
  hasTransactions: boolean;
  latestTransaction: StchrWithdrawTransaction | null;
  totalWithdrawn: number;
} {
  if (!transactionData || assetSymbol !== 'tCHR') {
    return {
      transactions: [],
      hasTransactions: false,
      latestTransaction: null,
      totalWithdrawn: 0,
    };
  }

  const { transactions } = transactionData;

  // Filter transactions for CHR asset (assuming tCHR maps to CHR in the backend)
  const chrTransactions = transactions.filter(t => t.underlyingAssetId !== null);

  // Get latest transaction (most recent)
  const latestTransaction =
    chrTransactions.length > 0
      ? chrTransactions.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      : null;

  // Calculate total withdrawn
  const totalWithdrawn = chrTransactions.reduce((sum, t) => sum + t.totalStchrAmount, 0);

  return {
    transactions: chrTransactions,
    hasTransactions: chrTransactions.length > 0,
    latestTransaction,
    totalWithdrawn,
  };
}
