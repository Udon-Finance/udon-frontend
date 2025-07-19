/* eslint @typescript-eslint/no-var-requires: 0 */
import {
  // applyTransfer,
  // Connection,
  createAmount,
  //   createClientToBlockchain,
  createInMemoryEvmKeyStore,
  // noopAuthenticator,
  // transactionBuilder,
  // TransactionBuilder,
  //   getAssetDetailsForCrosschainRegistration,
  //   op,
  //   registerCrosschainAsset,
  //   TransactionCompletion,
} from '@chromia/ft4';

import {
  // BufferId,
  //   BufferId,
  createClient,
  encryption,
  // Operation,
  //   IClient,
  //   newSignatureProvider,
  //   SignatureProvider,
} from 'postchain-client';
import { createKeyStoreInteractor } from '@chromia/ft4';
import chalk from 'chalk';
// import { admin_kp } from '../configs/key-pair';
// import { getSessionOrRegisterEVM } from '../helpers';

// async function registerAssetWithValidation(
//   assetId: BufferId,
//   originBlockchainRid: BufferId,
//   client: IClient,
//   signatureProvider: SignatureProvider
// ): Promise<TransactionCompletion> {
//   // Create a client for the origin blockchain
//   const originBlockchainClient = await createClientToBlockchain(client, originBlockchainRid);

//   // Fetch asset details from the origin blockchain
//   const asset = await getAssetDetailsForCrosschainRegistration(originBlockchainClient, assetId);
//   console.log('asset', asset);
//   // Ensure the issuing blockchain matches the origin chain
//   if (
//     asset.blockchainRid.toString('hex').toLowerCase() !==
//     originBlockchainRid.toString('hex').toLowerCase()
//   ) {
//     throw new Error(
//       `Validation error: Issuing blockchain (${asset.blockchainRid.toString(
//         'hex'
//       )}) does not match the origin (${originBlockchainRid.toString('hex')}).`
//     );
//   }

//   // Register the validated asset on the destination chain
//   return await registerCrosschainAsset(client, signatureProvider, assetId, originBlockchainRid);
// }

// async function performCrosschainTransfer(
//   tb: TransactionBuilder,
//   initOperation: Operation,
//   connection01: Connection,
//   multichain01Rid: BufferId
// ) {
//   // Send the initial transaction and get the receipt
//   const initTransactionWithReceipt = await tb.add(initOperation).buildAndSendWithAnchoring();

//   // Get confirmation proof for the target blockchain
//   const iccfProofOperation =
//     await initTransactionWithReceipt.systemConfirmationProof(multichain01Rid);

//   // Create and send the application transaction
//   await transactionBuilder(noopAuthenticator, connection01.client)
//     .add(iccfProofOperation)
//     .add(applyTransfer(initTransactionWithReceipt.tx, 1, initTransactionWithReceipt.tx, 1, 0))
//     .buildAndSend();

//   // Return the transaction ID for reference
//   return initTransactionWithReceipt.receipt.transactionRid;
// }

