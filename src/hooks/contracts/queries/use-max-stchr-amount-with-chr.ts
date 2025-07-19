import { useQuery } from '@tanstack/react-query';
import { useChromiaAccount } from '../../configs/chromia-hooks';
import { normalizeBN, valueToBigNumber } from '@/utils/bignumber';
import { createAmount } from '@chromia/ft4';

/**
 * Hook to fetch the max stCHR withdraw amount based on a known CHR amount
 * @param assetId The asset ID (Buffer)
 * @param decimals The asset decimals
 * @param chrAmount The CHR amount to base the calculation on
 * @param enabled Whether the query should be enabled
 * @returns Query result with data (number, human units), isLoading, error, and refetch function
 */
export function useMaxStchrAmountWithChr(
  assetId: Buffer<ArrayBufferLike>,
  decimals: number,
  chrAmount: number,
  enabled: boolean = true
) {
  const { client, account } = useChromiaAccount();

  const query = useQuery({
    queryKey: [
      'get_max_stchr_withdraw_amount_with_chr_known_query',
      account?.id,
      assetId,
      decimals,
      chrAmount,
    ],
    queryFn: async () => {
      console.log('useMaxStchrAmountWithChr - queryFn called with:', {
        chrAmount,
        enabled,
        accountId: account?.id?.toString('hex'),
        assetId: assetId.toString('hex'),
      });
      if (!client || !account?.id || !assetId || chrAmount <= 0) {
        throw new Error('Missing client, user/asset ID, or invalid CHR amount');
      }

      // Call Chromia contract for max stCHR amount (returns big integer string)
      const maxStchrRaw = (await client.query(
        'get_max_stchr_withdraw_amount_with_chr_known_query',
        {
          user_id: account?.id,
          asset_id: assetId,
          chr_amount: createAmount(chrAmount, decimals).value,
        }
      )) as unknown as bigint;

      console.log('maxStchrRaw', maxStchrRaw);

      // Convert to human readable number
      const result = normalizeBN(valueToBigNumber(maxStchrRaw.toString()), decimals);
      console.log('useMaxStchrAmountWithChr - result:', result);
      return result;
    },
    enabled: !!client && !!account?.id && !!assetId && chrAmount > 0 && enabled,
    retry: 2,
  });

  return {
    data: Number(query.data) || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
