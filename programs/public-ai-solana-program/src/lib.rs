use anchor_lang::prelude::*;
use instructions::*;
pub mod instructions;
pub mod state;
declare_id!("2sB1TWavHoSioCQqHeKvZU7uvQAN3bsrLvQzK7yg96hz");

#[program]
pub mod public_ai_solana_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_rate:u64) -> Result<()> {
        instructions::initialize::initialize(ctx, fee_rate)
    }
    pub fn create_task(ctx: Context<CreateTask>, id:u64, m_reward:u64, v_reward:u64, f_reward:u64, job_count:u64) -> Result<()> {
        instructions::create_task::create_task(ctx, id, m_reward, v_reward, f_reward, job_count)
    }
    pub fn accept_job(ctx: Context<AcceptJob>, task_id: u64, job_id:u64) -> Result<()> {
        instructions::accept_job::accept_job(ctx, task_id, job_id)
    }
}


