import { PublicKey } from '@solana/web3.js';
import { Numberu64 } from './utils';

export class Schedule {
  // Release time in unix timestamp
  readonly releaseTime!: Numberu64;
  readonly amount!: Numberu64;
  readonly isReleased: boolean;

  private constructor(
    releaseTime: Numberu64,
    amount: Numberu64,
    isReleased: boolean,
  ) {
    this.releaseTime = releaseTime;
    this.amount = amount;
    this.isReleased = isReleased;
  }

  static new(releaseTime: Numberu64, amount: Numberu64) {
    return new Schedule(releaseTime, amount, false);
  }

  public toBuffer(): Buffer {
    //@ts-ignore
    return Buffer.concat([this.releaseTime.toBuffer(), this.amount.toBuffer()]);
  }

  static fromBuffer(buf: Buffer): Schedule {
    const releaseTime: Numberu64 = Numberu64.fromBuffer(buf.slice(0, 8));
    const amount: Numberu64 = Numberu64.fromBuffer(buf.slice(8, 16));
    const isReleased = buf[16] === 1;

    return new Schedule(releaseTime, amount, isReleased);
  }
}

export class VestingScheduleHeader {
  readonly seeds: Buffer;
  readonly totalAmount: Numberu64;
  readonly destinationAddress!: PublicKey;
  readonly mintAddress!: PublicKey;
  readonly isInitialized!: boolean;

  constructor(
    seeds: Buffer,
    destinationAddress: PublicKey,
    mintAddress: PublicKey,
    isInitialized: boolean,
    totalAmount: Numberu64,
  ) {
    this.seeds = seeds;
    this.destinationAddress = destinationAddress;
    this.mintAddress = mintAddress;
    this.isInitialized = isInitialized;
    this.totalAmount = totalAmount;
  }

  static fromBuffer(buf: Buffer): VestingScheduleHeader {
    const seeds = buf.slice(0, 32);
    const destinationAddress = new PublicKey(buf.slice(32, 64));
    const mintAddress = new PublicKey(buf.slice(64, 96));
    const totalAmount = Numberu64.fromBuffer(buf.slice(96, 104));
    const isInitialized = buf[104] == 1;

    return new VestingScheduleHeader(
      seeds,
      destinationAddress,
      mintAddress,
      isInitialized,
      totalAmount,
    );
  }
}

export class ContractInfo {
  readonly seeds!: Buffer;
  readonly totalAmount!: Numberu64;
  readonly destinationAddress!: PublicKey;
  readonly mintAddress!: PublicKey;
  readonly schedules!: Array<Schedule>;

  constructor(
    seeds: Buffer,
    destinationAddress: PublicKey,
    mintAddress: PublicKey,
    totalAmount: Numberu64,
    schedules: Array<Schedule>,
  ) {
    this.seeds = seeds;
    this.totalAmount = totalAmount;
    this.destinationAddress = destinationAddress;
    this.mintAddress = mintAddress;
    this.schedules = schedules;
  }

  static fromBuffer(buf: Buffer): ContractInfo | undefined {
    const header = VestingScheduleHeader.fromBuffer(buf.slice(0, 105));

    if (!header.isInitialized) {
      return undefined;
    }
    const schedules: Array<Schedule> = [];

    for (let i = 105; i < buf.length; i += 17) {
      schedules.push(Schedule.fromBuffer(buf.slice(i, i + 17)));
    }

    return new ContractInfo(
      header.seeds,
      header.destinationAddress,
      header.mintAddress,
      header.totalAmount,
      schedules,
    );
  }
}
