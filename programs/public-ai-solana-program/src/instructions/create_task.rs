use crate::state::task::*;
use anchor_lang::prelude::*;
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
    pub system_program: Program<'info, System>,
}

pub fn create_task(ctx: Context<CreateTask>, id:u64, m_reward:u64, v_reward:u64, f_reward:u64, job_count:u64) -> Result<()> {
    let task = &mut ctx.accounts.task;
    task.id = id;
    task.m_reward = m_reward;
    task.v_reward = v_reward;
    task.f_reward = f_reward;
    task.job_count = job_count;
    // task.publisher = ctx.accounts.publisher.key();
    let counter = &mut ctx.accounts.task_info;
    counter.count+=1;
    Ok(())
}