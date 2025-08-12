import { createInMemoryFtKeyStore } from '@chromia/ft4';

import { newSignatureProvider } from 'postchain-client';
import chalk from 'chalk';
import { admin_kp } from '../../configs/key-pair';
import { getClient } from '../../clients';
import { registerAssetWithValidation } from '../../helpers';

/**
 * Creates a key store from private and public key
 * @param privateKey Private key in hex format
 * @param publicKey Public key in hex format
 * @returns The created key store
 */
export function createKeyStore(privateKey: string, publicKey: string) {
  return createInMemoryFtKeyStore({
    privKey: Buffer.from(privateKey, 'hex'),
    pubKey: Buffer.from(publicKey, 'hex'),
  });
}
/**
 * Example of how to use the modular functions for a complete cross-chain transfer
 * This demonstrates the full flow using the reusable functions
 */
export async function runRegisterAssetTransferExample() {
  try {
    console.log(chalk.bold.cyan(`=== Starting Cross-Chain Transfer Example ===`));

    // Create admin signature provider for asset registration
    const adminSignatureProvider = newSignatureProvider(0, admin_kp);

    const udonClient = await getClient();

    // Register the asset on Udon chain
    await registerAssetWithValidation(
      '5F16D1545A0881F971B164F1601CBBF51C29EFD0633B2730DA18C403C3B428B5', // chr asset_id
      '15C0CA99BEE60A3B23829968771C50E491BD00D2E3AE448580CD48A8D71E7BBA', // eco id
      udonClient,
      adminSignatureProvider
    );

    // Register the asset on Udon chain
    await registerAssetWithValidation(
      '9084DE203EF2AFC7C6BFD647660AA3265D3B9EF1105139077ED3C81B26E2976E', // alice asset_id
      '8035EBF322D0057B00E1D596431A78D535DB45035FAF2045B76942034C0FC507', // token chain id
      udonClient,
      adminSignatureProvider
    );

    // Register the asset on Udon chain
    await registerAssetWithValidation(
      'D85153C53BC78C6BF177113C5DA873669F97BD46DB1AB7411E2F8932C7CDD0A8', // D asset_id
      '8035EBF322D0057B00E1D596431A78D535DB45035FAF2045B76942034C0FC507', // token chain id
      udonClient,
      adminSignatureProvider
    );

    console.log(
      chalk.bold.green(`\n✅✅✅ Cross-chain transfer example completed successfully ✅✅✅`)
    );
  } catch (error) {
    console.error(chalk.bold.red('❌❌❌ ERROR IN CROSS-CHAIN TRANSFER EXAMPLE ❌❌❌'));
    console.error(chalk.red(error));
    throw error;
  }
}

// When running this script directly, execute the example
if (require.main === module) {
  runRegisterAssetTransferExample()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(chalk.bold.red('❌ Unhandled error:'));
      console.error(chalk.red(error));
      process.exit(1);
    });
}
