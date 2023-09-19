import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from '@solana/web3.js'
import { PublicAiSolanaProgram } from "../target/types/public_ai_solana_program";
import { expect,assert } from 'chai'
import { BN } from 'bn.js';

describe("public-ai-solana-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PublicAiSolanaProgram as Program<PublicAiSolanaProgram>;
  const pg = program.provider as anchor.AnchorProvider;

  it("Is initialized!", async () => {
    const [taskInfoPDA] = await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode('task_info')
        ],
        program.programId
    )
      await program.methods.initialize().accounts({
          creator: pg.wallet.publicKey,
          taskInfo:  taskInfoPDA,
      }).rpc();
    const [taskPDA] = await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode('task-0'),
        ],
        program.programId
    )
    await program.methods.createTask(new BN('1'),new BN('1'),new BN('1'),new BN('1'),new BN('1')).accounts({
        publisher: pg.wallet.publicKey,
        taskInfo:  taskInfoPDA,
        task: taskPDA,
    }).rpc();
    assert((await program.account.task.fetch(taskPDA)).id.eq(
        new BN('1'))
    )
      assert((await program.account.taskInfo.fetch(taskInfoPDA)).count.eq(
          new BN('1'))
      )
      const    [taskPDA1] = await PublicKey.findProgramAddress(
          [
              anchor.utils.bytes.utf8.encode('task-1'),
          ],
          program.programId
      )
      await program.methods.createTask(new BN('2'),new BN('1'),new BN('1'),new BN('1'),new BN('1')).accounts({
          publisher: pg.wallet.publicKey,
          taskInfo:  taskInfoPDA,
          task: taskPDA1,
      }).rpc();
      assert((await program.account.task.fetch(taskPDA1)).id.eq(
          new BN('2'))
      )
      assert((await program.account.taskInfo.fetch(taskInfoPDA)).count.eq(
          new BN('2'))
      )
  });
});
