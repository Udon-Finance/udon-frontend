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
  // {
  //   name: 'Bitcoin',
  //   symbol: 'BTC',
  //   decimals: 8,
  //   icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/1.png',
  //   price: parseUnits('60000', 18).toString(),
  //   storkAssetId: 'BTCUSD',
  // },
  // {
  //   name: 'Ethereum',
  //   symbol: 'ETH',
  //   decimals: 18,
  //   icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/1027.png',
  //   price: parseUnits('2500', 18).toString(),
  //   storkAssetId: 'ETHUSD',
  // },
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
  // {
  //   name: 'Chromia',
  //   symbol: 'CHR',
  //   decimals: 6,
  //   icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
  //   price: parseUnits('0.22', 18).toString(),
  //   storkAssetId: 'CHRUSD',
  // },
  {
    name: 'Staked Chromia',
    symbol: 'sttCHR',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
    price: parseUnits('0.22', 18).toString(),
    storkAssetId: 'CHRUSD',
  },
  // {
  //   name: 'USDT',
  //   symbol: 'USDT',
  //   decimals: 6,
  //   icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/825.png',
  //   price: parseUnits('1', 18).toString(),
  //   storkAssetId: 'USDTUSD',
  // },
  // {
  //   name: 'USDC',
  //   symbol: 'USDC',
  //   decimals: 6,
  //   icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png',
  //   price: parseUnits('1', 18).toString(),
  //   storkAssetId: 'USDCUSD',
  // },
];

export const TOKENS_TCHR = {
  name: 'Chromia Test',
  symbol: 'tCHR',
  decimals: 6,
  icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3978.png',
  price: parseUnits('0.22', 18).toString(),
  storkAssetId: 'CHRUSD',
};
