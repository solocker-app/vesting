import { readFileSync } from 'fs';
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  NATIVE_MINT,
} from '@solana/spl-token';

import {
  create,
  generateRandomSeed,
  Schedule,
  Numberu64,
  unlock,
  // getContractInfo,
  TOKEN_VESTING_PROGRAM_ID,
  // getContractInfoByTokenAddress,
} from './index';


type TestParams = {
  connection: Connection;
  wallet: Keypair;
};

export async function test_create(
  connection: Connection,
  wallet: Keypair,
  mintAddress: string,
  receiverAddress: string,
  schedules: Schedule[],
  programId = TOKEN_VESTING_PROGRAM_ID,
) {
  const seed = generateRandomSeed();
  const mint = new PublicKey(mintAddress);

  console.log('seed:', seed.toString());
  // const sender = wallet.publicKey;

  const sender = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    new PublicKey(wallet.publicKey),
  );

  // console.log(sender.address.toBase58());

  const receiver = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    new PublicKey(receiverAddress),
  );

  return create(
    connection,
    programId,
    Buffer.from(seed),
    wallet.publicKey,
    wallet.publicKey,
    wallet.publicKey,
    receiver.address,
    mint,
    schedules,
    true,
  );
}

async function create_main({ connection, wallet }: TestParams) {
  const transaction = new Transaction();

  transaction.add(
    ...(await test_create(
      connection,
      wallet,
      NATIVE_MINT.toBase58(),
      '9meGAekj5fSks2oYbv5RmVoxUam5d9T1RaxPhofnHmV2',
      [
        Schedule.new(
          new Numberu64(Date.now() / 1000 + 2 * 60),
          new Numberu64(0.5 * Math.pow(10, 9)),
        ),
      ],
    )),
  );

  const tx = await sendAndConfirmTransaction(connection, transaction, [wallet]);
  console.log(`tx: ${tx}`);
}

async function unlock_main({ connection, wallet }: TestParams, seed: string) {
  const instructions = await unlock(
    connection,
    TOKEN_VESTING_PROGRAM_ID,
    Buffer.from(seed),
    NATIVE_MINT,
  );

  const transaction = new Transaction().add(...instructions);

  console.log(
    await sendAndConfirmTransaction(connection, transaction, [wallet]),
  );
}

async function main() {
  const connection = new Connection(clusterApiUrl('devnet'));
  const wallet = Keypair.fromSecretKey(
    Uint8Array.from(
      JSON.parse(
        readFileSync('/Users/macbookpro/.config/solana/id.json', 'utf-8'),
      ),
    ),
  );

  // await create_main({ connection, wallet });
  await unlock_main(
    { connection, wallet },
    '9916336280140133239920424279523996673162066636448351851588593826',
  );
}
main().catch(console.log);
