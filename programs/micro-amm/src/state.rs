// Data structures and accounts

use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    pub token_x_mint: Pubkey,
    pub token_y_mint: Pubkey,
    pub token_x_vault: Pubkey,
    pub token_y_vault: Pubkey,
    pub fee_bps: u16,
    pub authority: Pubkey,
    pub bump: u8,
    pub token_x_balance: u64,
    pub token_y_balance: u64,
}

impl Pool {
    // Account size: 8 discriminator + 5 Pubkeys (5*32) + u16 (2) + u8 (1) + 2*u64 (16)
    // 8 + 160 + 2 + 1 + 16 = 187
    pub const INIT_SPACE: usize = 187;
}