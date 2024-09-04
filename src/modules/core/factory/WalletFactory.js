import 'react-native-get-random-values';
import '@ethersproject/shims';
import {BigNumber, ethers, utils} from 'ethers';
import {ProviderFactory} from '@modules/core/factory/ProviderFactory';
import {BitcoinWallet} from '@modules/core/provider/bitcoin/BitcoinWallet';
import {EthWallet} from '@modules/core/provider/eth/EthWallet';
import {configProperties} from '@modules/core/config/config.properties';
import axios from 'axios';
import BitcoinUtil from '@modules/core/provider/bitcoin/BitcoinUtil';
import {
    ASSET_TYPE_COIN,
    ASSET_TYPE_TOKEN,
} from '@modules/core/constant/constant';
import _ from 'lodash';
import {TronWallet} from '@modules/core/provider/tron/TronWallet';
import {SolanaWallet} from "@modules/core/provider/solana/SolanaWallet";
import TronWeb from 'tronweb';
import {Logs} from '@modules/core/log/logs';
import {StorageService} from '@modules/core/storage/StorageService';
import {entropyToMnemonic, formatEther, formatUnits} from 'ethers/lib/utils';
import {encode} from "bs58";
import {Connection, LAMPORTS_PER_SOL, PublicKey, ComputeBudgetProgram} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import * as solanaWeb3 from "@solana/web3.js";
import {SolanaProvider} from "@modules/core/provider/solana/SolanaProvider";
import moment from "moment";
export class WalletFactory {
    static wallets = {};

    static async fromMnemonic(coins, mnemonic) {
        await WalletFactory.destroy();
        const all = [];
        try {
            for (let i = 0; i < coins.length; i++) {
                const coin = coins[i];
                const provider = await ProviderFactory.getProvider(coin.chain);
                const startTime = performance.now();
                // if (coin.chain === 'BTC') {
                //     const btcWallet = new BitcoinWallet(provider);
                //     const {success, data} = await btcWallet.fromMnemonic(
                //         coin,
                //         mnemonic || coin.mnemonic,
                //     );
                //     if (success) {
                //         this.wallets[coin.chain] = btcWallet;
                //         all.push({
                //             ...data,
                //             mnemonic,
                //             privateKey: data.privateKey,
                //         });
                //     }
                // } else
                    if (
                    coin.chain === 'ETH' ||
                    coin.chain === 'BSC' ||
                    coin.chain === 'POLYGON'
                ) {
                    let ethWallet =
                        this.wallets.ETH ||
                        this.wallets.BSC ||
                        this.wallets.POLYGON;

                    if (!ethWallet) {
                        ethWallet = new EthWallet(provider);
                        const {success, data} = await ethWallet.fromMnemonic(
                            coin,
                            mnemonic || coin.mnemonic,
                        );
                        if (success) {
                            ethWallet.setData(data);
                            this.wallets[coin.chain] = ethWallet;
                            all.push({
                                ...data,
                                mnemonic,
                                privateKey: data.privateKey,
                            });
                        }
                    } else {
                        const baseEthWallet = {
                            ...coin,
                            mnemonic,
                            walletAddress: ethWallet.data.walletAddress,
                            privateKey: ethWallet.data.privateKey,
                        };
                        const eth = new EthWallet(provider);
                        eth.data = baseEthWallet;
                        eth.setSigner(ethWallet.signer);
                        if (coin.type === ASSET_TYPE_COIN) {
                            this.wallets[coin.chain] = eth;
                        }
                        all.push(baseEthWallet);
                    }
                } else if (coin.chain === 'TRON') {
                    let tronWallet = this.wallets.TRON;
                    if (!tronWallet) {
                        tronWallet = new TronWallet(provider);
                        const {success, data} = await tronWallet.fromMnemonic(
                            coin,
                            mnemonic || coin.mnemonic,
                        );
                        if (success) {
                            tronWallet.setData(data);
                            this.wallets[coin.chain] = tronWallet;
                            all.push({
                                ...data,
                                mnemonic,
                                privateKey: data.privateKey,
                            });
                        }
                    } else {
                        const baseTronWallet = {
                            ...coin,
                            mnemonic,
                            walletAddress: tronWallet.data.walletAddress,
                            privateKey: tronWallet.data.privateKey,
                        };
                        if (coin.type === ASSET_TYPE_COIN) {
                            this.wallets[coin.chain] = new TronWallet(provider);
                        }
                        all.push(baseTronWallet);
                    }
                }
                else if (coin.chain === 'SOLANA') {
                    let solanaWallet = this.wallets.SOLANA;
                    if (!solanaWallet) {
                        solanaWallet = new SolanaWallet(provider);
                        const { success, data } = await solanaWallet.fromMnemonic(
                            coin,
                            mnemonic || coin.mnemonic
                        );
                        if (success) {
                            this.wallets[coin.chain] = solanaWallet;
                            all.push({
                                ...data,
                                mnemonic,
                                privateKey: data.privateKey, // Ensure it's Base58 encoded
                            });
                        }
                    } else {
                        const baseSolanaWallet = {
                            ...coin,
                            mnemonic,
                            walletAddress: solanaWallet.keypair.publicKey.toString(),
                            privateKey: encode(solanaWallet.keypair.secretKey), // Base58 encode
                        };

                        if (coin.type === ASSET_TYPE_COIN) {
                            this.wallets[coin.chain] = new SolanaWallet(provider);
                        }

                        all.push(baseSolanaWallet);
                    }
                }
                const endTime = performance.now();
                const executionTime = endTime - startTime; // Calculate execution time
            }
            const wallets = _.filter(all, {type: ASSET_TYPE_COIN});
            const tokens = _.filter(all, {type: ASSET_TYPE_TOKEN});
            return {
                all,
                coins: wallets,
                tokens,
            };
        } catch (e) {
            Logs.info('WalletFactory: fromMnemonic', e);
        }
        return {
            all,
            wallets: [],
            tokens: [],
        };
    }

