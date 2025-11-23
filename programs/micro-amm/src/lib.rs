use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod contexts;

use contexts::*;

declare_id!("GnHrbANRJ1P6jf9FSNRpfkFZzHKepwBg4NDewPh3hwXu");

#[program]
pub mod micro_amm {
    use super::*;

    pub fn initialize(ctx: Context<InitializePoolAccount>, fee_bps: u16) -> Result<()> {
        instructions::initialize_pool(ctx, fee_bps)
    }

    pub fn swap(ctx: Context<SwapAccount>, amount_in: u64) -> Result<()> {
        instructions::swap(ctx, amount_in)
    }

    pub fn add_liquidity(ctx: Context<AddLiquidityAccount>, amount_a: u64, amount_b: u64) -> Result<()> {
        instructions::add_liquidity(ctx, amount_a, amount_b)
    }
}