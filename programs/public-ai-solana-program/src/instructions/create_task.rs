use crate::state::task::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};
#[derive(Accounts)]
pub struct CreateTask<'info> {
    #[account(mut)]
    pub publisher: Signer<'info>,
    #[account(
    mut,
    seeds = [b"task_info"],
    bump = task_info.bump,
    )]
    pub task_info: Account<'info, TaskInfo>,
    // space: 8 discriminator + 40 +32
    #[account(
    init,
    payer = publisher,
    space = 80,
    seeds = [format!("task-{}", task_info.count).as_ref()],
    bump,
    )]
    pub task: Account<'info, Task>,
    #[account(mut)]
    pub publisher_ata: Account<'info, TokenAccount>,
    #[account(
    mut,
    seeds = [b"escrow_wallet"],
    bump,
    )]
    pub escrow_wallet: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn create_task(ctx: Context<CreateTask>, id:u64, m_reward:u64, v_reward:u64, f_reward:u64, job_count:u64) -> Result<()> {
    let task = &mut ctx.accounts.task;
    task.id = id;
    task.m_reward = m_reward;
    task.v_reward = v_reward;
    task.f_reward = f_reward;
    task.job_count = job_count;
    task.publisher = ctx.accounts.publisher.key();
    let source = &ctx.accounts.publisher_ata;
    let destination = &ctx.accounts.escrow_wallet;
    let authority = &ctx.accounts.publisher;
    let token_program = &ctx.accounts.token_program;
    let cpi_accounts = SplTransfer {
        from: source.to_account_info().clone(),
        to: destination.to_account_info().clone(),
        authority: authority.to_account_info().clone(),

    };
    let cpi_program = token_program.to_account_info();
    let mut amount = (m_reward + v_reward + f_reward)*job_count;
    amount = amount + amount*ctx.accounts.task_info.fee_rate/100;
    token::transfer(
        CpiContext::new(cpi_program, cpi_accounts),
        amount)?;
    let counter = &mut ctx.accounts.task_info;
    counter.count+=1;
    Ok(())
}