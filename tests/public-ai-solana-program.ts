import * as anchor from "@coral-xyz/anchor";
import {Program, web3} from "@coral-xyz/anchor";
import { PublicKey,Keypair, SystemProgram } from '@solana/web3.js'
import { PublicAiSolanaProgram } from "../target/types/public_ai_solana_program";
import { expect,assert } from 'chai'
import { BN } from 'bn.js';
import {
    createMint,
    createAssociatedTokenAccount,
    mintTo,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID, getMint
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
  const transferToAny = async (recipientPublicKey:anchor.web3.PublicKey) => {
      const senderPublicKey = pg.wallet.publicKey;
      const amount = web3.LAMPORTS_PER_SOL;

      const transaction = new anchor.web3.Transaction().add(
          SystemProgram.transfer({
              fromPubkey: senderPublicKey,
              toPubkey: recipientPublicKey,
              lamports: amount,
          })
      );

      const signature = await pg.sendAndConfirm(transaction);

      console.log("Transfer successful, transaction signature:", signature);
  }

  it("All test", async () => {
      const mint_keypair = Keypair.generate();
      const publisher_keypair = Keypair.generate();
      const marker_keypair = Keypair.generate();
      const validator_keypair = Keypair.generate();
      const fisher_keypair = Keypair.generate();
      // await requestAirdrop(mint_keypair);
      // await requestAirdrop(publisher_keypair);
      // await requestAirdrop(marker_keypair);
      // await requestAirdrop(validator_keypair);
      // await requestAirdrop(fisher_keypair);
      await transferToAny(mint_keypair.publicKey);
      await transferToAny(publisher_keypair.publicKey);
      await transferToAny(marker_keypair.publicKey);
      await transferToAny(validator_keypair.publicKey);
      await transferToAny(fisher_keypair.publicKey);
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
      const cal_publisher_ata = await getAssociatedTokenAddress(
          mint,
          publisher_keypair.publicKey,
      );
      assert.ok(publisher_ata.equals(cal_publisher_ata));
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
      expect((await pg.connection.getTokenAccountBalance(publisher_ata)).value.uiAmount).to.eq(997);
      expect((await pg.connection.getTokenAccountBalance(escrowWalletPDA)).value.uiAmount).to.eq(3);
      const marker_ata = await createAssociatedTokenAccount(
          pg.connection,
          marker_keypair,
          mint,
          marker_keypair.publicKey
      );
      const validator_ata = await createAssociatedTokenAccount(
          pg.connection,
          validator_keypair,
          mint,
          validator_keypair.publicKey
      );
      const fisher_ata = await createAssociatedTokenAccount(
          pg.connection,
          fisher_keypair,
          mint,
          fisher_keypair.publicKey
      );
      const [jobPDA] = await PublicKey.findProgramAddress(
          [
              anchor.utils.bytes.utf8.encode('job-1'),
          ],
          program.programId
      )
      // console.log(await pg.connection.getAccountInfo(escrowWalletPDA));
      await program.methods.acceptJob(new BN('0'),new BN('1')).accounts({
          publisher: publisher_keypair.publicKey,
          taskInfo:taskInfoPDA,
          task:taskPDA,
          job:jobPDA,
          escrowWallet: escrowWalletPDA,
          markerAta: marker_ata,
          validatorAta:validator_ata,
          fisherAta: fisher_ata
      }).signers([publisher_keypair]).rpc();
      expect((await pg.connection.getTokenAccountBalance(marker_ata)).value.uiAmount).to.eq(1);
      expect((await pg.connection.getTokenAccountBalance(validator_ata)).value.uiAmount).to.eq(1);
      expect((await pg.connection.getTokenAccountBalance(fisher_ata)).value.uiAmount).to.eq(1);
  });
});
