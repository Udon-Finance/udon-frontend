import { useCallback, useEffect, useState } from 'react';
import { useChromiaAccount } from '@/hooks/configs/chromia-hooks';
import { toast } from 'sonner';
import { Asset, Balance } from '@chromia/ft4';

interface AssetPrice {
  stork_asset_id: string;
  price: number;
  timestamp: string;
  asset_symbol: string;
}

interface TokenPriceMap {
  [key: string]: number;
}

/**
 * Hook to fetch token prices for a list of assets or balances
 * @returns A map of token symbols to their prices and loading state
 */
export function useTokenPrices(tokens?: (Asset | Balance)[]) {
  const { client } = useChromiaAccount();
  const [prices, setPrices] = useState<TokenPriceMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!client || !tokens?.length) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('tokens', tokens);

      // Extract asset info from tokens (handle both Asset and Balance types)
      const assetIds = tokens.map(token => {
        // Check if it's a Balance type (which contains asset property)
        if ('asset' in token) {
          return (token as Balance).asset.id;
        }
        // It's an Asset type
        return (token as Asset).id;
      });

      // Query the blockchain for latest prices
      const pricesData = (await client.query('get_latest_price_by_asset_ids', {
        asset_ids: assetIds,
      })) as unknown as AssetPrice[];

      console.log('pricesData', pricesData);

      // Create a map of symbol -> price
      const priceMap: TokenPriceMap = {};
      pricesData.forEach(priceData => {
        priceMap[priceData.asset_symbol] = Number(priceData.price) || 0;
      });

      console.log('priceMap', priceMap);

      setPrices(priceMap);
    } catch (error) {
      const typedError = error instanceof Error ? error : new Error('Unknown error');
      console.error('Failed to fetch token prices:', typedError);
      setError(typedError);
      toast.error('Failed to load token prices');
    } finally {
      setIsLoading(false);
    }
  }, [client, tokens]);

  // Fetch prices on mount and when tokens change
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Function to get price for a specific token symbol
  const getPriceBySymbol = useCallback(
    (symbol: string): number | undefined => {
      return prices[symbol];
    },
    [prices]
  );

  return {
    prices,
    getPriceBySymbol,
    isLoading,
    error,
    refetch: fetchPrices,
  };
}
