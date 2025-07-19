import { op } from '@chromia/ft4';
import { admin_kp } from '../configs/key-pair';
import { getClient } from '../clients';
import chalk from 'chalk';
import { getSessionOrRegister } from '../helpers';
import { ensureBuffer } from '../helpers/buffer';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { TOKENS, TOKENS_TCHR } from '../configs/tokens';

// hippo: A8A05014A795D77C4FA12FDF08776FD70799549530F27ABB3B3331FB4D0A2AC8
// nathan: 5D3D574FA59149FE64E7495907FA047A2AC80EA0524D66373D12770104A0B0FA

// Define constants for minting
// Users can modify these values before running the script
const ASSET_CONFIG = {
  // The amount to mint in whole tokens (will be converted to RAY)
  MINT_AMOUNT: 1000,
  // Target user ID
  TARGET_USER_ID: ensureBuffer('0911E88944035F70C311B0BFE02655ED29418A56AFFD6A5FF919FE9B868E33FF'),
};

async function mintAsset() {
  try {
    console.log(chalk.bold.cyan(`=== Starting Asset Minting Process for All Tokens ===`));
    const client = await getClient();
    const adminSession = await getSessionOrRegister(client, admin_kp);

    // Loop through all tokens and perform mint operations
    for (const token of TOKENS) {
      const mintAmount = parseUnits(ASSET_CONFIG.MINT_AMOUNT.toString(), token.decimals);
      console.log(chalk.bold.yellow(`\nProcessing ${token.symbol}...`));

      // Get asset ID
      console.log(chalk.blue(`🔍 Getting asset ID for ${token.symbol}...`));
      const underlyingAssetResult = await adminSession.getAssetsBySymbol(token.symbol);
      const underlyingAssetId = underlyingAssetResult.data[0]?.id;

      if (!underlyingAssetId) {
        console.log(chalk.red(`❌ Asset ${token.symbol} not found. Skipping...`));
        continue;
      }

      console.log(chalk.green(`✅ Found asset ID for ${token.symbol}: ${underlyingAssetId}`));

      // Mint tokens
      console.log(
        chalk.blue(
          `🔄 Minting ${ASSET_CONFIG.MINT_AMOUNT} ${token.symbol} to ${ASSET_CONFIG.TARGET_USER_ID.toString('hex')}...`
        )
      );

      await adminSession.call(
        op(
          'mint_underlying_asset',
          ASSET_CONFIG.TARGET_USER_ID,
          BigInt(mintAmount.toString()),
          underlyingAssetId
        )
      );

      console.log(
        chalk.green(
          `✅ Minted ${chalk.yellow(formatUnits(mintAmount.toString(), token.decimals))} ${token.symbol} tokens to ${ASSET_CONFIG.TARGET_USER_ID.toString('hex')}`
        )
      );

      // Enable collateral
      console.log(chalk.blue('🔄 Enabling collateral...'));

      await adminSession.call(
        op(
          'set_using_as_collateral_op',
          ASSET_CONFIG.TARGET_USER_ID,
          underlyingAssetId,
          true // enable collateral
        )
      );

      console.log(chalk.green(`✅ Collateral enabled for ${token.symbol}`));
    }

    console.log(
      chalk.bold.green('\n✅✅✅ Asset minting completed successfully for all tokens ✅✅✅')
    );

    const underlyingAssetResult = await adminSession.getAssetsBySymbol(TOKENS_TCHR.symbol);
    const underlyingAssetId = underlyingAssetResult.data[0]?.id;
    await adminSession.call(
      op(
        'set_using_as_collateral_op',
        ASSET_CONFIG.TARGET_USER_ID,
        underlyingAssetId,
        true // enable collateral
      )
    );
    console.log(chalk.green(`✅ Collateral enabled for ${TOKENS_TCHR.symbol}`));
  } catch (error) {
    console.error(chalk.bold.red('❌❌❌ ERROR IN MINT ASSET ❌❌❌'));
    console.error(chalk.red(error));
  }
}

// Execute the script
mintAsset().catch(error => console.error(chalk.red('Unhandled error:'), error));
