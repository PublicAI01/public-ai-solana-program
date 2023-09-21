import * as anchor from "@coral-xyz/anchor";
import {Program, web3} from "@coral-xyz/anchor";
import { PublicKey,Keypair } from '@solana/web3.js'
import { PublicAiSolanaProgram } from "../target/types/public_ai_solana_program";
import { expect,assert } from 'chai'
import { BN } from 'bn.js';
import {
    createMint,
    createAssociatedTokenAccount,
    mintTo,
    TOKEN_PROGRAM_ID, getMint,
} from "@solana/spl-token";
import * as bs58 from "bs58";

describe("public-ai-solana-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.PublicAiSolanaProgram as Program<PublicAiSolanaProgram>;
  const pg = program.provider as anchor.AnchorProvider;
  const requestAirdrop = async (mint_keypair:anchor.web3.Keypair) => {
      const signature = await pg.connection.requestAirdrop(
          mint_keypair.publicKey,
          web3.LAMPORTS_PER_SOL
      );
      const { blockhash, lastValidBlockHeight } = await pg.connection.getLatestBlockhash();
      await pg.connection.confirmTransaction({
          blockhash,
          lastValidBlockHeight,
          signature
      });
  }
  it("Is initialized!", async () => {
      const mint_keypair = Keypair.generate();
      const publisher_keypair = Keypair.generate();
      const marker_keypair = Keypair.generate();
      await requestAirdrop(mint_keypair);
      await requestAirdrop(publisher_keypair);
      await requestAirdrop(marker_keypair);
      expect(await pg.connection.getBalance(mint_keypair.publicKey)).to.eq(web3.LAMPORTS_PER_SOL);
      expect(await pg.connection.getBalance(publisher_keypair.publicKey)).to.eq(web3.LAMPORTS_PER_SOL);
      expect(await pg.connection.getBalance(marker_keypair.publicKey)).to.eq(web3.LAMPORTS_PER_SOL);
      const mint = await createMint(
          pg.connection,
          mint_keypair,
          mint_keypair.publicKey,
          null,
          0
      );
      const publisher_ata = await createAssociatedTokenAccount(
          pg.connection,
          publisher_keypair,
          mint,
          publisher_keypair.publicKey
      );
      const mintAmount = 1000;
      await mintTo(
          pg.connection,
          mint_keypair,
          mint,
          publisher_ata,
          mint_keypair.publicKey,
          mintAmount
      );
      const publisher_ata_balance = await pg.connection.getTokenAccountBalance(publisher_ata);
      expect(publisher_ata_balance.value.uiAmount).to.eq(mintAmount);
      const [taskInfoPDA] = await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode('task_info')
        ],
        program.programId
      )
      const [escrowWalletPDA] = await PublicKey.findProgramAddress(
          [
              anchor.utils.bytes.utf8.encode('escrow_wallet')
          ],
          program.programId
      )
      await program.methods.initialize(new BN('20')).accounts({
          creator: pg.wallet.publicKey,
          taskInfo:  taskInfoPDA,
          rewardToken: mint,
          escrowWallet: escrowWalletPDA,
      }).rpc();
      assert((await program.account.taskInfo.fetch(taskInfoPDA)).count.eq(
        new BN('0'))
     )
     assert.ok(mint.equals((await program.account.taskInfo.fetch(taskInfoPDA)).rewardToken));
    const [taskPDA] = await PublicKey.findProgramAddress(
        [
          anchor.utils.bytes.utf8.encode('task-0'),
        ],
        program.programId
    )
    await program.methods.createTask(new BN('1'),new BN('1'),new BN('1'),new BN('1'),new BN('1')).accounts({
        publisher: publisher_keypair.publicKey,
        taskInfo:  taskInfoPDA,
        task: taskPDA,
        publisherAta: publisher_ata,
        escrowWallet: escrowWalletPDA,
    }).signers([publisher_keypair]).rpc();
      const xxxx = await pg.connection.getTokenAccountBalance(escrowWalletPDA);
      console.log(xxxx)
    // assert((await program.account.task.fetch(taskPDA)).id.eq(
    //     new BN('1'))
    // )
    //   assert.ok(pg.wallet.publicKey.equals((await program.account.task.fetch(taskPDA)).publisher));
    //   assert((await program.account.taskInfo.fetch(taskInfoPDA)).count.eq(
    //       new BN('1'))
    //   )
    //   const    [taskPDA1] = await PublicKey.findProgramAddress(
    //       [
    //           anchor.utils.bytes.utf8.encode('task-1'),
    //       ],
    //       program.programId
    //   )
    //   await program.methods.createTask(new BN('2'),new BN('1'),new BN('1'),new BN('1'),new BN('1')).accounts({
    //       publisher: pg.wallet.publicKey,
    //       taskInfo:  taskInfoPDA,
    //       task: taskPDA1,
    //   }).rpc();
    //   assert((await program.account.task.fetch(taskPDA1)).id.eq(
    //       new BN('2'))
    //   )
    //   assert((await program.account.taskInfo.fetch(taskInfoPDA)).count.eq(
    //       new BN('2'))
    //   )
  });

    // it("transfer token", async () => {
    //     // Generate keypairs for the new accounts
    //     const fromKp = Keypair.generate();
    //     const signature = await pg.connection.requestAirdrop(
    //         fromKp.publicKey,
    //         web3.LAMPORTS_PER_SOL
    //     );
    //     const { blockhash, lastValidBlockHeight } = await pg.connection.getLatestBlockhash();
    //     await pg.connection.confirmTransaction({
    //         blockhash,
    //         lastValidBlockHeight,
    //         signature
    //     });
    //     const toKp = Keypair.generate();
    //
    //     // Create a new mint and initialize it
    //     const mintKp = Keypair.generate();
    //     const mint = await createMint(
    //         pg.connection,
    //         fromKp,
    //         fromKp.publicKey,
    //         null,
    //         0
    //     );
    //     console.log(`mint: ${mint.toBase58()}`);
    //     let mintAccount = await getMint(pg.connection, mint);
    //
    //     console.log(mintAccount);
    //     // Create associated token accounts for the new accounts
    //     const fromAta = await createAssociatedTokenAccount(
    //         pg.connection,
    //         fromKp,
    //         mint,
    //         fromKp.publicKey
    //     );
    //     const toAta = await createAssociatedTokenAccount(
    //         pg.connection,
    //         fromKp,
    //         mint,
    //         toKp.publicKey
    //     );
    //     // Mint tokens to the 'from' associated token account
    //     const mintAmount = 1000;
    //     await mintTo(
    //         pg.connection,
    //         fromKp,
    //         mint,
    //         fromAta,
    //         fromKp.publicKey,
    //         mintAmount
    //     );
    //
    //     // Send transaction
    //     const transferAmount = new BN(500);
    //     const txHash = await program.methods
    //         .acceptJob(transferAmount)
    //         .accounts({
    //             from: fromKp.publicKey,
    //             fromAta: fromAta,
    //             toAta: toAta,
    //             tokenProgram: TOKEN_PROGRAM_ID,
    //         })
    //         .signers([fromKp, fromKp])
    //         .rpc();
    //     const toTokenAccount = await pg.connection.getTokenAccountBalance(toAta);
    //     assert.strictEqual(
    //         toTokenAccount.value.uiAmount,
    //         transferAmount.toNumber(),
    //         "The 'to' token account should have the transferred tokens"
    //     );
    // });
});
