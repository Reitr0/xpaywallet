import {Logs} from '@modules/log/logs';
import {ProviderFactory} from '@modules/core/factory/ProviderFactory';
import WSSClient from '@modules/core/ws/WSClient';
export class VCoinPlatform {
    static async init() {
        try {
            await initWebSocket();
            initProvider();
        } catch (e) {
            Logs.info('App: init', e);
        }
    }
}

const initProvider = () => {
    ProviderFactory.init([
        {
            chain: 'BTC',
            apiEndpoint: 'https://blockstream.info/api/',
            testnet: false,
        },
        {
            chain: 'ETH',
            chainId: 1,
            rpcUrl: 'https://rpc.ankr.com/eth',
            apiEndpoint: 'https://api.etherscan.io/api',
            apiKey: '4DUWR9JECH25G9YCXSZ6UPERZ16SRBG6WR',
            testnet: false,
        },
        {
            chain: 'BSC',
            rpcUrl: 'https://bsc-dataseed1.defibit.io/',
            chainId: 56,
            apiEndpoint: 'https://api.bscscan.com/api',
            apiKey: '1UVR5JEUSFF5JKYCQZQKPI2YZDNHQDIWTW',
            testnet: false,
        },
        {
            chain: 'POLYGON',
            rpcUrl: 'https://polygon-rpc.com',
            chainId: 137,
            apiEndpoint: 'https://api.polygonscan.com/api',
            apiKey: 'ADZI52F2INID3WJCEJPV7TEQUQUMRNE9M7',
            testnet: false,
        },
        {
            chain: 'TRON',
            rpcUrl: 'https://api.trongrid.io/',
            apiEndpoint: 'https://api.trongrid.io/',
            apiKey: '0327edd7-48f8-41a2-ab57-efa9f7ccfe5a',
            testnet: false,
        },
        {
            chain:'SOLANA',
            rpcUrl:'https://api.mainnet-beta.solana.com',
            apiEndpoint:'https://public-api.solscan.io/',
            apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3MTgwOTEzNzQ5NjgsImVtYWlsIjoicXVpbmN5amFjazQyNUBnbWFpbC5jb20iLCJhY3Rpb24iOiJ0b2tlbi1hcGkiLCJpYXQiOjE3MTgwOTEzNzR9.r1VmHAszv5bY7XkZrJGyPO6pCCqQbxSYqphoELsENwo',
        },
    ]);
};

const initWebSocket = async () => {
    await WSSClient.connect({
        header: { token: '' },
        callBack: null,
    });
};
