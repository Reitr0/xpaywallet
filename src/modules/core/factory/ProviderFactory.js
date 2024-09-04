// Import the crypto getRandomValues shim (**BEFORE** the shims)
import 'react-native-get-random-values';
// Import the the ethers shims (**BEFORE** ethers)
import '@ethersproject/shims';
import {BitcoinProvider} from '@modules/core/provider/bitcoin/BitcoinProvider';
import {Logs} from '@modules/log/logs';
import {EthProvider} from '@modules/core/provider/eth/EthProvider';
import {TronProvider} from '@modules/core/provider/tron/TronProvider';
import {SolanaProvider} from "@modules/core/provider/solana/SolanaProvider";

export class ProviderFactory {
    static providers = {
        BTC: null,
        ETH: null,
        BSC: null,
        POLYGON: null,
        ARB: null,
        BTTC: null,
        TRON: null,
        SOLANA: null,
    };

    static init(configs) {
        try {
            for (let i = 0; i < configs.length; i++) {
                const config = configs[i];
                if (config.chain === 'BTC') {
                    this.providers[config.chain] = new BitcoinProvider({
                        apiEndpoint: config.apiEndpoint,
                        testnet: config.testnet,
                    });
                } else if (
                    config.chain === 'ETH' ||
                    config.chain === 'BSC' ||
                    config.chain === 'POLYGON' ||
                    config.chain === 'ARB' ||
                    config.chain === 'BTTC'
                ) {
                    this.providers[config.chain] = new EthProvider(config);
                } else if (config.chain === 'TRON') {
                    this.providers[config.chain] = new TronProvider(config);
                } else if (config.chain === 'SOLANA') {
                    this.providers[config.chain] = new SolanaProvider(config);
                }
            }
        } catch (e) {
            Logs.info('this: init', e);
        }
    }


    static getProvider(chain) {
        if (!this.providers[chain]) {
            this.providers[chain] = this.create({chain});
        }

        if (!this.providers[chain]) {
            throw new Error(`Provider not found for ${chain}`);
        }

        return this.providers[chain];
    }

    static getProviderClass(chain) {
        return {
            BTC: BitcoinProvider,
            ETH: EthProvider,
            TRON: TronProvider,
            SOLANA: SolanaProvider,
        }[chain];
    }

    static create({chain, ...rest}) {
        const providerClass = this.getProviderClass(chain);
        if (providerClass) {
            return new providerClass({apiEndpoint: null, cluster: null})
        }

        return null;
    }
}
