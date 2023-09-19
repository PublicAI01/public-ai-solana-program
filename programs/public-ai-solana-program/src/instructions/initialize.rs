use crate::state::task::*;
use anchor_lang::prelude::*;
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
    init,
    payer = creator,
    space = 17,
    seeds = [b"task_info"],
    bump,
    )]
    pub task_info: Account<'info, TaskInfo>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    let initia = &mut ctx.accounts.task_info;
    initia.bump = *ctx.bumps.get("task_info").unwrap();
    Ok(())
}