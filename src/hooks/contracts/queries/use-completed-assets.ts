import { useCallback, useEffect, useMemo, useState } from 'react';
import { useChromiaAccount } from '@/hooks/configs/chromia-hooks';
import { toast } from 'sonner';
import { formatRay } from '@/utils/wadraymath';
import { keysToCamelCase } from '@/utils/object';
import { AssetPrice, UserReserveData } from '@/app/(protected)/dashboard/types';
import { calculateCompoundedRate } from '@/utils/math/compounded-interest';
import { SECONDS_PER_YEAR } from '@/utils/constants';
import { normalizeBN } from '@/utils/bignumber';

/**
 * Custom hook to fetch complete asset data for a user using get_all_fields_user_reserve_data
 */
export function useCompletedAssets() {
  const { client, account } = useChromiaAccount();
  const [userReserves, setUserReserves] = useState<UserReserveData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserReserves = useCallback(async () => {
    if (!client || !account) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch all user reserve data
      const result = await client.query('get_all_fields_user_reserve_data', {
        user_id: account.id,
      });
      // convert key in object to camelCase
      let reserves = (Array.isArray(result) ? result : []).map(r => keysToCamelCase(r));
      console.log('reserves', reserves);

      // 2. Fetch prices

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const assetIds: any = [];
      reserves.map(r => assetIds.push(r.assetId));

      console.log('assetIds', Buffer.from(assetIds[0], 'hex'));
      const pricesResult = (await client.query('get_latest_price_by_asset_ids', {
        asset_ids: assetIds,
      })) as unknown as AssetPrice[];
      console.log('pricesResult', pricesResult);

      // 3. Map price to each reserve
      const prices: AssetPrice[] = Array.isArray(pricesResult) ? pricesResult : [];
      console.log('prices', prices);

      // 4. get get_lsd_asset to know if the asset is lsd
      // const lsdRawAssets = (await client.query(
      //   'get_lsd_asset',
      //   {}
      // )) as unknown as Buffer<ArrayBufferLike>[];

      // const lsdAssets = lsdRawAssets.map(a => a.toString('hex'));

      // console.log('lsdAssets', lsdAssets);

      // Format Ray for all big number fields and convert to number
      /* eslint-disable @typescript-eslint/no-explicit-any */
      reserves = reserves.map((r: any) => {
        const priceObj = prices.find(p => p.asset_symbol === r.symbol);
        console.log(
          'symbol, reserveCurrentLiquidityRate, reserveCurrentVariableBorrowRate',
          r.symbol,
          r.reserveCurrentLiquidityRate,
          r.reserveCurrentVariableBorrowRate
        );
        return {
          // asset
          ...r,
          // isLsd: lsdAssets.includes(r.assetId.toString('hex')),
          // replace USD with empty string at end of string
          symbol: r.symbol.replace(/USD$/, ''),
          assetId: Buffer.from(r.assetId, 'hex'),
          // reserve
          totalSupply: Number(normalizeBN(r.totalSupply.toString(), r.decimals)),
          balance: Number(normalizeBN(r.balance.toString(), r.decimals)),
          reserveUnbacked: Number(normalizeBN(r.reserveUnbacked.toString(), r.decimals)),
          reserveAccruedToTreasury: Number(
            normalizeBN(r.reserveAccruedToTreasury.toString(), r.decimals)
          ),
          currentATokenBalance: Number(normalizeBN(r.currentATokenBalance.toString(), r.decimals)),
          currentATokenTotalSupply: Number(
            normalizeBN(r.currentATokenTotalSupply.toString(), r.decimals)
          ),
          currentVariableDebt: Number(normalizeBN(r.currentVariableDebt.toString(), r.decimals)),
          currentVariableDebtTokenTotalSupply: Number(
            normalizeBN(r.currentVariableDebtTokenTotalSupply.toString(), r.decimals)
          ),
          reserveCurrentLiquidityRate: Number(formatRay(r.reserveCurrentLiquidityRate)),
          reserveCurrentVariableBorrowRate: Number(formatRay(r.reserveCurrentVariableBorrowRate)),
          reserveLiquidityIndex: Number(formatRay(r.reserveLiquidityIndex)),
          reserveVariableBorrowIndex: Number(formatRay(r.reserveVariableBorrowIndex)),
          reserveLastUpdateTimestamp: Number(r.reserveLastUpdateTimestamp),
          usageAsCollateralEnabled: !!r.usageAsCollateralEnabled,
          price: Number(priceObj?.price),
          supplyCap: Number(normalizeBN(r.supplyCap.toString(), r.decimals)),
          borrowCap: Number(normalizeBN(r.borrowCap.toString(), r.decimals)),
          ltv: Number(r.ltv) / 100,
          availableLiquidity: Number(normalizeBN(r.availableLiquidity.toString(), r.decimals)),

          supplyAPY: Number(
            normalizeBN(
              calculateCompoundedRate({
                rate: r.reserveCurrentLiquidityRate,
                duration: SECONDS_PER_YEAR,
              }),
              27
            ).multipliedBy(100)
          ),
          liquidationThreshold: Number(r.liquidationThreshold) / 100,
          borrowAPY: Number(
            normalizeBN(
              calculateCompoundedRate({
                rate: r.reserveCurrentVariableBorrowRate,
                duration: SECONDS_PER_YEAR,
              }),
              27
            ).multipliedBy(100)
          ),
        };
      });

      console.log('process fields:', reserves);

      setUserReserves(reserves);
    } catch (err) {
      const typedError = err instanceof Error ? err : new Error('Unknown error');
      setError(typedError);
      toast.error('Failed to load your positions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [client, account]);

  useEffect(() => {
    fetchUserReserves();
  }, [fetchUserReserves]);

  // For compatibility with old API, split supply/borrow positions
  const supplyPositions = useMemo(
    // filter if currentATokenBalance > 0 and symbol is sttCHR we replace with tCHR
    () => {
      const filteredReserves = userReserves.filter(r => r.currentATokenBalance > 0);
      return filteredReserves.map(r => {
        if (r.symbol === 'sttCHR') {
          const tCHR = userReserves.find(r => r.symbol === 'tCHR');
          return {
            ...r,
            symbol: 'tCHR',
            assetId: tCHR?.assetId,
            name: tCHR?.name,
            decimals: tCHR?.decimals,
            iconUrl: tCHR?.iconUrl,
            type: tCHR?.type,
          };
        }
        return r;
      });
    },
    [userReserves]
  );

  const supplyReserves = useMemo(() => {
    return userReserves.filter(r => r.symbol !== 'sttCHR'); // because sttCHR is not supplyable
  }, [userReserves]);

  const borrowReserves = useMemo(() => {
    return userReserves.filter(r => r.symbol !== 'tCHR'); // because tCHR is not borrowable
  }, [userReserves]);

  const borrowPositions = useMemo(
    () => userReserves.filter(r => r.currentVariableDebt > 0),
    [userReserves]
  );

  const yourSupplyBalancePosition = useMemo(() => {
    return userReserves.reduce((sum, r) => sum + r.currentATokenBalance * r.price, 0);
  }, [userReserves]);

  const yourSupplyCollateralPosition = useMemo(() => {
    return userReserves.reduce(
      (sum, r) => sum + (r.usageAsCollateralEnabled ? r.currentATokenBalance * r.price : 0),
      0
    );
  }, [userReserves]);

  const yourSupplyAPYPosition = useMemo(() => {
    if (!userReserves.length) return 0;
    const total = userReserves.reduce((sum, r) => sum + (r.supplyAPY || 0), 0);
    return total / userReserves.length;
  }, [userReserves]);

  const yourBorrowBalancePosition = useMemo(() => {
    return userReserves.reduce((sum, r) => sum + r.currentVariableDebt * r.price, 0);
  }, [userReserves]);

  const yourBorrowAPYPosition = useMemo(() => {
    if (!userReserves.length) return 0;
    const total = userReserves.reduce((sum, r) => sum + (r.borrowAPY || 0), 0);
    return total / userReserves.length;
  }, [userReserves]);

  const yourBorrowPowerUsagePosition = useMemo(() => {
    return userReserves.reduce((sum, r) => {
      // Prevent division by zero
      if (r.currentVariableDebt === 0) return sum;
      return sum + r.currentVariableDebtTokenTotalSupply / r.currentVariableDebt;
    }, 0);
  }, [userReserves]);

  // formula net worth: netWorthUSD = totalLiquidityUSD - totalBorrowsUSD
  const yourNetWorthPosition = useMemo(() => {
    return yourSupplyBalancePosition - yourBorrowBalancePosition;
  }, [yourSupplyBalancePosition, yourBorrowBalancePosition]);

  // formula net apy: netAPY = (earnedAPY * (totalLiquidityUSD / netWorthUSD)) - (debtAPY * (totalBorrowsUSD / netWorthUSD))
  const yourNetAPYPosition = useMemo(() => {
    // Handle case with no net worth to avoid division by zero
    if (yourNetWorthPosition <= 0) return 0;

    const totalLiquidityUSD = yourSupplyBalancePosition;
    console.log('totalLiquidityUSD', totalLiquidityUSD);
    const totalBorrowsUSD = yourBorrowBalancePosition;
    console.log('totalBorrowsUSD', totalBorrowsUSD);

    // Calculate positive proportion (earnings from supply positions and borrow incentives)
    // For now we only have supplyAPY, but this can be extended to include incentives later
    const positiveProportion = userReserves.reduce((sum, reserve) => {
      // Add earnings from supply positions
      const supplyEarnings =
        reserve.currentATokenBalance * reserve.price * (reserve.supplyAPY / 100);

      // In the future, add supply incentives and borrow incentives here
      // const supplyIncentives = reserve.currentATokenBalance * reserve.price * (reserve.supplyIncentivesAPY / 100);
      // const borrowIncentives = reserve.currentVariableDebt * reserve.price * (reserve.borrowIncentivesAPY / 100);

      return sum + supplyEarnings; // + supplyIncentives + borrowIncentives;
    }, 0);
    console.log('positiveProportion', positiveProportion);

    // Calculate negative proportion (costs from borrow positions)
    const negativeProportion = userReserves.reduce((sum, reserve) => {
      // Add costs from borrow positions
      const borrowCosts = reserve.currentVariableDebt * reserve.price * (reserve.borrowAPY / 100);

      return sum + borrowCosts;
    }, 0);
    console.log('negativeProportion', negativeProportion);
    // Calculate earned APY and debt APY
    const earnedAPY = totalLiquidityUSD > 0 ? (positiveProportion / totalLiquidityUSD) * 100 : 0;
    console.log('earnedAPY', earnedAPY);
    const debtAPY = totalBorrowsUSD > 0 ? (negativeProportion / totalBorrowsUSD) * 100 : 0;
    console.log('debtAPY', debtAPY);

    // Calculate net APY using the formula
    const netAPY =
      earnedAPY * (totalLiquidityUSD / yourNetWorthPosition) -
      debtAPY * (totalBorrowsUSD / yourNetWorthPosition);
    console.log('netAPY', netAPY);
    return netAPY;
  }, [userReserves, yourSupplyBalancePosition, yourBorrowBalancePosition, yourNetWorthPosition]);

  const enableBorrow = useMemo(() => {
    const enable = !!userReserves.some(
      r => r.currentATokenBalance > 0 && r.usageAsCollateralEnabled
    );
    console.log('enableBorrow', enable);
    return enable;
  }, [userReserves]);

  return {
    assets: userReserves,
    supplyPositions: supplyPositions as UserReserveData[],
    borrowPositions: borrowPositions as UserReserveData[],
    supplyReserves,
    borrowReserves,
    yourSupplyBalancePosition,
    yourSupplyCollateralPosition,
    yourSupplyAPYPosition,
    yourBorrowBalancePosition,
    yourBorrowAPYPosition,
    yourBorrowPowerUsagePosition,
    yourNetAPYPosition,
    yourNetWorthPosition,
    enableBorrow,
    isLoading,
    error,
    refresh: fetchUserReserves,
  };
}
