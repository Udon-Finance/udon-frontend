import { createAmount, op } from '@chromia/ft4';
import { admin_kp } from '../../configs/key-pair';
import { getClient } from '../../clients';
import chalk from 'chalk';
import { TOKENS_MAINNET } from '../../configs/tokens';
import { getSessionOrRegister } from '../../helpers';

async function setFee() {
  try {
    console.log(chalk.bold.cyan('=== Starting Set Fee Process ==='));

    // Get client and setup sessions
    console.log(chalk.blue('🔄 Setting up client and sessions...'));
    const client = await getClient();
    const adminSession = await getSessionOrRegister(client, admin_kp);

    // Process each token
    for (const token of TOKENS_MAINNET) {
      console.log(chalk.blue(`🔄 Setting fee for ${token.symbol}...`));

      const underlyingAssetResult = await adminSession.getAssetsBySymbol(token.symbol);
      const underlyingAssetId = underlyingAssetResult.data[0].id;
      console.log(
        chalk.green(`✅ ${token.symbol} created:`),
        chalk.yellow(`(${underlyingAssetId})`)
      );

      await adminSession.call(
        op('set_fee_percentage', underlyingAssetId, createAmount(10, 0).value)
      );
      console.log(chalk.green(`✅ ${token.symbol} fee set to 0.1%`));
    }
  } catch (error) {
    console.error(chalk.bold.red('❌❌❌ ERROR IN SET FEE ❌❌❌'));
    console.error(chalk.red(error));
  }
}

// Execute the script
setFee().catch(error => console.error(chalk.red('Unhandled error:'), error));
