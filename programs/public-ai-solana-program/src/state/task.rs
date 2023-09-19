use anchor_lang::prelude::*;
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum TaskStatus {
    ONGOING,
    ENDED
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum JobStatus {
    WORKING,
    SUBMITTED,
    ACCEPTED,
    REJECTED
}
#[account]
pub struct Task {
    pub id: u64,
    pub m_reward: u64,
    pub v_reward: u64,
    pub f_reward: u64,
    pub job_count: u64,
    // pub publisher: Pubkey,  //address of task publisher
    // pub status: TaskStatus,
}

#[account]
pub struct Job {
    id: u64,
    marker: Pubkey,
    validator: Pubkey,
    fisher: Pubkey,
    status: JobStatus
}
#[account]
pub struct TaskInfo {
    pub count: u64,
    pub bump: u8,
}