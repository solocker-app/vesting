import { readFileSync } from 'fs';
import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Transaction,
} from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount } from '@solana/spl-token';

import {
  create,
  generateRandomSeed,
  Schedule,
  Numberu64,
  getContractInfo,
  TOKEN_VESTING_PROGRAM_ID,
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

  const sender = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    new PublicKey(wallet.publicKey),
  );

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
    sender.address,
    receiver.address,
    mint,
    schedules,
  );
}

async function create_main({ connection, wallet }: TestParams) {
  const transaction = new Transaction();

  transaction.add(
    ...(await test_create(
      connection,
      wallet,
      '2ZgcmUQ5pTi46taE7aM46QUb8pRM24n1gxNyqxcmhHQ7',
      '9meGAekj5fSks2oYbv5RmVoxUam5d9T1RaxPhofnHmV2',
      [
        Schedule.new(
          new Numberu64(Date.now() / 1000 + 2 * 60),
          new Numberu64(10 * Math.pow(10, 9)),
        ),
      ],
    )),
  );

  const tx = await sendAndConfirmTransaction(connection, transaction, [wallet]);
  console.log(`tx: ${tx}`);
}

async function test_get_contract_info(connection: Connection, seed: string) {
  return getContractInfo(connection, new PublicKey(seed));
}

async function test_get_contract_info_main({ connection }: TestParams) {
  const info = await test_get_contract_info(
    connection,
    '5aATPMcGBZjge8hqJmFH2DZ2eeZ7ykhwE7Wp9HXkfU27',
  );

  // @ts-ignore
  // console.log(info.totalAmount.toNumber());
  // @ts-ignore
  console.log(info.schedules[0].amount.toNumber());
  // @ts-ignore
  console.log('Now', info.createdAt.toNumber());
  // @ts-ignore
  console.log('Release', info.schedules[0].releaseTime.toNumber());
  console.log(info.schedules[0].isReleased);
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
  await test_get_contract_info_main({ connection, wallet });
  // const instructions = await unlock(
  //   connection,
  //   TOKEN_VESTING_PROGRAM_ID,
  //   Buffer.from(
  //     '1438828747609030358604982531533607638335779682155635017658975152',
  //   ),
  //   new PublicKey('2ZgcmUQ5pTi46taE7aM46QUb8pRM24n1gxNyqxcmhHQ7'),
  // );

  // const transaction = new Transaction().add(...instructions);

  // console.log(
  //   await sendAndConfirmTransaction(connection, transaction, [wallet]),
  // );

  //   const vestingInfos = await getContractInfoByTokenAddress(
  //     connection,
  //     TOKEN_VESTING_PROGRAM_ID,
  //     new PublicKey('GoJ8NhgGBgjUtmv2DhoxZxS6f2mgqyijwfKCxXfYTzd9'),
  //   );

  //   console.log(JSON.stringify(vestingInfos, undefined, 2));
  //
}
main().catch(console.log);
