import { useQuery } from '@tanstack/react-query';
import { useChromiaAccount } from '../../configs/chromia-hooks';
import { keysToCamelCase } from '@/utils/object';
import { normalizeBN } from '@/utils/bignumber';

// Enum quick withdraw status từ Rell
export enum QuickWithdrawStatus {
  PENDING_QUICK_WITHDRAW = 0,
  CROSS_CHAIN_TRANSFERRING_TO_DEX = 1,
  SWAP_STCHR_TO_CHR = 2,
  CROSS_CHAIN_TRANSFERRING_TO_UDON = 3,
  WITHDRAWED = 4,
}

// Enum failure stage từ Rell for quick withdraw
export enum QuickWithdrawFailureStage {
  NO_FAILURE = 0,
  Q_WITHDRAW_TRANSFER_DEX = 10,
  Q_WITHDRAW_HANDLE_SWAP = 11,
  Q_WITHDRAW_TRANSFER_UDON = 12,
}

export interface QuickWithdrawPosition {
  positionId: Buffer<ArrayBufferLike>;
  userAccountId: Buffer<ArrayBufferLike>;
  underlyingAssetId: Buffer<ArrayBufferLike>;
  stAssetAmount: number;
  assetAmount: number;
  quickWithdrawStatus: QuickWithdrawStatus | string;
  failureStage: QuickWithdrawFailureStage | string;
  dexSwapTxHash: string;
  swapTimestamp: number;
  crossChainTxId: Buffer<ArrayBufferLike>;
  createdAt: number;
  isActive: boolean;
}

/**
 * Hook to fetch user's quick withdraw positions
 */
export function useQuickWithdrawPositions() {
  const { client, account } = useChromiaAccount();

  const query = useQuery({
    queryKey: ['quick-withdraw-positions', account?.id],
    queryFn: async () => {
      if (!client || !account) {
        throw new Error('Missing client or account');
      }

      console.log('Fetching quick withdraw positions for user:', account.id);

      // Fetch all quick withdraw positions for the user
      const positionsResult = await client.query('get_user_quick_withdraw_positions', {
        user_account_id: account.id,
      });

      console.log('Quick withdraw positions raw results:', positionsResult);

      const rawPositions = (Array.isArray(positionsResult) ? positionsResult : []).map(p =>
        keysToCamelCase(p)
      ) as QuickWithdrawPosition[];

      // Format positions with proper number conversion
      const positions = rawPositions.map(p => ({
        ...p,
        stAssetAmount: Number(normalizeBN(p.stAssetAmount.toString(), 6)),
        assetAmount: Number(normalizeBN(p.assetAmount.toString(), 6)),
      }));

      // console.log('Quick withdraw positions:', positionsResult[0].position_id.toString('hex'));

      return {
        positions,
      };
    },
    enabled: !!client && !!account?.id,
    refetchInterval: 10000, // Refetch every 10 seconds to track withdraw progress
    staleTime: 10000, // 10 seconds
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
 * Helper function to get quick withdraw status for a specific asset
 */
export function getQuickWithdrawStatusForAsset(
  assetSymbol: string,
  quickWithdrawData?: {
    positions: QuickWithdrawPosition[];
  }
): {
  withdrawPositions: QuickWithdrawPosition[];
  hasActiveWithdraws: boolean;
  canCompleteWithdraws: QuickWithdrawPosition[];
  hasError: boolean;
  errorPositions: QuickWithdrawPosition[];
} {
  if (!quickWithdrawData || assetSymbol !== 'tCHR') {
    return {
      withdrawPositions: [],
      hasActiveWithdraws: false,
      canCompleteWithdraws: [],
      hasError: false,
      errorPositions: [],
    };
  }

  const { positions } = quickWithdrawData;

  // Filter positions for CHR asset (assuming tCHR maps to CHR in the backend)
  const chrPositions = positions.filter(p => p.underlyingAssetId !== null);

  // Find positions with errors
  const errorPositions = chrPositions.filter(
    p => p.failureStage !== QuickWithdrawFailureStage.NO_FAILURE && p.failureStage !== 'NO_FAILURE'
  );

  // Find positions that can be completed (status is CROSS_CHAIN_TRANSFERRING_TO_UDON)
  const canCompleteWithdraws = chrPositions.filter(
    p =>
      p.quickWithdrawStatus === QuickWithdrawStatus.CROSS_CHAIN_TRANSFERRING_TO_UDON ||
      p.quickWithdrawStatus === 'CROSS_CHAIN_TRANSFERRING_TO_UDON'
  );

  // Check if there are any active withdraws (not completed)
  const hasActiveWithdraws = chrPositions.some(
    p =>
      p.quickWithdrawStatus !== QuickWithdrawStatus.WITHDRAWED &&
      p.quickWithdrawStatus !== 'WITHDRAWED'
  );

  return {
    withdrawPositions: chrPositions,
    hasActiveWithdraws,
    canCompleteWithdraws,
    hasError: errorPositions.length > 0,
    errorPositions,
  };
}

/**
 * Helper function to get status info for a specific quick withdraw position
 */
export function getQuickWithdrawPositionStatus(position: QuickWithdrawPosition): {
  isCompleted: boolean;
  isInProgress: boolean;
  hasError: boolean;
  canComplete: boolean;
  statusLabel: string;
} {
  const hasError =
    position.failureStage !== QuickWithdrawFailureStage.NO_FAILURE &&
    position.failureStage !== 'NO_FAILURE';

  const isCompleted =
    position.quickWithdrawStatus === QuickWithdrawStatus.WITHDRAWED ||
    position.quickWithdrawStatus === 'WITHDRAWED';

  const canComplete =
    position.quickWithdrawStatus === QuickWithdrawStatus.CROSS_CHAIN_TRANSFERRING_TO_UDON ||
    position.quickWithdrawStatus === 'CROSS_CHAIN_TRANSFERRING_TO_UDON';

  const isInProgress = !isCompleted && !hasError;

  let statusLabel = 'Unknown';
  if (hasError) {
    statusLabel = 'Failed';
  } else if (isCompleted) {
    statusLabel = 'Completed';
  } else if (canComplete) {
    statusLabel = 'Ready to Withdraw';
  } else {
    statusLabel = 'Processing';
  }

  return {
    isCompleted,
    isInProgress,
    hasError,
    canComplete,
    statusLabel,
  };
}
