import { useQuery } from '@tanstack/react-query';
import { useChromiaAccount } from '../../configs/chromia-hooks';
import { ensureString } from '@/utils/string';

/**
 * Hook to fetch a single asset price from the Chromia blockchain using TanStack Query
 * @param assetId The asset ID to fetch the price for
 * @param enabled Whether to enable the query
 * @returns Query result with data, isLoading, error, and refetch function
 */
export function useAssetPrice(
  assetId: string | Buffer | number | Record<string, unknown>,
  enabled = true
) {
  const { client } = useChromiaAccount();

  const formattedAssetId = ensureString(assetId);

  // Use TanStack Query to fetch and cache price data
  const query = useQuery({
    queryKey: ['asset-price', formattedAssetId],
    queryFn: async () => {
      if (!client || !formattedAssetId) {
        console.log('Price fetch skipped:', {
          hasClient: !!client,
          hasAssetId: !!formattedAssetId,
        });
        throw new Error('Missing client or asset ID');
      }

      console.log('Fetching price for asset:', {
        originalAssetId: assetId,
        formattedAssetId,
        type: typeof assetId,
      });

      const price = (await client.query('get_latest_price_by_asset_id', {
        asset_id: formattedAssetId,
      })) as unknown as number;

      console.log('Received price data:', price);
      return price;
    },
    enabled: enabled && !!client && !!formattedAssetId,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 2, // Retry failed requests twice
    networkMode: 'offlineFirst', // priority cache first
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