    static async fromPrivateKey(coins, privateKey) {
        const all = [];
        try {
            for (let i = 0; i < coins.length; i++) {
                const coin = coins[i];
                const provider = await ProviderFactory.getProvider(coin.chain);
                if (coin.chain === 'BTC') {
                    const btcWallet = new BitcoinWallet(provider);
                    const {success, data} = await btcWallet.fromPrivateKey(
                        coin,
                        privateKey || coin.privateKey,
                    );
                    if (success) {
                        this.wallets[coin.chain] = btcWallet;
                        all.push(data);
                    }
                } else if (
                    coin.chain === 'ETH' ||
                    coin.chain === 'BSC' ||
                    coin.chain === 'POLYGON'
                ) {
                    let ethWallet =
                        this.wallets.ETH ||
                        this.wallets.BSC ||
                        this.wallets.POLYGON;
                    if (!ethWallet) {
                        ethWallet = new EthWallet(provider);
                        const {success, data} = await ethWallet.fromPrivateKey(
                            coin,
                        );
                        if (success) {
                            ethWallet.setData(data);
                            this.wallets[coin.chain] = ethWallet;
                            all.push(data);
                        }
                    } else {
                        const baseEthWallet = {
                            ...coin,
                            walletAddress: coin.walletAddress,
                            privateKey: coin.privateKey,
                        };
                        const eth = new EthWallet(provider);
                        eth.data = baseEthWallet;
                        eth.setSigner(ethWallet.signer);
                        if (coin.type === ASSET_TYPE_COIN) {
                            this.wallets[coin.chain] = eth;
                        }
                        all.push(baseEthWallet);
                    }
                } else if (coin.chain === 'TRON') {
                    let tronWallet = this.wallets.TRON;
                    if (!tronWallet) {
                        tronWallet = new TronWallet(provider);
                        const {success, data} = await tronWallet.fromPrivateKey(
                            coin,
                        );
                        if (success) {
                            tronWallet.setData(data);
                            this.wallets[coin.chain] = tronWallet;
                            all.push({
                                ...data,
                                privateKey: data.privateKey,
                            });
                        }
                    } else {
                        const baseTronWallet = {
                            ...coin,
                            walletAddress: tronWallet.data.walletAddress,
                            privateKey: tronWallet.data.privateKey,
                        };
                        if (coin.type === ASSET_TYPE_COIN) {
                            this.wallets[coin.chain] = new TronWallet(provider);
                        }
                        all.push(baseTronWallet);
                    }
                }
                else if (coin.chain === 'SOLANA') {
                    let solanaWallet = this.wallets.SOLANA;
                    if (!solanaWallet) {
                        solanaWallet = new SolanaWallet(provider);
                        const {success, data} = await solanaWallet.fromPrivateKey(
                            coin,
                        );
                        if (success) {
                            solanaWallet.setData(data);
                            this.wallets[coin.chain] = SolanaWallet;
                            all.push({
                                ...data,
                                privateKey: data.privateKey,
                            });
                        }
                    } else {
                        const baseSolanaWallet = {
                            ...coin,
                            walletAddress: solanaWallet.data.walletAddress,
                            privateKey: solanaWallet.data.privateKey,
                        };
                        if (coin.type === ASSET_TYPE_COIN) {
                            this.wallets[coin.chain] = new SolanaWallet(provider);
                        }
                        all.push(baseSolanaWallet);
                    }
                }
            }
            const wallets = _.filter(all, {type: ASSET_TYPE_COIN});
            const tokens = _.filter(all, {type: ASSET_TYPE_TOKEN});
            return {
                all,
                coins: wallets,
                tokens,
            };
        } catch (e) {
            Logs.info('WalletFactory: fromPrivateKey', e);
        }
        return {
            all,
            wallets: [],
            tokens: [],
        };
    }

