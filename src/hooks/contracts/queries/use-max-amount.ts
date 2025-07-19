import { useQuery } from '@tanstack/react-query';
import { useChromiaAccount } from '../../configs/chromia-hooks';
import { normalizeBN, valueToBigNumber } from '@/utils/bignumber';

// Define asset price interface
export interface IMaxBorrow {
  user_id: Buffer<ArrayBufferLike>;
  asset_id: Buffer<ArrayBufferLike>;
  decimals: number;
}

type queryMaxType =
  | 'get_max_withdraw_amount'
  | 'get_max_borrow_amount'
  | 'get_max_repay_amount'
  | 'get_max_chr_withdraw_amount_query'
  | 'get_max_stchr_withdraw_amount_query';

/**
 * Hook to fetch the max withdraw/repay/repay amount for a specific user
 * @param userId The user ID (Buffer or string)
 * @param assetId The asset ID (Buffer or string)
 * @param decimals The asset decimals (to format request)
 * @returns Query result with data (number, human units), isLoading, error, and refetch function
 */
export function useMaxAmount(
  assetId: Buffer<ArrayBufferLike>,
  decimals: number,
  queryKey: queryMaxType
) {
  const { client, account } = useChromiaAccount();

  const query = useQuery({
    queryKey: [queryKey, account?.id, assetId.toString('hex'), decimals],
    queryFn: async () => {
      if (!client || !account?.id || !assetId) {
        throw new Error('Missing client or user/asset ID');
      }

      console.log('account', account?.id.toString('hex'));
      console.log('assetId', assetId.toString('hex'));
      console.log('decimals', decimals);
      console.log('queryKey', queryKey);

      // Call Chromia contract for max borrow amount (returns big integer string)
      const maxBorrowRaw = (await client.query(queryKey, {
        user_id: account?.id,
        asset_id: assetId,
      })) as unknown as bigint;
      // Convert to human readable number
      return normalizeBN(valueToBigNumber(maxBorrowRaw.toString()), decimals);
    },
    enabled: !!client && !!account?.id && !!assetId,
    retry: 2,
  });

  return {
    data: Number(query.data) || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
