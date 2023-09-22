use crate::state::task::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};

#[derive(Accounts)]
#[instruction(task_id: u64, job_id: u64)]
pub struct AcceptJob<'info> {
    #[account(mut)]
    pub publisher: Signer<'info>,
    #[account(
    init,
    payer = publisher,
    space = 121,
    seeds = [format!("job-{}", job_id).as_ref()],
    bump,
    )]
    pub job: Account<'info, Job>,
    #[account(
    seeds = [format!("task-{}", task_id).as_ref()],
    bump,
    )]
    pub task: Account<'info, Task>,
    #[account(
    mut,
    seeds = [b"task_info"],
    bump = task_info.bump,
    )]
    pub task_info: Account<'info, TaskInfo>,
    #[account(
    mut,
    seeds = [b"escrow_wallet"],
    bump,
    )]
    pub escrow_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    pub marker_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub validator_ata: Account<'info, TokenAccount>,
    #[account(mut)]
    pub fisher_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn accept_job(ctx: Context<AcceptJob>, task_id: u64, job_id:u64) -> Result<()> {
    let job = &mut ctx.accounts.job;
    job.id = job_id;
    job.task_id = task_id;
    job.marker = ctx.accounts.marker_ata.owner.key();
    job.validator = ctx.accounts.validator_ata.owner.key();
    job.fisher = ctx.accounts.fisher_ata.owner.key();
    let task = &ctx.accounts.task;
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let bump_vector = ctx.accounts.task_info.bump.to_le_bytes();
    let inner = vec![
        b"task_info".as_ref(),
        bump_vector.as_ref(),
    ];
    let outer = vec![inner.as_slice()];
    // Transfer tokens from taker to initializer
    let mut cpi_accounts = SplTransfer {
        from: ctx.accounts.escrow_wallet.to_account_info().clone(),
        to: ctx.accounts.marker_ata.to_account_info().clone(),
        authority: ctx.accounts.task_info.to_account_info().to_account_info().clone(),
    };
    token::transfer(
        CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, outer.as_slice()),
        task.m_reward)?;
    cpi_accounts = SplTransfer {
        from: ctx.accounts.escrow_wallet.to_account_info().clone(),
        to: ctx.accounts.validator_ata.to_account_info().clone(),
        authority: ctx.accounts.task_info.to_account_info().to_account_info().clone(),
    };
    token::transfer(
        CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, outer.as_slice()),
        task.v_reward)?;
    cpi_accounts = SplTransfer {
        from: ctx.accounts.escrow_wallet.to_account_info().clone(),
        to: ctx.accounts.fisher_ata.to_account_info().clone(),
        authority: ctx.accounts.task_info.to_account_info().to_account_info().clone(),
    };
    token::transfer(
        CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts, outer.as_slice()),
        task.f_reward)?;
    Ok(())
}