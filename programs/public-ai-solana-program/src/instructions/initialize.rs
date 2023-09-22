use crate::state::task::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
    init,
    payer = creator,
    space = 25 + 32,
    seeds = [b"task_info"],
    bump,
    )]
    pub task_info: Account<'info, TaskInfo>,
    pub reward_token: Account<'info, Mint>,  // USDT
    #[account(
    init,
    payer = creator,
    seeds = [b"escrow_wallet"],
    bump,
    token::mint = reward_token,
    token::authority = task_info,
    )]
    pub escrow_wallet: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn initialize(ctx: Context<Initialize>, fee_rate:u64) -> Result<()> {
    let initia = &mut ctx.accounts.task_info;
    initia.fee_rate = fee_rate;
    initia.reward_token = ctx.accounts.reward_token.key();
    initia.bump = *ctx.bumps.get("task_info").unwrap();
    Ok(())
}