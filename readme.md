# Micro AMM - Solana Automated Market Maker

A simple AMM (Automated Market Maker) smart contract built with Anchor framework on the Solana blockchain.

## Overview

This project implements a basic decentralized exchange (DEX) using the constant product formula (x * y = k) for token swapping. Users can create liquidity pools, add liquidity, and perform token swaps.

## Smart Contract Functions

### `initialize(fee_bps: u16)`
Creates a new AMM pool between two tokens.
- `fee_bps`: Trading fee in basis points (e.g., 300 = 3%)

### `add_liquidity(amount_a: u64, amount_b: u64)`
Adds liquidity to an existing pool.
- `amount_a`: Amount of token X to deposit
- `amount_b`: Amount of token Y to deposit

### `swap(amount_in: u64)`
Swaps token X for token Y using the AMM formula.
- `amount_in`: Amount of token X to swap

## Project Structure

```
programs/micro-amm/src/
├── lib.rs          # Main program entry point
├── contexts.rs     # Account validation structures
├── instructions.rs # Business logic implementation
└── state.rs        # Data structures and state management
```