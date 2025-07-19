import { useQuery } from '@tanstack/react-query';
import { useChromiaAccount } from '../../configs/chromia-hooks';
import { keysToCamelCase } from '@/utils/object';
import { normalizeBN } from '@/utils/bignumber';

// Enum staking status từ Rell
export enum StakingStatus {
  PENDING_STAKING = 0,
  CROSS_CHAIN_TRANSFERRING_TO_ECONOMY = 1,
  BRIDGING_TO_BSC = 2,
  TRANSFER_TO_USER = 3,
  APPROVE_ERC20 = 4,
  STAKED = 5,
}

// Enum failure stage từ Rell
export enum LsdFailureStage {
  NO_FAILURE = 0,
  STAKING_TRANSFER_ECONOMY = 1,
  STAKING_BRIDGING_BSC = 2,
  STAKING_TRANSFER_USER_BSC = 3,
  STAKING_APPROVE_ERC20_BSC = 4,
  STAKING_HANDLE = 5,
  S_WITHDRAW_REQUEST = 6,
  S_WITHDRAW_HANDLE = 7,
  S_WITHDRAW_BRIDGE_ASSET = 8,
  S_WITHDRAW_TRANSFER_UDON = 9,
  Q_WITHDRAW_TRANSFER_DEX = 10,
  Q_WITHDRAW_HANDLE_SWAP = 11,
  Q_WITHDRAW_TRANSFER_UDON = 12,
}

export interface UserLsdPosition {
  userAccountId: Buffer<ArrayBufferLike>;
  underlyingAssetId: Buffer<ArrayBufferLike>;
  status: LsdFailureStage | string; // Can be enum number or string from backend
  totalStAssetStaking: number;
  totalStAssetStakingAndReward: number;
  currentTotalStAssetStaking: number;
  currentTotalStAssetStakingAndReward: number;
  // availableForWithdraw: number;
  // pendingWithdrawals: number;
  createdAt: string;
  lastSupplyAt: string;
}

export interface UserSupplyRecord {
  positionId: Buffer<ArrayBufferLike>;
  userAccountId: Buffer<ArrayBufferLike>;
  underlyingAssetId: Buffer<ArrayBufferLike>;
  expectedAmount: number;
  netAmount: number;
  stAssetAmount: number;
  supplyFee: number;
  bscStakingAddress: string;
  stakingStatus: StakingStatus | string; // Can be enum number or string from backend
  createdAt: string;
  completedAt: string;
}

export interface UserAccumulatedRewards {
  userAccountId: Buffer<ArrayBufferLike>;
  underlyingAssetId: Buffer<ArrayBufferLike>;
  totalAssetCollected: number;
  totalLendingRewards: number;
  currentStakingRewards: number;
  totalStakingRewards: number;
  bscStakingAddress: string;
  bscStakeAmount: number;
  bscRewardAmount: number;
  lastUpdateTimestamp: string;
}

/**
 * Hook to fetch user's LSD position data
 */
