import { useChromiaAccount } from '@/hooks/configs/chromia-hooks';
import { formatRay } from '@/utils/wadraymath';
import { keysToCamelCase } from '@/utils/object';
import { calculateCompoundedRate } from '@/utils/math/compounded-interest';
import { SECONDS_PER_YEAR } from '@/utils/constants';
import { normalizeBN } from '@/utils/bignumber';
import { useQuery } from '@tanstack/react-query';

export function useReserveData(assetId: string) {
  const { client, account } = useChromiaAccount();

  const query = useQuery({
    queryKey: ['reserve_data', account?.id, assetId],
    queryFn: async () => {
      if (!client || !account) return;

      // 1. Fetch all user reserve data
      const result = await client.query('get_user_reserve_data_by_reserve_id', {
        user_id: account.id,
        reserve_id: Buffer.from(assetId, 'hex'),
      });
      if (!result) return null;
      // convert key in object to camelCase
      let reserves = keysToCamelCase(result);

      const pricesResult = await client.query('get_latest_price_by_asset_id', {
        asset_id: Buffer.from(assetId, 'hex'),
      });

      console.log('pricesResult in reserve data', pricesResult);

      // 2. Format Ray for all big number fields and convert to number
      reserves = {
        ...reserves,
        // replace USD with empty string at end of string
        symbol: reserves.symbol.replace(/USD$/, ''),
        assetId: Buffer.from(reserves.assetId, 'hex'),
        // reserve
        totalSupply: Number(normalizeBN(reserves.totalSupply.toString(), reserves.decimals)),
        balance: Number(normalizeBN(reserves.balance.toString(), reserves.decimals)),
        reserveUnbacked: Number(
          normalizeBN(reserves.reserveUnbacked.toString(), reserves.decimals)
        ),
        reserveAccruedToTreasury: Number(
          normalizeBN(reserves.reserveAccruedToTreasury.toString(), reserves.decimals)
        ),
        currentATokenBalance: Number(
          normalizeBN(reserves.currentATokenBalance.toString(), reserves.decimals)
        ),
        currentATokenTotalSupply: Number(
          normalizeBN(reserves.currentATokenTotalSupply.toString(), reserves.decimals)
        ),
        currentVariableDebt: Number(
          normalizeBN(reserves.currentVariableDebt.toString(), reserves.decimals)
        ),
        currentVariableDebtTokenTotalSupply: Number(
          normalizeBN(reserves.currentVariableDebtTokenTotalSupply.toString(), reserves.decimals)
        ),
        reserveCurrentLiquidityRate: Number(formatRay(reserves.reserveCurrentLiquidityRate)),
        reserveCurrentVariableBorrowRate: Number(
          formatRay(reserves.reserveCurrentVariableBorrowRate)
        ),
        reserveLiquidityIndex: Number(formatRay(reserves.reserveLiquidityIndex)),
        reserveVariableBorrowIndex: Number(formatRay(reserves.reserveVariableBorrowIndex)),
        reserveLastUpdateTimestamp: Number(reserves.reserveLastUpdateTimestamp),
        usageAsCollateralEnabled: !!reserves.usageAsCollateralEnabled,
        price: Number(pricesResult),
        supplyCap: Number(normalizeBN(reserves.supplyCap.toString(), reserves.decimals)),
        borrowCap: Number(normalizeBN(reserves.borrowCap.toString(), reserves.decimals)),
        ltv: Number(reserves.ltv) / 100,
        availableLiquidity: Number(
          normalizeBN(reserves.availableLiquidity.toString(), reserves.decimals)
        ),

        supplyAPY: Number(
          normalizeBN(
            calculateCompoundedRate({
              rate: reserves.reserveCurrentLiquidityRate,
              duration: SECONDS_PER_YEAR,
            }),
            27
          ).multipliedBy(100)
        ),
        liquidationThreshold: Number(reserves.liquidationThreshold) / 100,
        borrowAPY: Number(
          normalizeBN(
            calculateCompoundedRate({
              rate: reserves.reserveCurrentVariableBorrowRate,
              duration: SECONDS_PER_YEAR,
            }),
            27
          ).multipliedBy(100)
        ),
      };
      console.log('reserves', reserves.assetId.toString('hex'));
      return reserves;
    },
    enabled: !!client && !!account?.id && !!assetId,
    retry: 2,
  });

  return {
    reserve: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
