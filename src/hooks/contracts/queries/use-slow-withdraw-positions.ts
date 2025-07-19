import { useQuery } from '@tanstack/react-query';
import { useChromiaAccount } from '../../configs/chromia-hooks';
import { keysToCamelCase } from '@/utils/object';
import { normalizeBN } from '@/utils/bignumber';

// Enum slow withdraw status từ Rell
export enum SlowWithdrawStatus {
  PENDING_SLOW_WITHDRAW = 0,
  PENDING_WITHDRAW_REQUESTED = 1,
  WITHDRAW = 2,
  TRANSFER_TO_ADMIN = 3,
  BRIDGING_TO_CHR = 4,
  CROSS_CHAIN_TRANSFERRING_TO_UDON = 5,
  WITHDRAWED = 6,
}

// Enum failure stage từ Rell for slow withdraw
export enum SlowWithdrawFailureStage {
  NO_FAILURE = 0,
  S_WITHDRAW_REQUEST = 6,
  S_WITHDRAW_HANDLE = 7,
  S_WITHDRAW_BRIDGE_ASSET = 8,
  S_WITHDRAW_TRANSFER_UDON = 9,
}

export interface SlowWithdrawPosition {
  positionId: Buffer<ArrayBufferLike>;
  userAccountId: Buffer<ArrayBufferLike>;
  underlyingAssetId: Buffer<ArrayBufferLike>;
  stAssetAmount: number;
  assetAmount: number;
  slowWithdrawStatus: SlowWithdrawStatus | string;
  failureStage: SlowWithdrawFailureStage | string;
  withdrawTxHash: string;
  withdrawTimestamp: number;
  unstakingRequestedAt: number;
  unstakingAvailableAt: number;
}

/**
 * Hook to fetch user's slow withdraw positions
 */
export function useSlowWithdrawPositions() {
  const { client, account } = useChromiaAccount();

  const query = useQuery({
    queryKey: ['slow-withdraw-positions', account?.id],
    queryFn: async () => {
      if (!client || !account) {
        throw new Error('Missing client or account');
      }

      console.log('Fetching slow withdraw positions for user:', account.id);

      // Fetch all slow withdraw positions for the user
      const positionsResult = await client.query('get_user_slow_withdraw_positions', {
        user_account_id: account.id,
      });

      console.log('Slow withdraw positions raw results:', positionsResult);

      const rawPositions = (Array.isArray(positionsResult) ? positionsResult : []).map(p =>
        keysToCamelCase(p)
      ) as SlowWithdrawPosition[];

      // Format positions with proper number conversion
      const positions = rawPositions.map(p => ({
        ...p,
        stAssetAmount: Number(normalizeBN(p.stAssetAmount.toString(), 6)),
        assetAmount: Number(normalizeBN(p.assetAmount.toString(), 6)),
      }));

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
 * Helper function to get slow withdraw status for a specific asset
 */
export function getSlowWithdrawStatusForAsset(
  assetSymbol: string,
  slowWithdrawData?: {
    positions: SlowWithdrawPosition[];
  }
): {
  withdrawStatus: SlowWithdrawStatus | string | null;
  hasError: boolean;
  errorStage: SlowWithdrawFailureStage | string | null;
  isCompleted: boolean;
  isReadyToWithdraw: boolean;
  canCompleteWithdraw: boolean;
  position: SlowWithdrawPosition | null;
} {
  if (!slowWithdrawData || assetSymbol !== 'tCHR') {
    return {
      withdrawStatus: null,
      hasError: false,
      errorStage: null,
      isCompleted: false,
      isReadyToWithdraw: false,
      canCompleteWithdraw: false,
      position: null,
    };
  }

  const { positions } = slowWithdrawData;

  // Find the most recent position for CHR asset (assuming tCHR maps to CHR in the backend)
  const position = positions.find(p => p.underlyingAssetId !== null) || null;

  if (!position) {
    return {
      withdrawStatus: null,
      hasError: false,
      errorStage: null,
      isCompleted: false,
      isReadyToWithdraw: false,
      canCompleteWithdraw: false,
      position: null,
    };
  }

  // Check if has error - handle both string and enum
  const hasError =
    position.failureStage !== SlowWithdrawFailureStage.NO_FAILURE &&
    position.failureStage !== 'NO_FAILURE';

  // Check if completed - handle both string and enum
  const isCompleted =
    position.slowWithdrawStatus === SlowWithdrawStatus.WITHDRAWED ||
    position.slowWithdrawStatus === 'WITHDRAWED';

  // Check if ready to withdraw (crossed unstaking period)
  const isReadyToWithdraw =
    position.unstakingAvailableAt > 0 && Date.now() >= position.unstakingAvailableAt * 1000;

  // Check if can complete withdraw (status is CROSS_CHAIN_TRANSFERRING_TO_UDON)
  const canCompleteWithdraw =
    position.slowWithdrawStatus === SlowWithdrawStatus.CROSS_CHAIN_TRANSFERRING_TO_UDON ||
    position.slowWithdrawStatus === 'CROSS_CHAIN_TRANSFERRING_TO_UDON';

  return {
    withdrawStatus: position.slowWithdrawStatus,
    hasError,
    errorStage: hasError ? position.failureStage : null,
    isCompleted,
    isReadyToWithdraw,
    canCompleteWithdraw,
    position,
  };
}
