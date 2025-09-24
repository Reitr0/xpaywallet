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
    usdcs,
} from '@modules/core/constant/constant';
import {applicationProperties} from '@src/application.properties';

export const WALLET_TYPE = {
    MANY: 1,
    ONE: 2,
};
export const STOCK_LIST_KEY = '@STOCK_LIST_KEY';
export const DEFAULT_STOCK = {
    chain: 'ALL',
    name: applicationProperties.defaultWalletName,
    type: WALLET_TYPE.MANY,
    defaultChain: 'ETH',
    logoURI: applicationProperties.logoURI.app,
    coins: [

    ],
    tokens: [],
};
export const WALLET_LIST = [DEFAULT_STOCK];
