// Logic
use anchor_lang::prelude::*;

use crate::contexts::{InitializePoolAccount, AddLiquidityAccount, SwapAccount};

use anchor_spl::{
    token::{self, Transfer}
};

pub fn initialize_pool(ctx: Context<InitializePoolAccount>, fee_bps: u16) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let token_x = &ctx.accounts.token_x_vault;
    let token_y = &ctx.accounts.token_y_vault;
        
    pool.token_x_mint = ctx.accounts.token_x_mint.key();
    pool.token_y_mint = ctx.accounts.token_y_mint.key();
    pool.token_x_vault = token_x.key();
    pool.token_y_vault = token_y.key();
    pool.fee_bps = fee_bps;
    pool.authority = ctx.accounts.authority.key();
    pool.bump = ctx.bumps.pool;
        
    // Initialize vaults with zero balances
    pool.token_x_balance = 0;
    pool.token_y_balance = 0;
        
    msg!("Pool initialized with fee: {} bps", fee_bps);
    Ok(())
}

pub fn add_liquidity(ctx: Context<AddLiquidityAccount>, amount_x: u64, amount_y: u64) -> Result<()> {
    // Token X transfer
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_x.to_account_info(),
        to: ctx.accounts.token_x_vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount_x)?;

    // Token Y transfer
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_y.to_account_info(),
        to: ctx.accounts.token_y_vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount_y)?;

    // Update the pool balance
    ctx.accounts.pool.token_x_balance += amount_x;
    ctx.accounts.pool.token_y_balance += amount_y;

    Ok(())
}

pub fn swap(ctx: Context<SwapAccount>, amount_x: u64) -> Result<()> {
    // Get the current balances of token X and token Y in the pool
    let token_x_balance = ctx.accounts.pool.token_x_balance;
    let token_y_balance = ctx.accounts.pool.token_y_balance;

    // Calculate the amount of token Y the user will receive
    let numerator = token_x_balance * token_y_balance;
    let denominator = token_x_balance + amount_x;
    let amount_y = token_y_balance - numerator / denominator;

    // Transfer token X from user to the vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_token_x.to_account_info(),
        to: ctx.accounts.token_x_vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount_x)?;

    // Transfer token Y from the vault to the user
    let cpi_accounts = Transfer {
        from: ctx.accounts.token_y_vault.to_account_info(),
        to: ctx.accounts.user_token_y.to_account_info(),
        authority: ctx.accounts.token_y_vault.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount_y)?;

    Ok(())
}