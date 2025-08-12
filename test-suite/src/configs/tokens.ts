import { ensureBuffer } from '../helpers/buffer';
import { parseUnits } from 'ethers/lib/utils';

// hippo: A8A05014A795D77C4FA12FDF08776FD70799549530F27ABB3B3331FB4D0A2AC8
// nathan: 5D3D574FA59149FE64E7495907FA047A2AC80EA0524D66373D12770104A0B0FA

// Define constants for minting
// Users can modify these values before running the script
export const ASSET_CONFIG = {
  // The amount to mint in whole tokens (will be converted to RAY)
  MINT_AMOUNT: '1000',
  // Target user ID.
  // Edit target user id to mint
  TARGET_USER_ID: ensureBuffer('5D3D574FA59149FE64E7495907FA047A2AC80EA0524D66373D12770104A0B0FA'),
};

// Token definitions
export const TOKENS = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/1.png',
    price: parseUnits('60000', 18).toString(),
    storkAssetId: 'BTCUSD',
  },
  {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/1027.png',
    price: parseUnits('2500', 18).toString(),
    storkAssetId: 'ETHUSD',
  },
  {
    name: 'MyNeighborAlice',
    symbol: 'ALICE',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/8766.png',
    price: parseUnits('0.49', 18).toString(),
    storkAssetId: 'ALICEUSD',
  },
  {
    name: 'DAR Open Network',
    symbol: 'D',
    decimals: 18,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/11374.png',
    price: parseUnits('0.45', 18).toString(),
    storkAssetId: 'DUSD',
  },
  {
    name: 'Chromia',
    symbol: 'CHR',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
    price: parseUnits('0.22', 18).toString(),
    storkAssetId: 'CHRUSD',
  },

  // {
  //   name: 'Staked Chromia',
  //   symbol: 'sttCHR',
  //   decimals: 6,
  //   icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
  //   price: parseUnits('0.22', 18).toString(),
  //   storkAssetId: 'CHRUSD',
  // },
  // {
  //   name: 'Chromia Test',
  //   symbol: 'tCHR',
  //   decimals: 6,
  //   icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
  //   price: parseUnits('0.22', 18).toString(),
  //   storkAssetId: 'CHRUSD',
  // },
  {
    name: 'USDT',
    symbol: 'USDT',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/825.png',
    price: parseUnits('1', 18).toString(),
    storkAssetId: 'USDTUSD',
  },
  {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png',
    price: parseUnits('1', 18).toString(),
    storkAssetId: 'USDCUSD',
  },
];

export const TOKENS_TESTNET = [
  {
    name: 'ALICE',
    symbol: 'ALICE',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/8766.png',
    price: parseUnits('0.49', 18).toString(),
    brid: '8035EBF322D0057B00E1D596431A78D535DB45035FAF2045B76942034C0FC507',
    storkAssetId: 'ALICEUSD',
    ltv: 6500,
    liquidation_threshold: 7500,
    liquidation_bonus: 11000,
  },
  {
    name: 'DAR Open Network',
    symbol: 'tD',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/11374.png',
    price: parseUnits('0.45', 18).toString(),
    brid: '8035EBF322D0057B00E1D596431A78D535DB45035FAF2045B76942034C0FC507',
    storkAssetId: 'DUSD',
    ltv: 6500,
    liquidation_threshold: 7500,
    liquidation_bonus: 11000,
  },
  {
    name: 'Chromia',
    symbol: 'tCHR',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
    price: parseUnits('0.22', 18).toString(),
    brid: '15C0CA99BEE60A3B23829968771C50E491BD00D2E3AE448580CD48A8D71E7BBA',
    storkAssetId: 'CHRUSD',
    ltv: 7000,
    liquidation_threshold: 8000,
    liquidation_bonus: 10500,
  },
  {
    name: 'Staked Chromia',
    symbol: 'sttCHR',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
    price: parseUnits('0.22', 18).toString(),
    storkAssetId: 'CHRUSD',
    ltv: 7000,
    liquidation_threshold: 8000,
    liquidation_bonus: 10500,
  },
];

// export const TOKENS_TCHR = {
//   name: 'Chromia Test',
//   symbol: 'tCHR',
//   decimals: 6,
//   icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
//   price: parseUnits('0.22', 18).toString(),
//   storkAssetId: 'CHRUSD',
// };

export const TOKENS_MAINNET = [
  {
    name: 'ALICE',
    symbol: 'ALICE',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/8766.png',
    price: parseUnits('0.49', 18).toString(),
    brid: '8035EBF322D0057B00E1D596431A78D535DB45035FAF2045B76942034C0FC507',
    storkAssetId: 'ALICEUSD',
    ltv: 6500,
    liquidation_threshold: 7500,
    liquidation_bonus: 11000,
  },
  {
    name: 'DAR Open Network',
    symbol: 'D',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/11374.png',
    price: parseUnits('0.45', 18).toString(),
    brid: '8035EBF322D0057B00E1D596431A78D535DB45035FAF2045B76942034C0FC507',
    storkAssetId: 'DUSD',
    ltv: 6500,
    liquidation_threshold: 7500,
    liquidation_bonus: 11000,
  },
  {
    name: 'Chromia',
    symbol: 'CHR',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
    price: parseUnits('0.22', 18).toString(),
    brid: '15C0CA99BEE60A3B23829968771C50E491BD00D2E3AE448580CD48A8D71E7BBA',
    storkAssetId: 'CHRUSD',
    ltv: 7000,
    liquidation_threshold: 8000,
    liquidation_bonus: 10500,
  },
];
