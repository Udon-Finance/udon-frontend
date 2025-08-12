import { op } from '@chromia/ft4';
import { admin_kp } from '../../configs/key-pair';
import { getClient } from '../../clients';
import chalk from 'chalk';
import { TOKENS_MAINNET } from '../../configs/tokens';
import { getSessionOrRegister } from '../../helpers';

async function setReserveFactor() {
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

      console.log(chalk.blue(`🔄 Setting reserve factor for ${token.symbol}...`));
      await adminSession.call(op('set_reserve_factor_op', underlyingAssetId, 6000)); // reserve factor = 10% -> Earn 10% of the interest borrower pays
      console.log(chalk.green(`✅ Reserve factor set for ${token.symbol}`));
    }
  } catch (error) {
    console.error(chalk.bold.red('❌❌❌ ERROR IN SET FEE ❌❌❌'));
    console.error(chalk.red(error));
  }
}

// Execute the script
setReserveFactor().catch(error => console.error(chalk.red('Unhandled error:'), error));
