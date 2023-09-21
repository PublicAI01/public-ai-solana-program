use crate::state::task::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer as SplTransfer};

#[derive(Accounts)]
#[instruction(job_id: u64)]
pub struct AcceptJob<'info> {
    pub publisher: Signer<'info>,
    // #[account(
    // init,
    // payer = publisher,
    // space = 113,
    // seeds = [format!("job-{}", job_id).as_ref()],
    // bump,
    // )]
    // pub job: Account<'info, Job>,
    #[account(
    mut,
    seeds = [b"escrow_wallet"],
    bump,
    )]
    pub escrow_wallet: Account<'info, TokenAccount>,
    #[account(mut)]
    pub marker_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn accept_job(ctx: Context<AcceptJob>, task_id: u64, job_id:u64,marker:Pubkey, validator:Pubkey, fisher:Pubkey) -> Result<()> {
    // let job = &mut ctx.accounts.job;
    // job.id = job_id;
    // job.marker = marker;
    // job.validator = validator;
    // job.fisher = fisher;
    let source = &ctx.accounts.escrow_wallet;
    let mut destination = Account::default();
    destination.key = marker;
    let token_program = &ctx.accounts.token_program;
    let authority = &ctx.accounts.escrow_wallet;

    // Transfer tokens from taker to initializer
    let cpi_accounts = SplTransfer {
        from: source.to_account_info().clone(),
        to: destination.to_account_info().clone(),
        authority: authority.to_account_info().clone(),
    };
    let cpi_program = token_program.to_account_info();

    token::transfer(
        CpiContext::new(cpi_program, cpi_accounts),
        1)?;
    Ok(())
}