export function useLsdPosition() {
  const { client, account } = useChromiaAccount();

  const query = useQuery({
    queryKey: ['lsd-position', account?.id],
    queryFn: async () => {
      if (!client || !account) {
        throw new Error('Missing client or account');
      }

      // Fetch user LSD position
      const positionResult = await client.query('get_user_lsd_position', {
        user_account_id: account.id,
      });

      // Fetch user supply records (staking positions)
      const supplyRecordsResult = await client.query('get_user_supply_records', {
        user_account_id: account.id,
      });

      // Fetch user accumulated rewards
      const rewardsResult = await client.query('get_user_accumulated_rewards', {
        user_account_id: account.id,
      });

      const rawPositions = (Array.isArray(positionResult) ? positionResult : []).map(p =>
        keysToCamelCase(p)
      ) as UserLsdPosition[];

      // Format positions with proper number conversion
      const positions = rawPositions.map(p => ({
        ...p,
        userAccountId: p.userAccountId,
        underlyingAssetId: p.underlyingAssetId,
        totalStAssetStaking: Number(normalizeBN(p.totalStAssetStaking.toString(), 6)),
        totalStAssetStakingAndReward: Number(
          normalizeBN(p.totalStAssetStakingAndReward.toString(), 6)
        ),
        currentTotalStAssetStaking: Number(normalizeBN(p.currentTotalStAssetStaking.toString(), 6)),
        currentTotalStAssetStakingAndReward: Number(
          normalizeBN(p.currentTotalStAssetStakingAndReward.toString(), 6)
        ),
        // availableForWithdraw: Number(normalizeBN(p.availableForWithdraw.toString(), 6)),
        // pendingWithdrawals: Number(normalizeBN(p.pendingWithdrawals.toString(), 6)),
      }));

      const rawSupplyRecords = (Array.isArray(supplyRecordsResult) ? supplyRecordsResult : []).map(
        s => keysToCamelCase(s)
      ) as UserSupplyRecord[];

      // Format supply records with proper number conversion
      const supplyRecords = rawSupplyRecords.map(s => ({
        ...s,
        positionId: s.positionId,
        userAccountId: s.userAccountId,
        underlyingAssetId: s.underlyingAssetId,
        expectedAmount: Number(normalizeBN(s.expectedAmount.toString(), 6)),
        netAmount: Number(normalizeBN(s.netAmount.toString(), 6)),
        stAssetAmount: Number(normalizeBN(s.stAssetAmount.toString(), 6)),
        supplyFee: Number(normalizeBN(s.supplyFee.toString(), 6)),
      }));

      const rawRewards = (Array.isArray(rewardsResult) ? rewardsResult : []).map(r =>
        keysToCamelCase(r)
      ) as UserAccumulatedRewards[];

      // Format rewards with proper number conversion
      const rewards = rawRewards.map(r => ({
        ...r,
        userAccountId: r.userAccountId,
        underlyingAssetId: r.underlyingAssetId,
        totalAssetCollected: Number(normalizeBN(r.totalAssetCollected.toString(), 6)),
        totalLendingRewards: Number(normalizeBN(r.totalLendingRewards.toString(), 6)),
        currentStakingRewards: Number(normalizeBN(r.currentStakingRewards.toString(), 6)),
        totalStakingRewards: Number(normalizeBN(r.totalStakingRewards.toString(), 6)),
        bscStakeAmount: Number(normalizeBN(r.bscStakeAmount.toString(), 6)),
        bscRewardAmount: Number(normalizeBN(r.bscRewardAmount.toString(), 6)),
      }));

      return {
        positions,
        supplyRecords,
        rewards,
      };
    },
    enabled: !!client && !!account?.id,
    refetchInterval: 10000, // Refetch every 10 seconds to track staking progress
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
 * Helper function to get staking status for a specific asset
 */
export function getStakingStatusForAsset(
  assetSymbol: string,
  lsdData?: {
    positions: UserLsdPosition[];
    supplyRecords: UserSupplyRecord[];
    rewards: UserAccumulatedRewards[];
  }
): {
  stakingStatus: StakingStatus | string | null;
  hasError: boolean;
  errorStage: LsdFailureStage | string | null;
  stakingAPY: number;
  isStaked: boolean;
} {
  if (!lsdData || assetSymbol !== 'tCHR') {
    return {
      stakingStatus: null,
      hasError: false,
      errorStage: null,
      stakingAPY: 0,
      isStaked: false,
    };
  }

  const { positions, supplyRecords, rewards } = lsdData;

  // Find position for CHR asset (assuming tCHR maps to CHR in the backend)
  const position = positions[0]; // Since we only support CHR for LSD
  const supplyRecord = supplyRecords[0]; // Latest supply record
  const reward = rewards[0]; // Accumulated rewards

  if (!position || !supplyRecord) {
    return {
      stakingStatus: null,
      hasError: false,
      errorStage: null,
      stakingAPY: 0,
      isStaked: false,
    };
  }

  // Check if has error - handle both string and enum
  const hasError =
    position.status !== LsdFailureStage.NO_FAILURE && position.status !== 'NO_FAILURE';

  // Check if staked - handle both string and enum
  const isStaked =
    supplyRecord.stakingStatus === StakingStatus.STAKED || supplyRecord.stakingStatus === 'STAKED';

  // Calculate staking APY from rewards (simplified calculation)
  let stakingAPY = 0;
  if (isStaked && reward && reward.totalStakingRewards > 0 && reward.bscStakeAmount > 0) {
    // This is a simplified calculation - in real implementation you might want to
    // calculate based on time periods and compound interest
    // stakingAPY = (reward.totalStakingRewards / reward.bscStakeAmount) * 100;
    stakingAPY = 3;
  }

  return {
    stakingStatus: supplyRecord.stakingStatus,
    hasError,
    errorStage: hasError ? position.status : null,
    stakingAPY,
    isStaked,
  };
}
