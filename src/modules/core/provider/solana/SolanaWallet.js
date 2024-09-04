import 'react-native-get-random-values';
import {Logs} from '@modules/log/logs';
import solanaWeb3, { Keypair, ComputeBudgetProgram, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction} from '@solana/web3.js';
import {derivePath} from 'ed25519-hd-key';
import bs58 from 'bs58';
import {SolanaProvider} from '@modules/core/provider/solana/SolanaProvider'; // Assuming you have this
import {Wallet} from "ethers";
import { mnemonicToSeedSync} from 'bip39';
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createTransferInstruction } from "@solana/spl-token";
import {configProperties} from "@modules/core/config/config.properties";

export const SOLANA_BIP39_PATH = "m/44'/501'/0'/0'";

export class SolanaWallet implements Wallet{
    provider: SolanaProvider;
    keypair: Keypair;

    constructor(provider: SolanaProvider) {
        this.provider = provider;
    }

    async mnemonicToSeed(mnemonic: string): Promise<Buffer> {
        // Solana uses the "m/44'/501'/0'/0'" derivation path (hardened)
        const path = "m/44'/501'/0'/0'";
        const seed = mnemonicToSeedSync(mnemonic);

        return derivePath(path, seed.toString('hex')).key;
    }

    async fromMnemonic(data, mnemonic, index=0): Promise<Object> {
        try {
            const seed = await this.mnemonicToSeed(mnemonic);
            const derivedSeed = derivePath(`m/44'/501'/${index}'/0'`, seed.toString('hex')).key;
            this.keypair = Keypair.fromSeed(derivedSeed);
            const pubKey = this.keypair.publicKey.toString();
            return {
                success: true,
                data: {
                    ...data,
                    walletAddress: pubKey,
                    privateKey: bs58.encode(this.keypair.secretKey), // Encode to Base58
                },
            };
        } catch (e) {
            Logs.info('SolanaWallet: fromMnemonic', e);
            // ... (Error handling)
        }
    }