    static getWallet(chain) {
        return this.wallets[chain];
    }

    static async getTransactionFee(chain, transaction) {
        try {
            const provider = await ProviderFactory.getProvider(chain)
            var feeData
            if (chain === "SOLANA") {
                var _provider = new SolanaProvider({apiEndpoint: "https://silent-convincing-valley.solana-mainnet.quiknode.pro/4d43830d7a78708c89c77ee3fe5bb1ec48a5c4d7", cluster: "https://silent-convincing-valley.solana-mainnet.quiknode.pro/4d43830d7a78708c89c77ee3fe5bb1ec48a5c4d7"})
                feeData = await _provider.getFeeData(transaction.from, transaction.to);

                return await _provider.estimateGas({
                    ...transaction,
                    gasPrice: 0,
                });
            }
            feeData = await provider.getFeeData();
            let gasPrice = 0;
            if (chain === 'BTC') {
                gasPrice = feeData.data.fast;
            } else if (
                chain === 'ETH' ||
                chain === 'BSC' ||
                chain === 'POLYGON'
            ) {
                gasPrice = feeData.gasPrice;
            }
            if (chain === 'BTC' || chain === 'TRON' || chain === 'RIPPLE') {
                return await provider.estimateGas({
                    ...transaction,
                    gasPrice: gasPrice,
                });
            } else if (
                chain === 'ETH' ||
                chain === 'BSC' ||
                chain === 'POLYGON'
            ) {
                if (transaction.tokenContractAddress) {
                    const wallet = this.getWallet(chain);
                    const fee = await provider.getEstimateTokenGas({
                        signer: wallet.signer,
                        ...transaction,
                        gasPrice: gasPrice,
                    });

                    return {
                        success: true,
                        data: {
                            ...fee,
                        },
                    };
                } else {
                    const estimateGas = await provider.estimateGas({
                        ...transaction,
                        gasPrice: gasPrice,
                    });
                    const fee = estimateGas.mul(feeData.gasPrice);
                    return {
                        success: true,
                        data: {
                            estimateGas: {
                                wei: fee,
                                ether: utils.formatEther(fee),
                            },
                            gas: {
                                gasLimit: estimateGas,
                                gasPrice: feeData.gasPrice,
                            },
                        },
                    };
                }
            }
        } catch (e) {
            Logs.info('WalletFactory: getTransactionFee', e);
            return {
                success: false,
                data: e.reason,
            };
        }
    }

