import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const SOL = LAMPORTS_PER_SOL; // 1 SOL = 10^9 lamports
const PRECISION = 9; // 9 decimals for lamports
const DEFAULT_RECENT_BLOCKHASH_COMMITMENT = "finalized";

/**
 * Convert a SOL value to lamports (the smallest unit of SOL)
 *
 * @param sol float  SOL value
 * @returns number Lamport value
 */
const toLamports = (sol: number): number => {
  return Math.round(sol * SOL); 
};

/**
 * Convert lamports to SOL
 *
 * @param lamports number Lamport value
 * @returns number SOL value
 */
const toSOL = (lamports: number): number => {
  return lamports / SOL;
};

/**
 * Format lamports to a fixed number of decimals (default 9 for full precision)
 *
 * @param lamports number Lamport value
 * @param decimals number (optional) Number of decimal places to show
 * @returns string Formatted SOL value
 */
const toFixed = (lamports: number, decimals: number = 9): string => {
  return (lamports / SOL).toFixed(decimals);
};

/**
 * Check whether a Solana address is valid
 *
 * @param address string  Solana wallet address
 * @returns boolean  true if valid, false otherwise
 */
const isValidAddress = (address: string): boolean => {
  try {
    new PublicKey(address); // Attempt to create a PublicKey object
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Estimate transaction fees using a Solana connection
 *
 * @param connection Connection  The established Solana connection
 * @param transaction Transaction  The transaction to estimate fees for
 * @returns Promise<number>  Estimated fee in lamports
 */
async function estimateTransactionFees(
  connection,
  transaction,
  commitment = DEFAULT_RECENT_BLOCKHASH_COMMITMENT
): Promise<number> {
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash(commitment)
  ).blockhash;
  transaction.feePayer = transaction.feePayer || transaction.keys[0].pubkey;
  return transaction.getEstimatedFee(connection);
}

const SolanaUtil = {
  toLamports,
  toSOL,
  isValidAddress,
  toFixed,
  estimateTransactionFees,
};

export default SolanaUtil;