import chalk from 'chalk';
import {
  Account,
  createAmount,
  createConnection,
  createInMemoryEvmKeyStore,
  createInMemoryFtKeyStore,
  createKeyStoreInteractor,
  createSingleSigAuthDescriptorRegistration,
  op,
  PaginatedEntity,
  registerAccount,
  registrationStrategy,
} from '@chromia/ft4';
import { createClient, IClient, KeyPair } from 'postchain-client';

async function registerAccountOpen(client: IClient, kp: KeyPair) {
  const store = createInMemoryFtKeyStore(kp);
  const connection = createConnection(client);
  const { session } = await registerAccount(
    connection.client,
    store,
    registrationStrategy.open(createSingleSigAuthDescriptorRegistration(['A', 'T'], store.id, null))
  );
  return session;
}

async function registerAccountOpenEVM(client: IClient, kp: { privKey: Buffer; pubKey: Buffer }) {
  const store = createInMemoryEvmKeyStore(kp);

  const { session } = await registerAccount(
    client,
    store,
    registrationStrategy.open(createSingleSigAuthDescriptorRegistration(['A', 'T'], store.id))
  );

  return session;
}

async function getSessionOrRegisterEVM(client: IClient, kp: KeyPair) {
  const resultGetAccountBySigner = (await client.query('ft4.get_accounts_by_signer', {
    id: kp.pubKey,
    page_size: null,
    page_cursor: null,
  })) as unknown as PaginatedEntity<Account>;

  console.log('resultGetAccountBySigner', resultGetAccountBySigner);

  // if the account is not registered, register it
  if (resultGetAccountBySigner?.data.length === 0) {
    console.log('registering account');
    return await registerAccountOpenEVM(client, kp);
  } else {
    const store = createInMemoryEvmKeyStore(kp);
    const { getSession } = createKeyStoreInteractor(client, store);
    console.log('getting session');
    return await getSession(resultGetAccountBySigner?.data[0]?.id);
  }
}

async function getSessionOrRegister(client: IClient, kp: KeyPair) {
  const resultGetAccountBySigner = (await client.query('ft4.get_accounts_by_signer', {
    id: kp.pubKey,
    page_size: null,
    page_cursor: null,
  })) as unknown as PaginatedEntity<Account>;

  console.log('resultGetAccountBySigner', resultGetAccountBySigner);

  // if the account is not registered, register it
  if (resultGetAccountBySigner?.data.length === 0) {
    console.log('registering account');
    return await registerAccountOpen(client, kp);
  } else {
    const store = createInMemoryFtKeyStore(kp);
    const { getSession } = createKeyStoreInteractor(client, store);
    console.log('getting session');
    return await getSession(resultGetAccountBySigner?.data[0]?.id);
  }
}

export const TOKENS_MAINNET = [
  {
    name: 'ALICE',
    symbol: 'ALICE',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/8766.png',
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
    brid: '15C0CA99BEE60A3B23829968771C50E491BD00D2E3AE448580CD48A8D71E7BBA',
    storkAssetId: 'CHRUSD',
    ltv: 7000,
    liquidation_threshold: 8000,
    liquidation_bonus: 10500,
  },
];

async function initSupply() {
  try {
    console.log(chalk.bold.cyan('=== Starting Supply Initialization Process ==='));

    // Get client and setup sessions
    console.log(chalk.blue('🔄 Setting up client and sessions...'));
    // const client = await getClient();

    const client = await createClient({
      directoryNodeUrlPool: [
        'https://system.chromaway.com',
        'https://chromia.validatrium.club',
        'https://chroma.node.monster:7741',
      ],
      blockchainRid: 'F4E33267A8FF1ACCE3C6D7B441B8542FB84FF6DAA5114105563D2AA34979BEF6',
    });

    console.log('client', client);

    const test_fee_kp = {
      privKey: Buffer.from('', 'hex'),
      pubKey: Buffer.from('', 'hex'),
    };

    console.log('test_fee_kp', test_fee_kp);

    const admin_kp = {
      privKey: Buffer.from(
        '27670DC258F13811EBE4D634ECF4222D0DC6EB4BF6151C1821F5AFCD51665C14',
        'hex'
      ),
      pubKey: Buffer.from(
        '0340AA42D9F8D819ED6C376C33B68D7F09F751F41CD881D8F66F9095C268A45DEE',
        'hex'
      ),
    };

    console.log('test_fee_kp', test_fee_kp);

    const adminSession = await getSessionOrRegister(client, admin_kp);
    const testFeeSession = await getSessionOrRegisterEVM(client, test_fee_kp);

    // we called grant FUNDS_ADMIN for admin.
    // await adminSession.call(
    //   op('grant_role', 'FUNDS_ADMIN', adminSession.account.id, admin_kp.pubKey)
    // );

    const fee_acc = await client.query('get_fee_collector_account_id');
    console.log('fee_acc', fee_acc);

    for (const token of TOKENS_MAINNET) {
      const underlyingAssetResult = await adminSession.getAssetsBySymbol(token.symbol);
      console.log('underlyingAssetResult', underlyingAssetResult);

      const total_fees = await client.query('get_total_fees', {
        asset_id: underlyingAssetResult.data[0].id,
      });
      console.log('total_fees', total_fees);

      // testFeeSession can not withdraw fee?
      await adminSession.call(
        op(
          'withdraw_fees',
          testFeeSession.account.id,
          underlyingAssetResult.data[0].id,
          createAmount(600, 0).value
        )
      );
    }
  } catch (error) {
    console.error(chalk.bold.red('❌❌❌ ERROR IN INIT SUPPLY ❌❌❌'));
    console.error(chalk.red(error));
  }
}

// Execute the script
initSupply().catch(error => console.error(chalk.red('Unhandled error:'), error));
