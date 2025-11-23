// Account Validation

use anchor_lang::prelude::*;
use crate::state::Pool;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount}
};

#[derive(Accounts)]
pub struct InitializePoolAccount<'info> {
    #[account(
        init,
        payer = authority,
        space = Pool::INIT_SPACE,
        seeds = [
            b"pool",
            token_x_mint.key().as_ref(),
            token_y_mint.key().as_ref()
        ],
        bump
    )]
    pub pool: Account<'info, Pool>,
    
    // Token X mint account
    pub token_x_mint: Account<'info, Mint>,
    
    // Token Y mint account  
    pub token_y_mint: Account<'info, Mint>,
    
    // Vault accounts for token X and Y
    #[account(
        init,
        payer = authority,
        token::mint = token_x_mint,
        token::authority = pool,
    )]
    pub token_x_vault: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = authority,
        token::mint = token_y_mint,
        token::authority = pool,
    )]
    pub token_y_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct AddLiquidityAccount<'info> {
    #[account(
        seeds = [
            b"pool",
            pool.token_x_mint.as_ref(),
            pool.token_y_mint.as_ref()
        ],
        bump = pool.bump
    )]
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(
        mut,
        constraint = token_x_vault.key() == pool.token_x_vault
    )]
    pub token_x_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = token_y_vault.key() == pool.token_y_vault
    )]
    pub token_y_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_x: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_y: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SwapAccount<'info> {
    #[account(
        seeds = [
            b"pool",
            pool.token_x_mint.as_ref(),
            pool.token_y_mint.as_ref()
        ],
        bump = pool.bump
    )]
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    
    #[account(
        mut,
        constraint = token_x_vault.key() == pool.token_x_vault
    )]
    pub token_x_vault: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = token_y_vault.key() == pool.token_y_vault
    )]
    pub token_y_vault: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_x: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user_token_y: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}