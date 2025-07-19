import { createAmount, op } from '@chromia/ft4';
import { admin_kp } from '../configs/key-pair';
// import { registerAccountOpen } from '../common/operations/accounts';
import { getClient } from '../clients';
import chalk from 'chalk';
import { RAY } from '../helpers/wadraymath';
import { BigNumber } from 'ethers';
// import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { TOKENS } from '../configs/tokens';
import { getSessionOrRegister } from '../helpers';

async function initSupply() {
  try {
    console.log(chalk.bold.cyan('=== Starting Supply Initialization Process ==='));

    // Get client and setup sessions
    console.log(chalk.blue('🔄 Setting up client and sessions...'));
    const client = await getClient();
    const adminSession = await getSessionOrRegister(client, admin_kp);
    const adminAccountId = adminSession.account.id;

    // const userSession = await getSessionOrRegister(client, user_a_kp);
    // const userAccountId = userSession.account.id;

    console.log(chalk.green('✅ Sessions created successfully'));

    console.log('adminSession', adminSession);

    // Initialize ACL module
    console.log(chalk.blue('🔄 Initializing ACL module...'));
    await adminSession.call(op('initialize', admin_kp.pubKey));
    await adminSession.call(op('grant_role', 'POOL_ADMIN', adminAccountId, admin_kp.pubKey));
    console.log(chalk.green('✅ ACL module initialized'));

    // Initialize required factories
    console.log(chalk.blue('🔄 Initializing asset factories...'));
    await adminSession.call(op('initialize_asset_base'));
    await adminSession.call(op('initialize_underlying_asset_factory'));
    await adminSession.call(op('initialize_a_asset_factory'));
    await adminSession.call(op('initialize_variable_debt_asset_factory'));
    await adminSession.call(op('initialize_emode_logic'));
    console.log(chalk.green('✅ Asset factories initialized'));

    // Create fee manager
    await adminSession.call(op('create_fee_collector_account_op'));
    console.log(chalk.green('✅ Fee collector account created:'));

    // Set interest rate strategy parameters (will be used for all tokens)
    const interestRateParams = {
      optimalUsageRatio: BigNumber.from(RAY).mul(80).div(100), // 0.8 in RAY
      baseVariableBorrowRate: BigNumber.from(RAY).mul(5).div(100), // 0.05 in RAY
      variableRateSlope1: BigNumber.from(RAY).mul(4).div(100), // 0.04 in RAY
      variableRateSlope2: BigNumber.from(RAY).mul(60).div(100), // 0.6 in RAY
    };

    // Create all tokens and their A-tokens
    console.log(chalk.blue('🔄 Creating tokens and initializing reserves...'));

    const createdTokens = [];

    // Process each token
    for (const token of TOKENS) {
      console.log(chalk.blue(`🔄 Creating ${token.symbol}...`));

      // Create underlying asset
      await adminSession.call(
        op('create_underlying_asset', token.name, token.symbol, token.decimals, token.icon)
      );

      const underlyingAssetResult = await adminSession.getAssetsBySymbol(token.symbol);
      const underlyingAssetId = underlyingAssetResult.data[0].id;
      console.log(
        chalk.green(`✅ ${token.symbol} created:`),
        chalk.yellow(`(${underlyingAssetId})`)
      );

      // Create price asset
      await adminSession.call(
        op('create_price_asset', admin_kp.pubKey, token.storkAssetId, underlyingAssetId)
      );
      console.log(chalk.green('✅ Price asset oracle created:'));

      // TODO: Uncomment this when we have a price asset oracle
      // update price asset
      await adminSession.call(
        op('update_price_update_op', token.storkAssetId, underlyingAssetId, BigInt(token.price))
      );
      console.log(chalk.green('✅ Price asset updated:'));

      // Create fee manager
      await adminSession.call(
        op('set_fee_percentage_op', underlyingAssetId, createAmount(100, 0).value)
      );
      console.log(chalk.green('✅ Fee manager created:'));

      // Set interest rate strategy
      await adminSession.call(
        op(
          'set_default_reserve_interest_rate_strategy',
          underlyingAssetId,
          BigInt(interestRateParams.optimalUsageRatio.toString()),
          BigInt(interestRateParams.baseVariableBorrowRate.toString()),
          BigInt(interestRateParams.variableRateSlope1.toString()),
          BigInt(interestRateParams.variableRateSlope2.toString())
        )
      );
      console.log(chalk.green(`✅ Interest rate strategy set for ${token.symbol}`));

      // Configure reserve with a-asset
      const aAsset = {
        name: `a${token.name}`,
        symbol: `a${token.symbol}`,
        decimals: token.decimals,
      };

      const vAsset = {
        name: `v${token.name}`,
        symbol: `v${token.symbol}`,
        decimals: token.decimals,
      };

      console.log('aAsset', aAsset);
      console.log('vAsset', vAsset);
      await adminSession.call(
        op(
          'init_reserve_op',
          underlyingAssetId,
          adminAccountId,
          aAsset.name,
          aAsset.symbol,
          vAsset.name,
          vAsset.symbol
        )
      );

      const aAssetResult = await adminSession.getAssetsBySymbol(aAsset.symbol);
      const aAssetId = aAssetResult.data[0].id;
      console.log(
        chalk.green(`✅ Reserve initialized with a-asset:`),
        chalk.yellow(`${aAsset.symbol} (${aAssetId})`)
      );

      // Set field for reserve_configuration
      await adminSession.call(
        op(
          'configure_reserve_as_collateral',
          underlyingAssetId,
          7000, // ltv = 70%
          8000, // liquidation threshold = 80%
          10500 // liquidation bonus = 5%
        )
      );

      console.log(chalk.green(`✅ Set field for reserve_configuration`));

      // set debt ceiling = 0
      await adminSession.call(op('set_debt_ceiling_op', underlyingAssetId, 0));
      console.log(chalk.green(`✅ Set field for debt_ceiling`));

      // no borrowing in isolation
      await adminSession.call(op('set_borrowable_in_isolation_op', underlyingAssetId, false));
      console.log(chalk.green(`✅ Set field for borrowing_in_isolation`));

      // no siloed borrowing
      await adminSession.call(op('set_siloed_borrowing_op', underlyingAssetId, false));
      console.log(chalk.green(`✅ Set field for set_siloed_borrowing_op`));

      // set_reserve_flash_loaning
      await adminSession.call(op('set_reserve_flash_loaning', underlyingAssetId, false));
      console.log(chalk.green(`✅ Set field for set_reserve_flash_loaning`));

      // set_reserve_borrowing. borrowing enabled
      await adminSession.call(op('set_reserve_borrowing', underlyingAssetId, true));
      console.log(chalk.green(`✅ Set field for set_reserve_borrowing`));

      // Mint underlying tokens to user
      // const mintAmount = parseUnits('1000', token.decimals); // 1000 * 10ˆdecimal
      // await adminSession.call(
      //   op('mint_underlying_asset', userAccountId, BigInt(mintAmount.toString()), underlyingAssetId)
      // );
      // console.log(
      //   chalk.green(
      //     `✅ Minted ${chalk.yellow(formatUnits(mintAmount, token.decimals))} ${token.symbol} tokens to user`
      //   )
      // );

      createdTokens.push({
        underlying: {
          id: underlyingAssetId,
          symbol: token.symbol,
        },
        aToken: {
          id: aAssetId,
          symbol: aAsset.symbol,
        },
      });
    }
  } catch (error) {
    console.error(chalk.bold.red('❌❌❌ ERROR IN INIT SUPPLY ❌❌❌'));
    console.error(chalk.red(error));
  }
}

// Execute the script
initSupply().catch(error => console.error(chalk.red('Unhandled error:'), error));