async function main() {
  try {
    console.log(chalk.bold.cyan(`=== Starting Cross-Chain Transfer Test ===`));

    const privKey = Buffer.from(
      //   'cafdec1a5756bbb148aeb65e86878bcbacbb90607507beb58665fd99409a4299',
      '76134de6d764d74ab806b844c90d504f717e4e7f00616627898a83a8fe4fc28c',
      'hex'
    );
    const keyPair = encryption.makeKeyPair(privKey);

    // const adminSignatureProvider = newSignatureProvider(0, admin_kp);

    const keystoreEVM = createInMemoryEvmKeyStore(keyPair);

    const CHR_ASSET_ID = '9ef73a786a66f435b3b40e72f5e9d85a4b09815997e087c809913e1e7ec686b4'; // tCHR asset on Chromia testnet
    const ECONOMY_BLOCKCHAIN_RID =
      '090BCD47149FBB66F02489372E88A454E7A5645ADDE82125D40DF1EF0C76F874'; // Economy chain RID
    const UDON_BLOCKCHAIN_RID = '8A65C5D455E7F8628D6EC89C96E6D8811BEDD91CA9ACC5EDA1F757F5AE0E5D91'; // Udon chain RID
    // const economyAccountId = 'e6bdec98482aa1837d28e71dae487905809bae2b6f35b827016249c84566fcd3';
    const economyAccountId = 'a09e03f051d3ed624cc94dcd3e1ce735915deb2f0d60d10677ad701d938da026';
    const TESTNET_URL = [
      'https://node0.testnet.chromia.com:7740',
      'https://node1.testnet.chromia.com:7740',
      'https://node2.testnet.chromia.com:7740',
      'https://node3.testnet.chromia.com:7740',
    ];

    console.log(chalk.blue(`🔄 Connecting to Economy blockchain...`));
    const economyClient = await createClient({
      directoryNodeUrlPool: TESTNET_URL,
      blockchainRid: ECONOMY_BLOCKCHAIN_RID,
    });
    console.log(chalk.green(`✅ Connected to Economy blockchain`));

    const { getSession: getEconomySession } = createKeyStoreInteractor(economyClient, keystoreEVM);

    console.log(chalk.blue(`🔄 Creating Economy session...`));
    const economySession = await getEconomySession(economyAccountId);
    console.log(chalk.green(`✅ Economy session created successfully`));

    console.log(chalk.blue(`🔄 Connecting to Udon blockchain...`));
    const udonClient = await createClient({
      directoryNodeUrlPool: TESTNET_URL,
      blockchainRid: UDON_BLOCKCHAIN_RID,
    });
    console.log(chalk.green(`✅ Connected to Udon blockchain`));

    console.log(chalk.blue(`🔄 Registering account on Udon blockchain...`));
    console.log('keyPair', keyPair);
    // const udonSession = await getSessionOrRegisterEVM(udonClient, keyPair);
    const { getSession: getUdonSession } = createKeyStoreInteractor(udonClient, keystoreEVM);

    const udonSession = await getUdonSession(economyAccountId);
    console.log(chalk.green(`✅ Account registered on Udon blockchain`));

    // try {
    //   console.log(chalk.blue(`🔄 Initializing chain...`));
    //   await udonSession.call(op('init', Buffer.from(ECONOMY_BLOCKCHAIN_RID, 'hex')));
    //   console.log(chalk.green(`✅ Chain initialized successfully`));
    // } catch {
    //   console.log(chalk.yellow(`⚠️ Chain already initialized`));
    // }

    // const txRes = await registerAssetWithValidation(
    //   CHR_ASSET_ID,
    //   ECONOMY_BLOCKCHAIN_RID,
    //   udonClient,
    //   adminSignatureProvider
    // );
    // console.log('txRes', txRes);

    // Check balances before transfer
    console.log(chalk.bold.yellow(`\n📊 Checking initial balances:`));

    const userEconomyBalanceBefore =
      (await economySession.account.getBalanceByAssetId(CHR_ASSET_ID))?.amount.toString() || 'none';
    console.log(
      chalk.blue(`📌 User 1 balance on Economy chain: ${chalk.white(userEconomyBalanceBefore)}`)
    );

    const userUdonBalanceBefore =
      (await udonSession.account.getBalanceByAssetId(CHR_ASSET_ID))?.amount.toString() || 'none';
    console.log(
      chalk.blue(`📌 User 2 balance on Udon chain: ${chalk.white(userUdonBalanceBefore)}`)
    );

    console.log(chalk.bold.cyan(`\n=== First Transfer: Economy → Udon ===`));

    console.log(chalk.blue(`🔄 Preparing cross-chain transfer...`));
    const transfer0 = economySession.account.crosschainTransfer(
      udonSession.blockchainRid,
      udonSession.account.id,
      CHR_ASSET_ID,
      createAmount(3, 6)
    );

    transfer0.on('init', () => {
      console.log(chalk.blue(`\t🔄 Transfer initialized`));
    });

    transfer0.on('hop', brid => {
      console.log(chalk.blue(`\t🔄 Hopped to chain: ${chalk.white(brid.toString('hex'))}`));
    });

    console.log(chalk.blue(`🚀 Starting transfer of 12 tCHR tokens...`));
    await transfer0
      .then(() => {
        console.log(chalk.green(`\t✅ Transfer completed successfully`));
      })
      .catch(error => {
        console.error(chalk.red(`\t❌ Transfer failed: ${error.message}`));
      });

    console.log(chalk.bold.yellow(`\n📊 Checking balances after first transfer:`));

    const userEconomyBalanceAfter =
      (await economySession.account.getBalanceByAssetId(CHR_ASSET_ID))?.amount.toString() || 'none';
    console.log(
      chalk.blue(`📌 User 1 balance on Economy chain: ${chalk.white(userEconomyBalanceAfter)}`)
    );

    const userUdonBalanceAfter =
      (await udonSession.account.getBalanceByAssetId(CHR_ASSET_ID))?.amount.toString() || 'none';
    console.log(
      chalk.blue(`📌 User 2 balance on Udon chain: ${chalk.white(userUdonBalanceAfter)}`)
    );

    console.log(chalk.bold.cyan(`\n=== Second Transfer: Udon → Economy ===`));

    console.log(chalk.blue(`🔄 Preparing to transfer half of assets back to sender...`));
    const transfer1 = udonSession.account.crosschainTransfer(
      economySession.blockchainRid,
      economySession.account.id,
      CHR_ASSET_ID,
      createAmount(2, 6)
    );

    console.log(chalk.blue(`🚀 Starting transfer of 6 tCHR tokens...`));
    await transfer1
      .then(() => {
        console.log(chalk.green(`\t✅ Second transfer completed successfully`));
      })
      .catch(error => {
        console.error(chalk.red(`\t❌ Second transfer failed: ${error.message}`));
      });

    console.log(chalk.bold.yellow(`\n📊 Checking final balances:`));

    const userEconomyBalanceFinal =
      (await economySession.account.getBalanceByAssetId(CHR_ASSET_ID))?.amount.toString() || 'none';
    console.log(
      chalk.blue(
        `📌 User 1 final balance on Economy chain: ${chalk.white(userEconomyBalanceFinal)}`
      )
    );

    const userUdonBalanceFinal =
      (await udonSession.account.getBalanceByAssetId(CHR_ASSET_ID))?.amount.toString() || 'none';
    console.log(
      chalk.blue(`📌 User 2 final balance on Udon chain: ${chalk.white(userUdonBalanceFinal)}`)
    );

    console.log(
      chalk.bold.green(`\n✅✅✅ Cross-chain transfer test completed successfully ✅✅✅`)
    );
  } catch (error) {
    console.error(chalk.bold.red('❌❌❌ ERROR IN CROSS-CHAIN TRANSFER TEST ❌❌❌'));
    console.error(chalk.red(error));
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(chalk.bold.red('❌ Unhandled error:'));
    console.error(chalk.red(error));
    process.exit(1);
  });
