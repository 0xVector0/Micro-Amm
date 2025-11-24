import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { MicroAmm } from "../target/types/micro_amm";
import { 
  createMint, 
  createAccount, 
  mintTo, 
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { 
  Keypair, 
  SystemProgram, 
  PublicKey,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { expect } from "chai";

describe("micro-amm", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.microAmm as Program<MicroAmm>;
  const connection = provider.connection;
  const wallet = provider.wallet as anchor.Wallet;

  // Test accounts
  let tokenXMint: PublicKey;
  let tokenYMint: PublicKey;
  let userTokenXAccount: PublicKey;
  let userTokenYAccount: PublicKey;
  let poolPda: PublicKey;
  let poolBump: number;
  let tokenXVault: Keypair;
  let tokenYVault: Keypair;

  // Constants
  const INITIAL_TOKEN_AMOUNT = 1000 * 1_000_000; // 1000 tokens with 6 decimals
  const LIQUIDITY_AMOUNT_X = 100 * 1_000_000;   // 100 tokens
  const LIQUIDITY_AMOUNT_Y = 200 * 1_000_000;   // 200 tokens
  const SWAP_AMOUNT = 10 * 1_000_000;           // 10 tokens
  const FEE_BPS = 300; // 3% fee

  before(async () => {
    console.log("------- Setting up test environment -------");

    // Airdrop SOL to wallet for transaction fees
    const signature = await connection.requestAirdrop(
      wallet.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);

    // Create token mints
    tokenXMint = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      6 // 6 decimals
    );

    tokenYMint = await createMint(
      connection,
      wallet.payer,
      wallet.publicKey,
      null,
      6 // 6 decimals
    );

    // Create user token accounts
    userTokenXAccount = await createAccount(
      connection,
      wallet.payer,
      tokenXMint,
      wallet.publicKey
    );

    userTokenYAccount = await createAccount(
      connection,
      wallet.payer,
      tokenYMint,
      wallet.publicKey
    );

    // Mint tokens to user accounts
    await mintTo(
      connection,
      wallet.payer,
      tokenXMint,
      userTokenXAccount,
      wallet.payer,
      INITIAL_TOKEN_AMOUNT
    );

    await mintTo(
      connection,
      wallet.payer,
      tokenYMint,
      userTokenYAccount,
      wallet.payer,
      INITIAL_TOKEN_AMOUNT
    );

    // Generate vault keypairs
    tokenXVault = Keypair.generate();
    tokenYVault = Keypair.generate();

    // Find pool PDA
    [poolPda, poolBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        tokenXMint.toBuffer(),
        tokenYMint.toBuffer()
      ],
      program.programId
    );

    console.log("Pool PDA:", poolPda.toString());
    console.log("------- Setup complete -------\n");
  });

  describe("Pool Initialization", () => {
    it("Should initialize AMM pool successfully", async () => {
      console.log("------- Initializing AMM pool -------");

      const tx = await program.methods
        .initialize(FEE_BPS)
        .accountsPartial({
          tokenXMint: tokenXMint,
          tokenYMint: tokenYMint,
          tokenXVault: tokenXVault.publicKey,
          tokenYVault: tokenYVault.publicKey,
          authority: wallet.publicKey,
        })
        .signers([tokenXVault, tokenYVault])
        .rpc();

      console.log("Transaction:", tx);

      // Verify pool was created correctly
      const poolAccount = await program.account.pool.fetch(poolPda);
      
      expect(poolAccount.tokenXMint.toString()).to.equal(tokenXMint.toString());
      expect(poolAccount.tokenYMint.toString()).to.equal(tokenYMint.toString());
      expect(poolAccount.feeBps).to.equal(FEE_BPS);
      expect(poolAccount.tokenXBalance.toNumber()).to.equal(0);
      expect(poolAccount.tokenYBalance.toNumber()).to.equal(0);
      
      console.log("✅ Pool initialized with", poolAccount.feeBps, "bps fee\n");
    });
  });

  describe("Liquidity Management", () => {
    it("Should add liquidity to pool successfully", async () => {
      console.log("------- Adding liquidity to pool -------");

      const tx = await program.methods
        .addLiquidity(new BN(LIQUIDITY_AMOUNT_X), new BN(LIQUIDITY_AMOUNT_Y))
        .accountsPartial({
          pool: poolPda,
          tokenXVault: tokenXVault.publicKey,
          tokenYVault: tokenYVault.publicKey,
          userTokenX: userTokenXAccount,
          userTokenY: userTokenYAccount,
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Transaction:", tx);

      // Verify liquidity was added
      const poolAccount = await program.account.pool.fetch(poolPda);
      expect(poolAccount.tokenXBalance.toNumber()).to.equal(LIQUIDITY_AMOUNT_X);
      expect(poolAccount.tokenYBalance.toNumber()).to.equal(LIQUIDITY_AMOUNT_Y);

      // Check vault balances
      const vaultXAccount = await getAccount(connection, tokenXVault.publicKey);
      const vaultYAccount = await getAccount(connection, tokenYVault.publicKey);
      expect(Number(vaultXAccount.amount)).to.equal(LIQUIDITY_AMOUNT_X);
      expect(Number(vaultYAccount.amount)).to.equal(LIQUIDITY_AMOUNT_Y);

      console.log("✅ Added liquidity:", LIQUIDITY_AMOUNT_X / 1_000_000, "X +", LIQUIDITY_AMOUNT_Y / 1_000_000, "Y");
      console.log("Exchange Rate (Y/X):", poolAccount.tokenYBalance.toNumber() / poolAccount.tokenXBalance.toNumber() + "\n");
    });
  });

  describe("Token Swapping", () => {
    it("Should swap Token X for Token Y successfully", async () => {
      console.log("------- Performing token swap -------");

      // Get balances before swap
      const userTokenXBefore = await getAccount(connection, userTokenXAccount);
      const userTokenYBefore = await getAccount(connection, userTokenYAccount);
      const poolBefore = await program.account.pool.fetch(poolPda);

      // Calculate expected output using constant product formula
      const reserveX = poolBefore.tokenXBalance.toNumber();
      const reserveY = poolBefore.tokenYBalance.toNumber();
      const expectedOutputY = reserveY - (reserveX * reserveY) / (reserveX + SWAP_AMOUNT);

      console.log("Swapping", SWAP_AMOUNT / 1_000_000, "X for ~", (expectedOutputY / 1_000_000).toFixed(2), "Y");

      const tx = await program.methods
        .swap(new BN(SWAP_AMOUNT))
        .accountsPartial({
          pool: poolPda,
          tokenXVault: tokenXVault.publicKey,
          tokenYVault: tokenYVault.publicKey,
          userTokenX: userTokenXAccount,
          userTokenY: userTokenYAccount,
          user: wallet.publicKey,
        })
        .rpc();

      console.log("Transaction:", tx);

      // Get balances after swap
      const userTokenXAfter = await getAccount(connection, userTokenXAccount);
      const userTokenYAfter = await getAccount(connection, userTokenYAccount);
      const poolAfter = await program.account.pool.fetch(poolPda);

      console.log("📊 After swap:");
      console.log("   User Token X:", userTokenXAfter.amount.toString());
      console.log("   User Token Y:", userTokenYAfter.amount.toString());
      console.log("   Pool X Balance:", poolAfter.tokenXBalance.toString());
      console.log("   Pool Y Balance:", poolAfter.tokenYBalance.toString());

      // Verify the swap occurred correctly
      const actualOutputY = Number(userTokenYAfter.amount) - Number(userTokenYBefore.amount);

      expect(Number(userTokenXAfter.amount)).to.equal(Number(userTokenXBefore.amount) - SWAP_AMOUNT);
      expect(Number(userTokenYAfter.amount)).to.be.greaterThan(Number(userTokenYBefore.amount));

      console.log("✅ Received", (actualOutputY / 1_000_000).toFixed(2), "Y tokens");
      console.log("New rate (Y/X):", (poolAfter.tokenYBalance.toNumber() / poolAfter.tokenXBalance.toNumber()).toFixed(3) + "\n");
    });
  });

  describe("Pool State Verification", () => {
    it("Should display complete pool information", async () => {
      console.log("------- Final Pool State -------");
      
      const poolAccount = await program.account.pool.fetch(poolPda);
      const vaultXAccount = await getAccount(connection, tokenXVault.publicKey);
      const vaultYAccount = await getAccount(connection, tokenYVault.publicKey);
      
      console.log("Pool Balance X:", (poolAccount.tokenXBalance.toNumber() / 1_000_000).toFixed(2));
      console.log("Pool Balance Y:", (poolAccount.tokenYBalance.toNumber() / 1_000_000).toFixed(2));
      console.log("Exchange Rate (Y/X):", (poolAccount.tokenYBalance.toNumber() / poolAccount.tokenXBalance.toNumber()).toFixed(6));
      console.log("Fee Rate:", poolAccount.feeBps / 100 + "%");

      // Verify pool state consistency
      expect(poolAccount.tokenXBalance.toNumber()).to.equal(Number(vaultXAccount.amount));
      expect(poolAccount.tokenYBalance.toNumber()).to.equal(Number(vaultYAccount.amount));
      console.log("✅ Pool state is consistent!");
    });
  });
});
