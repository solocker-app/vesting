# Solocker Token Vesting

This program is used for Locking Solocker LP Token. It's a permissionless lock contract.

Build environment

- Rustup default `1.76.0-x86_64-apple-darwin`
- Solana `1.18.4`
- Anchor `0.29.0`

To run unit test

```shell
cargo test
```

To run program integrated test

```shell
cargo test-bpf
```

To build program

```shell
cargo build-bpf
```

To deploy program

```shell
cd program
solana deploy target/deploy/token_vesting.so --keypair=target/deploy/token_vesting-keypair.json
```

> Forked from https://github.com/Bonfida/token-vesting
