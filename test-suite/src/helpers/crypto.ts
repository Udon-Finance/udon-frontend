import crypto from 'crypto-browserify';
import { gtv, MERKLE_HASH_VERSIONS } from 'postchain-client';
import secp256k1 from 'secp256k1';
import { ensureBuffer, ensureString } from './buffer';
import { testEnv } from '../configs';

// Generate private key
export function generatePrivKey(): Buffer {
  let privKey: Buffer;
  do {
    privKey = crypto.randomBytes(32);
  } while (!secp256k1.privateKeyVerify(privKey));
  return privKey;
}

// Create Pubkey from privkey
export function getPubKey(privKey: Buffer): Buffer {
  return secp256k1.publicKeyCreate(privKey);
}

export function getAssetBuffer(name: string = 'Chromia Test', rid: string | Buffer) {
  return Buffer.from(gtv.gtvHash([name, ensureBuffer(rid)], MERKLE_HASH_VERSIONS.TWO));
}

export function getAccountBuffer(pubKey: string | Buffer) {
  return Buffer.from(gtv.gtvHash(ensureBuffer(pubKey), MERKLE_HASH_VERSIONS.TWO));
}

export function getAccountId(pubKey: string | Buffer) {
  return ensureString(getAccountBuffer(pubKey));
}

export function getAssetId(name: string, rid: string | Buffer) {
  return ensureString(getAssetBuffer(name, rid));
}

export function getCHRId() {
  // economy mint CHR
  return ensureString(
    getAssetBuffer(
      // 'Chromia Test',
      // '090BCD47149FBB66F02489372E88A454E7A5645ADDE82125D40DF1EF0C76F874' // testnet eco rid
      'Chromia',
      '15C0CA99BEE60A3B23829968771C50E491BD00D2E3AE448580CD48A8D71E7BBA'
    )
  );
}

export function getCHRIdBuffer() {
  return getAssetBuffer(
    // 'Chromia Test',
    // '090BCD47149FBB66F02489372E88A454E7A5645ADDE82125D40DF1EF0C76F874' // testnet eco rid
    'Chromia',
    '15C0CA99BEE60A3B23829968771C50E491BD00D2E3AE448580CD48A8D71E7BBA'
  );
}

export function getStCHRId() {
  // udon mint stCHR
  return ensureString(getAssetBuffer('Staked Chromia', testEnv.BLOCKCHAIN_RID));
}

export function getStCHRIdBuffer() {
  return getAssetBuffer('Staked Chromia', testEnv.BLOCKCHAIN_RID);
}

export function getAstCHRId() {
  // udon mint astCHR
  return ensureString(getAssetBuffer('aStaked Chromia', testEnv.BLOCKCHAIN_RID));
}

export function getAstCHRIdBuffer() {
  return getAssetBuffer('aStaked Chromia', testEnv.BLOCKCHAIN_RID);
}
