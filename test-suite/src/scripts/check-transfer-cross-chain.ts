/* eslint @typescript-eslint/no-var-requires: 0 */
import {
  AnchoringTransactionWithReceipt,
  applyTransfer,
  //   Connection,
  createAmount,
  // createClientToBlockchain,
  createInMemoryEvmKeyStore,
  // getAssetDetailsForCrosschainRegistration,
  initTransfer,
  noopAuthenticator,
  // registerCrosschainAsset,
  transactionBuilder,
  // TransactionCompletion,
  //   TransactionBuilder,
} from '@chromia/ft4';

import {
  createClient,
  encryption,
  // newSignatureProvider,
  // BufferId,
  // IClient,
  // SignatureProvider,
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
//   console.log('initTransactionWithReceipt init');
//   const initTransactionWithReceipt = await tb.add(initOperation).buildAndSendWithAnchoring();
//   console.log('iccfProofOperation init');

//   // Get confirmation proof for the target blockchain
//   const iccfProofOperation =
//     await initTransactionWithReceipt.systemConfirmationProof(multichain01Rid);

//   console.log('transactionBuilder init');

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

    // source chain: ecomony chain
    // target chain: udon
    const tb = transactionBuilder(economySession.account.authenticator, economyClient);
    const initOperation = initTransfer(
      udonSession.account.id, // id of account who recaive transfer
      CHR_ASSET_ID, // asset transfer
      createAmount(2, 6), // amount
      [UDON_BLOCKCHAIN_RID], // array display path from source to target chain
      10000000000000 // deadline
    );

    let transferTransactionRid: Buffer | undefined = undefined;

    console.log('Sending transaction...', initOperation);

    await new Promise<void>((resolve, reject) => {
      const transactionApplier = async (
        initTransactionWithReceipt: AnchoringTransactionWithReceipt
      ) => {
        const iccfProofOperation =
          await initTransactionWithReceipt.systemConfirmationProof(UDON_BLOCKCHAIN_RID);
        try {
          await transactionBuilder(noopAuthenticator, udonClient)
            .add(iccfProofOperation)
            .add(
              applyTransfer(initTransactionWithReceipt.tx, 0, initTransactionWithReceipt.tx, 0, 1)
            )
            .buildAndSend();
          transferTransactionRid = initTransactionWithReceipt.receipt.transactionRid;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      tb.add(initOperation).buildAndSendWithAnchoring().then(transactionApplier);
    });

    const history = await economySession.account.getTransferHistory();
    console.log('history', history);
    const entry = history.data[0];
    console.log('entry.isInput', entry.isInput, 'should be true');
    console.log(
      'entry.operationName',
      entry.operationName,
      'initOperation.name',
      initOperation.name
    );
    console.log(
      'entry.delta.value.toString()',
      entry.delta.value.toString(),
      'amount to transfer',
      '100'
    );
    console.log('entry.asset.id', entry.asset.id.toString('hex'), 'CHR_ASSET_ID', CHR_ASSET_ID);
    console.log(
      'entry.transactionId',
      entry.transactionId.toString('hex'),
      'transferTransactionRid',
      transferTransactionRid!.toString('hex')
    );

    console.log('entry.opIndex', entry.opIndex, 'should be 1');
    console.log('entry.isCrosschain', entry.isCrosschain, 'should be true');

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