    async fromPrivateKey(data, privateKey): Promise<Object> {
        try {
            this.keypair = Keypair.fromSecretKey(bs58.decode(privateKey)); // Decode from Base58
            return {
                success: true,
                data: {
                    ...data,
                    walletAddress: this.keypair.publicKey.toString(),
                },
            };
        } catch (e) {
            Logs.info('SolanaWallet: fromPrivateKey', e);
            // ... (Error handling)
        }
    }
    async sendTransaction({to, value, feePayer}): Promise<Object> {
        const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports:5000,
        });

        const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
            units: 10000,
        });
        try {
            const transaction = new Transaction().add(
                computePriceIx,
                computeLimitIx,
                SystemProgram.transfer({
                    fromPubkey: this.keypair.publicKey,
                    toPubkey: new PublicKey(to),
                    lamports: value * LAMPORTS_PER_SOL, // Value should be in lamports
                })
            );

            // Set fee payer if provided
            if (feePayer) {
                transaction.feePayer = new PublicKey(feePayer);
            }

            const txid = await solanaWeb3.sendAndConfirmTransaction(this.provider.connection, transaction, [this.keypair])

            Logs.info('SolanaWallet: sendTransaction successful', { txid }); // Log success

            return {
                success: true,
                data: { txid },
            };

        } catch (e) {
            Logs.error('SolanaWallet: sendTransaction error', e); // Log error with details
            // ... (Error handling)
            return {
                success: false,
                data: null
            }
        }
    }


    convertToBigInt(amount, decimals) {
        // Ensure the amount is a number and decimals is a non-negative integer
        if (!Number.isInteger(decimals) || decimals < 0) {
            throw new Error('Invalid input: amount must be a number and decimals must be a non-negative integer.');
        }

        // Multiply the amount by 10^decimals and convert to BigInt
        const factor = 10 ** decimals;
        return BigInt(Math.round(amount * factor));
    }

    async sendSplTransaction(wallet, {to, value, mintAddress, decimals, fee}) {
        const recipientPubKey = new PublicKey(to);
        const mintPubKey = new PublicKey(mintAddress);
        const bigValue = this.convertToBigInt(value, decimals);
        const recentBlockhash = await this.provider.connection.getLatestBlockhash();
        let currentBlockheight = await this.provider.connection.getBlockHeight();
        const { blockhash } = await this.provider.connection.getLatestBlockhash();
        const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports:250000,
        });

        const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
            units: 40000,
        });
        const MAX_RETRIES = 3;
        let retryCount = 0;

        while (retryCount < MAX_RETRIES) {
            try {
                const senderATA = await getAssociatedTokenAddress(mintPubKey, this.keypair.publicKey);
                const recipientATA = await getAssociatedTokenAddress(mintPubKey, recipientPubKey);

                console.log('Sender pubkey:', this.keypair.publicKey.toString());
                console.log('Sender ATA:', senderATA.toString());
                console.log('Mint address:', mintAddress);

                let senderAccountInfo =  await this.provider.connection.getAccountInfo(senderATA);

                if (!senderAccountInfo) {
                    console.log('Sender ATA not found. Attempting to create...');
                    const transaction = new Transaction().add(
                        createAssociatedTokenAccountInstruction(
                            this.keypair.publicKey,
                            senderATA,
                            this.keypair.publicKey,
                            mintPubKey
                        )
                    );
                    await solanaWeb3.sendAndConfirmTransaction(this.provider.connection, transaction, [this.keypair]);
                    console.log('Sender ATA created successfully');
                }

                const senderBalance = await this.provider.connection.getTokenAccountBalance(senderATA);
                console.log('Sender token balance:', senderBalance.value.uiAmount);

                if (senderBalance.value.uiAmount < value) {
                    throw new Error(`Insufficient balance. Current balance: ${senderBalance.value.uiAmount}`);
                }

                const transaction = new Transaction({
                    recentBlockhash: recentBlockhash.blockhash,
                    feePayer: this.keypair.publicKey
                });
                transaction.recentBlockhash = blockhash;
                transaction.feePayer = this.keypair.publicKey;

                const recipientAccountInfo = await this.provider.connection.getAccountInfo(recipientATA);

                if (!recipientAccountInfo) {
                    transaction.add(
                        createAssociatedTokenAccountInstruction(
                            this.keypair.publicKey,
                            recipientATA,
                            recipientPubKey,
                            mintPubKey
                        )
                    );
                }

                transaction.add(
                    computePriceIx,
                    computeLimitIx,
                    createTransferInstruction(
                        senderATA,
                        recipientATA,
                        this.keypair.publicKey,
                        bigValue,
                        [],
                        TOKEN_PROGRAM_ID,
                    )
                );

                transaction.lastValidBlockHeight = currentBlockheight + 150;

                const txid = await solanaWeb3.sendAndConfirmTransaction(
                    this.provider.connection,
                    transaction,
                    [this.keypair],
                    {
                        commitment: "confirmed",
                        skipPreflight: true
                    }
                );

                console.log('Transaction successful. Txid:', txid);
                return { success: true, data: { txid } };
            } catch (error) {
                if (error.message.includes('block height')) {
                    retryCount++;
                    const MAX_RETRY_DELAY = 30000;
                    const delay = Math.min(2 ** retryCount * 1000, MAX_RETRY_DELAY);
                    console.log(`Transaction failed, retrying in ${delay / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    return { success: false, data: null, error: error.message };
                }
            }
        }

        return { success: false, data: null, error: 'Transaction retries exhausted.' };
    }

    // async sendSplTransaction2(wallet, {to, value, mintAddress, decimals, fee}) {
    //     const recipientPubKey = new PublicKey(to);
    //     const mintPubKey = new PublicKey(mintAddress);
    //     const bigValue = this.convertToBigInt(value, decimals);
    //     const recentBlockhash = await this.provider.connection.getLatestBlockhash();
    //     let currentBlockheight = await this.provider.connection.getBlockHeight();
    //     const { blockhash } = await this.provider.connection.getLatestBlockhash();
    //     const computePriceIx = ComputeBudgetProgram.setComputeUnitPrice({
    //         microLamports: 5000,
    //     });
    //
    //     const computeLimitIx = ComputeBudgetProgram.setComputeUnitLimit({
    //         units: 20000,
    //     });
    //     const MAX_RETRIES = 3;
    //     let retryCount = 0;
    //
    //     while (retryCount < MAX_RETRIES) {
    //         try {
    //             const senderATA = await getAssociatedTokenAddress(mintPubKey, this.keypair.publicKey);
    //             const recipientATA = await getAssociatedTokenAddress(mintPubKey, recipientPubKey);
    //
    //             console.log('Sender pubkey:', this.keypair.publicKey.toString());
    //             console.log('Sender ATA:', senderATA.toString());
    //             console.log('Mint address:', mintAddress);
    //
    //             let senderAccountInfo =  await this.provider.connection.getAccountInfo(senderATA);
    //
    //             if (!senderAccountInfo) {
    //                 console.log('Sender ATA not found. Attempting to create...');
    //                 const transaction = new Transaction().add(
    //                     createAssociatedTokenAccountInstruction(
    //                         this.keypair.publicKey,
    //                         senderATA,
    //                         this.keypair.publicKey,
    //                         mintPubKey
    //                     )
    //                 );
    //                 await solanaWeb3.sendAndConfirmTransaction(this.provider.connection, transaction, [this.keypair]);
    //                 console.log('Sender ATA created successfully');
    //             }
    //
    //             const senderBalance = await this.provider.connection.getTokenAccountBalance(senderATA);
    //             console.log('Sender token balance:', senderBalance.value.uiAmount);
    //
    //             if (senderBalance.value.uiAmount < value) {
    //                 throw new Error(`Insufficient balance. Current balance: ${senderBalance.value.uiAmount}`);
    //             }
    //
    //             const transaction = new Transaction({
    //                 recentBlockhash: recentBlockhash.blockhash,
    //                 feePayer: this.keypair.publicKey
    //             });
    //             transaction.recentBlockhash = blockhash;
    //             transaction.feePayer = this.keypair.publicKey;
    //
    //             const recipientAccountInfo = await this.provider.connection.getAccountInfo(recipientATA);
    //
    //             if (!recipientAccountInfo) {
    //                 transaction.add(
    //                     createAssociatedTokenAccountInstruction(
    //                         this.keypair.publicKey,
    //                         recipientATA,
    //                         recipientPubKey,
    //                         mintPubKey
    //                     )
    //                 );
    //             }
    //
    //             transaction.add(
    //                 computePriceIx,
    //                 computeLimitIx,
    //                 createTransferInstruction(
    //                     senderATA,
    //                     recipientATA,
    //                     this.keypair.publicKey,
    //                     bigValue,
    //                     [],
    //                     TOKEN_PROGRAM_ID,
    //                 )
    //             );
    //
    //             transaction.lastValidBlockHeight = currentBlockheight + 150;
    //
    //             const txid = await solanaWeb3.sendAndConfirmTransaction(
    //                 this.provider.connection,
    //                 transaction,
    //                 [this.keypair],
    //                 {
    //                     commitment: "confirmed",
    //                     skipPreflight: true
    //                 }
    //             );
    //
    //             console.log('Transaction successful. Txid:', txid);
    //             return { success: true, data: { txid } };
    //         } catch (error) {
    //             if (error.message.includes('block height')) {
    //                 retryCount++;
    //                 const MAX_RETRY_DELAY = 30000;
    //                 const delay = Math.min(2 ** retryCount * 1000, MAX_RETRY_DELAY);
    //                 console.log(`Transaction failed, retrying in ${delay / 1000} seconds...`);
    //                 await new Promise(resolve => setTimeout(resolve, delay));
    //             } else {
    //                 return { success: false, data: null, error: error.message };
    //             }
    //         }
    //     }
    //
    //     return { success: false, data: null, error: 'Transaction retries exhausted.' };
    // }
    async getTransactions(wallet, limit = 20, before = null): Promise<Object> {
        try {
            // const signatures = await this.provider.connection.getSignaturesForAddress(
            //     new PublicKey(wallet.walletAddress),
            //     { limit, before }
            // );
            //
            // const transactions = await this.provider.connection.getParsedTransactions(signatures.map(s => s.signature));

            return {
                success: true,
                data: [],
                // data: transactions.filter(tx => tx !== null).map(tx => { // Filter out null transactions (might occur if not yet confirmed)
                //     return {
                //         signature: tx.transaction.signatures[0],
                //         blockTime: tx.blockTime,
                //         from: tx.transaction.message.accountKeys[0].pubkey, // Assuming simple transfer
                //         to: tx.transaction.message.instructions[0]?.parsed.info.destination,
                //         value: tx.transaction.message.instructions[0]?.parsed.info.lamports,
                //         fee: tx.meta.fee,
                //         status: tx.meta.err ? 'Failed' : 'Success',
                //         // ... (Add other relevant fields as needed)
                //     };
                // }),
            };
        } catch (e) {
            Logs.info('SolanaWallet: getTransactions', e);
            return {
                success: false,
                data: [],
            };
        }
    }
}
