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

## Build & Deploy

1. **Build the program:**
   ```bash
   anchor build
   ```

2. **Deploy to localnet:**
   ```bash
   anchor deploy
   ```

3. **Run tests:**
   ```bash
   anchor test
   ```

## Test Results

Here's an example of the AMM in action:

```
------- Setting up test environment -------
Pool PDA: GrLpcFe51JL53TjNVzUB7bzcqFNW6S4gLWRLo9HAt6t7
------- Setup complete -------

    Pool Initialization
------- Initializing AMM pool -------
Transaction: PxcGFqV5gsicpYtpTxg7WdcLhCk5rPpNnZgwGijtKSBcs6rvHVPaVV24BWHRfWa8Y8fcDkHHsjZLv3Zej8KBsyz
✅ Pool initialized with 300 bps fee

      ✔ Should initialize AMM pool successfully (405ms)
    Liquidity Management
------- Adding liquidity to pool -------
Transaction: WzLHGQoErGtPiWQwxJdhoBMLrEQPiYiwGS46n67TaS5X4L7a18cEHU5cxASm2AQk5yszPtDmD6umDaNRnK2VQNK
✅ Added liquidity: 100 X + 200 Y
Exchange Rate (Y/X): 2

      ✔ Should add liquidity to pool successfully (405ms)
    Token Swapping
------- Performing token swap -------
Swapping 10 X for ~ 18.18 Y
Transaction: 379mxB86ycrJh2awhQoezHjG2SWdCZ2pNeQLDu3qjyDjnxBqSK97pUg9oW1uamtR6RhoE9SL24ah83v1sc9Mgowu
✅ Received 18.18 Y tokens
New rate (Y/X): 1.653

      ✔ Should swap Token X for Token Y successfully (406ms)
    Pool State Verification
------- Final Pool State -------
Pool Balance X: 110.00
Pool Balance Y: 181.82
Exchange Rate (Y/X): 1.652893
Fee Rate: 3%
✅ Pool state is consistent!
      ✔ Should display complete pool information

  4 passing (4s)
```

This test demonstrates:
- **Pool Creation**: Successfully initialized with 3% trading fee
- **Liquidity Addition**: Added 100 Token X + 200 Token Y (2:1 ratio)
- **Token Swap**: Swapped 10 Token X for 18.18 Token Y using constant product formula
- **Price Impact**: Exchange rate changed from 2.0 to 1.653 after the swap