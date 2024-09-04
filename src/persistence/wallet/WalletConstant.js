import {
    bsc,
    btc,
    eth,
    polygon,
    tron,
    solana,
    xusdts,
    xusdt,
    xusdtp,
    xusdtb,
    mxgs,
    mxg,
    mxgp,
    mxgb,
    usdtb,
    usdts,
    btcs,
    eths,
    doges,
    ltcs,
} from '@modules/core/constant/constant';
import {applicationProperties} from '@src/application.properties';

export const WALLET_TYPE = {
    MANY: 1,
    ONE: 2,
};
export const WALLET_LIST_KEY = '@WALLET_LIST_KEY';
export const DEFAULT_WALLET = {
    chain: 'ALL',
    name: applicationProperties.defaultWalletName,
    type: WALLET_TYPE.MANY,
    defaultChain: 'ETH',
    logoURI: applicationProperties.logoURI.app,
    coins: [
        eth,
        solana,
        mxgs,
        xusdts,
        usdts,
        btcs,
        eths,
        doges,
        ltcs,
    ],
    tokens: [],
};
export const WALLET_LIST = [DEFAULT_WALLET];