    static async sendTransaction(activeAssets, transaction) {
        try {
            const provider = await ProviderFactory.getProvider(activeAssets.chain);
            if (activeAssets.chain === 'SOLANA') {
                var _provider = new SolanaProvider({apiEndpoint: "https://silent-convincing-valley.solana-mainnet.quiknode.pro/4d43830d7a78708c89c77ee3fe5bb1ec48a5c4d7", cluster: "https://silent-convincing-valley.solana-mainnet.quiknode.pro/4d43830d7a78708c89c77ee3fe5bb1ec48a5c4d7"})
                const wallet = new SolanaWallet(_provider)
                wallet.fromPrivateKey(null, activeAssets.privateKey)

                var send = null;

                if (activeAssets.id === 'mxg' || activeAssets.id === 'xusdt' || activeAssets.id === 'usdt' ) {
                    send = await wallet.sendSplTransaction(wallet, {to: transaction.to, value: transaction.value, mintAddress: transaction.tokenContractAddress, decimals: transaction.decimals})
                } else {
                    send = await wallet.sendTransaction({to: transaction.to, value: transaction.value, feePayer: transaction.takerFee})
                }

                if (send == null) {
                    throw new Error("Failed to send transaction ")
                }

                return {
                    success: send?.success,
                    data: send?.data,

                }
            } else {
                const wallet = await this.getWallet(chain);
            }

            return await provider.sendTransaction(transaction);
        } catch (e) {('WalletFactory: sendTransaction', e);
            return {
                success: false,
                data: e.reason,
            };
        }
    }

    static async getTransactions(wallet) {
        try {
            const provider = await ProviderFactory.getProvider(wallet.chain);
            const pubKey = new PublicKey(wallet.walletAddress);

            const desiredLimit = 10;
            let transactions = [];
            let beforeSignature = null;

            while (transactions.length < desiredLimit) {
                try {
                    const transactionSignatures = await provider.connection.getSignaturesForAddress(
                        pubKey,
                        { limit: desiredLimit - transactions.length, before: beforeSignature }
                    );

                    if (transactionSignatures.length === 0) break;

                    const transactionsData = await Promise.all(
                        transactionSignatures.map((signatureInfo) =>
                            provider.connection
                                .getTransaction(signatureInfo.signature)
                                .catch((error) => {
                                    console.error("Error fetching transaction:", error);
                                    return null;
                                })
                        )
                    );

                    for (let i = 0; i < transactionsData.length; i++) {
                        const transaction = transactionsData[i];
                        if (!transaction || !transaction.meta || !transaction.meta.postTokenBalances || !transaction.meta.preTokenBalances) continue;

                        const signatureInfo = transactionSignatures[i];
                        const txHash = signatureInfo.signature;

                        const tokenTransfers = transaction.meta.postTokenBalances
                            .filter((balance) => balance.mint === wallet.contract)
                            .map((postBalance) => {
                                const preBalance = transaction.meta.preTokenBalances.find(
                                    (balance) =>
                                        balance.mint === wallet.contract &&
                                        balance.owner === postBalance.owner
                                );
                                const change =
                                    postBalance.uiTokenAmount.uiAmount -
                                    (preBalance ? preBalance.uiTokenAmount.uiAmount : 0);
                                return { owner: postBalance.owner, change };
                            });

                        let to = null;
                        let from = null;
                        let value = 0;

                        for (const transfer of tokenTransfers) {
                            if (transfer.change > 0) {
                                to = transfer.owner;
                                value = Math.abs(transfer.change);
                            } else if (transfer.change < 0) {
                                from = transfer.owner;
                            }
                        }

                        if (!to && !from) {
                            if (tokenTransfers.some(t => t.owner === wallet.walletAddress)) {
                                to = wallet.walletAddress;
                            } else {
                                from = wallet.walletAddress;
                            }
                        }

                        if (!to || !from) continue;

                        const status = transaction.meta.err ? "0" : "-1";
                        const createdAt = transaction.blockTime
                            ? moment(transaction.blockTime * 1000).fromNow()
                            : "N/A";
                        const gasFee = transaction.meta.fee || 0;
                        const isSender = wallet.walletAddress === from;
                        const explore =
                            configProperties.solana.explore + `tx/${txHash}`;
                        const type = isSender ? "outgoing" : "incoming";

                        transactions.push({
                            txHash,
                            to,
                            from,
                            status,
                            createdAt,
                            gasFee,
                            value,
                            isSender,
                            explore,
                            type,
                        });
                    }

                    beforeSignature =
                        transactionSignatures[transactionSignatures.length - 1]?.signature;
                } catch (error) {
                    console.error("Error fetching transaction signatures:", error);
                    return {
                        success: false,
                        error: error.message || 'An error occurred while fetching transaction signatures',
                    };
                }
            }

            console.log("Transactions:", transactions);
            return {
                success: true,
                data: transactions,
            };

        } catch (error) {
            Logs.info("WalletFactory: getTransactions: An error occurred", error);
            return {
                success: false,
                error: error.message || 'An unknown error occurred while fetching transactions',
            };
        }
    }
    static async getBalance(coins, tokens) {
        try {
            const lastTime = await StorageService.getItem('lastTime');
            if (lastTime !== undefined) {
                const currentTime = Date.now();
                if (currentTime - parseInt(lastTime, 10) <= 5000) {
                    throw new Error('Too many requests');
                }
            }
            await StorageService.setItem('lastTime', Date.now().toString());
            const balanceByWallets = await this.getNativeBalance(coins);
            var balanceByTokens = []
            if(tokens.length) {
                balanceByTokens = await this.getTokenBalance(tokens)
            }
            return {
                success: true,
                data: {
                    coins: balanceByWallets,
                    tokens: balanceByTokens,
                },
            };
        } catch (e) {
            Logs.info('WalletFactory: getBalance', e);
            return {
                success: false,
                data: e.reason,
            };
        }
    }

