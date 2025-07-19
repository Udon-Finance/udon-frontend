// // Define the common asset structure both components will use
// export interface CommonAsset extends Asset {
//   price?: number;
//   balance?: string;
//   balanceAmount?: bigint;
//   rawBalance?: {
//     amount: bigint;
//     asset: Asset;
//   };
//   canBeCollateral?: boolean;
//   supplyAPY?: number;
//   borrowAPY?: number;
//   icon_url?: string;
//   available?: string;
// }

export interface AssetPrice {
  stork_asset_id: string;
  price: number;
  timestamp: string;
  asset_symbol: string;
}

export interface UserReserveDataResponse {
  // Asset fields
  assetId: Buffer<ArrayBufferLike>;
  name: string;
  symbol: string;
  decimals: number;
  iconUrl: string;
  type: string;
  totalSupply: bigint;
  balance: bigint;

  // Reserve fields
  reserveUnbacked: bigint;
  reserveAccruedToTreasury: bigint;
  currentATokenBalance: bigint;
  currentATokenTotalSupply: bigint;
  currentVariableDebt: bigint;
  currentVariableDebtTokenTotalSupply: bigint;
  reserveCurrentLiquidityRate: bigint;
  reserveCurrentVariableBorrowRate: bigint;
  reserveLiquidityIndex: bigint;
  reserveVariableBorrowIndex: bigint;
  usageAsCollateralEnabled: 1 | 0;
  reserveLastUpdateTimestamp: bigint;

  supplyCap: bigint;
  borrowCap: bigint;
  ltv: bigint;

  liquidationThreshold: bigint;

  availableLiquidity: bigint;

  // userDataAccount: UserAccountDataResponse;
}

export interface UserReserveData {
  assetId: Buffer<ArrayBufferLike>;
  name: string;
  symbol: string;
  decimals: number;
  iconUrl: string;
  type: string;
  totalSupply: number;
  balance: number;
  // isLsd: boolean;
  // Reserve fields
  reserveUnbacked: number;
  reserveAccruedToTreasury: number;
  currentATokenBalance: number;
  currentATokenTotalSupply: number;
  currentVariableDebt: number;
  currentVariableDebtTokenTotalSupply: number;
  reserveCurrentLiquidityRate: number;
  reserveCurrentVariableBorrowRate: number;
  reserveLiquidityIndex: number;
  reserveVariableBorrowIndex: number;
  usageAsCollateralEnabled: boolean;
  reserveLastUpdateTimestamp: number;

  price: number;
  supplyAPY: number;
  borrowAPY: number;

  supplyCap: number;
  borrowCap: number;
  ltv: number;

  liquidationThreshold: number;

  availableLiquidity: number;

  // userDataAccount: UserAccountData;
}

export interface UserAccountDataResponse {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
}

export interface UserAccountData {
  totalCollateralBase: number;
  totalDebtBase: number;
  availableBorrowsBase: number;
  currentLiquidationThreshold: number;
  ltv: number;
  healthFactor: number;
  healthFactorFormatted: number;
}

export interface AvailableLiquidityToken {
  assetId: Buffer<ArrayBufferLike>;
  symbol: string;
  availableLiquidityToken: number;
}