    static destroy() {
        this.wallets = {};
    }

    static generateMnemonics(length) {
        return entropyToMnemonic(utils.randomBytes(length || 16)).split(' ');
    }

    static async getNativeBalance(wallets) {
        const updatedWallets = [];
        try {
            let requests = [];
            for (let i = 0; i < wallets.length; i++) {
                const chain = wallets[i].chain;
                let config = {
                    method: 'get',
                    url: '',
                    timeout: 13000,
                    headers: {
                        'X-API-Key': configProperties.moralis.key,
                    },
                };

                if (chain === 'ETH' || chain === 'BSC' || chain === 'POLYGON') {
                    config.url =
                        configProperties.moralis.api +
                        '/v2/' +
                        `${wallets[i].walletAddress}` +
                        '/balance?chain=' +
                        wallets[i].chain?.toLowerCase();
                    requests.push(
                        axios(config).catch(err => {
                            return {
                                data: {
                                    balance: 0,
                                },
                            };
                        }),
                    );
                } else if (chain === 'BTC') {
                    config.url =
                        configProperties.btc.api +
                        `address/${wallets[i].walletAddress}`;
                    requests.push(
                        axios(config).catch(err => {
                            return {
                                data: {
                                    balance: 0,
                                },
                            };
                        }),
                    );
                } else if (chain === 'TRON') {
                    config.url = configProperties.tron.api + 'wallet/getaccount';
                    config.method = 'post';
                    config.data = {
                        address: TronWeb.address
                            .toHex(wallets[i].walletAddress)
                            .toUpperCase(),
                    };
                    config.headers = {
                        accept: 'application/json',
                        'content-type': 'application/json',
                    };
                    requests.push(
                        axios(config).catch(err => {
                            return {
                                data: {
                                    balance: 0,
                                },
                            };
                        }),
                    );
                }
                else if (chain === 'SOLANA') {
                    const connection = new Connection("https://magical-misty-tent.solana-mainnet.quiknode.pro/c395c31a02df95931e4688b9e4fb207ac436172f");
                    requests.push(
                        connection.getBalance(new PublicKey(wallets[i].walletAddress))
                            .then(balance => ({
                                data: {
                                    balance: balance
                                }
                            }))
                            .catch(err => {
                                console.error(`Error getting balance for wallet ${wallets[i].walletAddress}:`, err); // Log the error
                                return {
                                    data: {
                                        balance: 0
                                    },
                                    error: err.message  // Include error message in response
                                };
                            })
                    );
                }
            }
            const chunks = _.chunk(requests, 5);
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                let results = await Promise.all(chunk);
                for (let index = 0; index < results.length; index++) {
                    const result = results[index];
                    const position = i * 5 + index;
                    let balance = 0;
                    if (wallets[position].symbol === 'BTC') {
                        const remain =
                            result.data.chain_stats?.funded_txo_sum -
                            result.data.chain_stats?.spent_txo_sum;
                        balance = BitcoinUtil.toBTC(remain);
                    } else if (
                        wallets[position].chain === 'ETH' ||
                        wallets[position].chain === 'BSC' ||
                        wallets[position].chain === 'POLYGON'
                    ) {
                        balance = formatEther(result.data.balance);
                    } else if (wallets[position].chain === 'TRON') {
                        const account = result.data;
                        balance = 0;
                        if (!_.isEmpty(account)) {
                            balance = TronWeb.fromSun(account.balance);
                        }
                    }
                    else if (wallets[position].chain === 'SOLANA') {
                        const balanceData = result.data; // Assuming 'result.data' contains the SOL balance in lamports

                        balance = 0;
                        if (!_.isEmpty(balanceData)) {
                            balance = balanceData.balance / LAMPORTS_PER_SOL; // Convert from lamports to SOL
                        }
                    }
                    updatedWallets.push({
                        ...wallets[position],
                        balance: balance,
                    });
                }
            }
            return updatedWallets;
        } catch (e) {
            Logs.info('WalletFactory: getNativeBalance', e);
            return wallets;
        }
    }

    static async getTokenBalance(tokens) {
        const tokensByChain = _.groupBy(tokens, 'chain');
        const requests = [];

        for (const [key, value] of Object.entries(tokensByChain)) {
            if (key === 'ETH' || key === 'BSC' || key === 'POLYGON') {
                const tokenAddresses = _.map(value, token => token.contract).join('&token_addresses=');
                requests.push(
                    axios.get(
                        `${configProperties.moralis.api}/v2/${value[0].walletAddress}/erc20?chain=${key?.toLowerCase()}&token_addresses=${tokenAddresses}`,
                        {
                            headers: {
                                'X-API-Key': configProperties.moralis.key,
                            },
                            timeout: 5000,
                        }
                    )
                );
            } else if (key === 'TRON') {
                requests.push(
                    axios.get(
                        `${configProperties.tron.api2}account?address=${value[0].walletAddress}`,
                        {
                            timeout: 5000,
                        }
                    )
                );
            } else if (key === 'SOLANA') {
                var url = "https://magical-misty-tent.solana-mainnet.quiknode.pro/c395c31a02df95931e4688b9e4fb207ac436172f"
                const payload = {
                    jsonrpc: "2.0",
                    id: 1,
                    method: "getTokenAccountsByOwner",
                    params: [
                        value[0].walletAddress,
                        { mint: ""},
                        { encoding: "jsonParsed" }
                    ]
                };
                value.map(function(item){
                    payload.params[1].mint = item.contract
                    payload.params[0] = item.walletAddress

                    requests.push(
                        axios.post(
                            url, payload,
                            {
                                headers: {
                                    "Content-Type": "application/json"
                                }
                            }
                        )
                    )
                })
            }
        }
        const results = await Promise.all(requests);
        var updatedTokens = tokens.map(token => {
            let balance = 0;
            if (token.chain === 'ETH' || token.chain === 'POLYGON') {
                const tokenBalance = results.find(
                    result =>
                        result.data.find(
                            t => t.token_address?.toLowerCase() === token.contract?.toLowerCase()
                        )
                );
                balance = tokenBalance?.data?.balance ? ethers.utils.formatUnits(tokenBalance.data.balance, token.decimals) : '0';
            }
            else if (token.chain === 'TRON') {
                const tokenBalance = results.find(
                    result =>
                        result.data.trc20token_balances.find(
                            t => t.tokenId === token.contract
                        )
                );
                balance = tokenBalance?.data?.trc20token_balances.find(
                    t => t.tokenId === token.contract
                )?.balance ? ethers.utils.formatUnits(tokenBalance.data.trc20token_balances.find(t => t.tokenId === token.contract).balance, token.decimals) : '0';
            }
            else if (token.chain === 'SOLANA' || token.chain === 'BSC') {
                results.map((item) => {
                    var data = item.data
                    if(data.result.value.length) {
                        var validate = data !== null && typeof data === 'object' && !Array.isArray(data);
                        if(validate) {
                            var tokenAmount = data.result.value[0].account.data.parsed.info.tokenAmount.uiAmount
                            var mint = data.result.value[0].account.data.parsed.info.mint
                            if(mint == token.contract) {
                                balance = tokenAmount
                            }
                        }
                    }
                })
            }
            return { ...token, balance };
        });
        return updatedTokens;
    }
}

