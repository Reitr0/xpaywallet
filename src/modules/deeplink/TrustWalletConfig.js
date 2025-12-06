/**
 * Trust Wallet Deep Link Configuration
 * Handles Trust Wallet specific URL schemes and actions
 */

export const TrustWalletSchemes = {
    // Main Trust Wallet scheme
    TRUST: 'trust://',
    
    // WalletConnect integration
    TRUST_WC: 'trust://wc',
    
    // DApp integration
    TRUST_DAPP: 'trust://dapp',
    TRUST_OPEN_URL: 'trust://open_url',
    
    // Wallet actions
    TRUST_SEND: 'trust://send',
    TRUST_RECEIVE: 'trust://receive',
    TRUST_SWAP: 'trust://swap',
    TRUST_DAPPS: 'trust://dapps',
    TRUST_SETTINGS: 'trust://settings',
};

export const TrustWalletActions = {
    OPEN_URL: 'open_url',
    WC: 'wc',
    DAPP: 'dapp',
    SEND: 'send',
    RECEIVE: 'receive',
    SWAP: 'swap',
    DAPPS: 'dapps',
    SETTINGS: 'settings',
};

export const TrustWalletParams = {
    URL: 'url',
    URI: 'uri',
    CHAIN_ID: 'chainId',
    TOKEN: 'token',
    AMOUNT: 'amount',
    ADDRESS: 'address',
    SYMBOL: 'symbol',
    DECIMALS: 'decimals',
};

export const TrustWalletSupportedChains = {
    '1': 'Ethereum Mainnet',
    '56': 'BNB Smart Chain',
    '137': 'Polygon',
    '42161': 'Arbitrum One',
    '10': 'Optimism',
    '8453': 'Base',
    '324': 'zkSync Era',
    '59144': 'Linea',
    '204': 'opBNB',
    '534351': 'Scroll',
    '10143': 'Scroll Testnet',
    '5': 'Goerli Testnet',
    '11155111': 'Sepolia Testnet',
    '97': 'BSC Testnet',
    '421613': 'Arbitrum Goerli',
    '421614': 'Arbitrum Sepolia',
    '59140': 'Linea Testnet',
    '84531': 'Base Goerli',
    '84532': 'Base Sepolia',
    '5611': 'opBNB Testnet',
};

export class TrustWalletDeepLinkBuilder {
    /**
     * Build Trust Wallet deep link for opening a DApp
     * @param {string} url - DApp URL
     * @param {string} chainId - Optional chain ID
     * @returns {string} Deep link URL
     */
    static buildDAppLink(url, chainId = null) {
        const params = new URLSearchParams();
        params.set(TrustWalletParams.URL, encodeURIComponent(url));
        
        if (chainId) {
            params.set(TrustWalletParams.CHAIN_ID, chainId);
        }
        
        return `${TrustWalletSchemes.TRUST_DAPP}?${params.toString()}`;
    }
    
    /**
     * Build Trust Wallet deep link for WalletConnect
     * @param {string} uri - WalletConnect URI
     * @returns {string} Deep link URL
     */
    static buildWalletConnectLink(uri) {
        const params = new URLSearchParams();
        params.set(TrustWalletParams.URI, uri);
        
        return `${TrustWalletSchemes.TRUST_WC}?${params.toString()}`;
    }
    
    /**
     * Build Trust Wallet deep link for sending tokens
     * @param {string} address - Recipient address
     * @param {string} amount - Amount to send
     * @param {string} token - Token symbol (optional)
     * @param {string} chainId - Chain ID (optional)
     * @returns {string} Deep link URL
     */
    static buildSendLink(address, amount, token = null, chainId = null) {
        const params = new URLSearchParams();
        params.set(TrustWalletParams.ADDRESS, address);
        params.set(TrustWalletParams.AMOUNT, amount);
        
        if (token) {
            params.set(TrustWalletParams.TOKEN, token);
        }
        
        if (chainId) {
            params.set(TrustWalletParams.CHAIN_ID, chainId);
        }
        
        return `${TrustWalletSchemes.TRUST_SEND}?${params.toString()}`;
    }
    
    /**
     * Build Trust Wallet deep link for opening a specific screen
     * @param {string} action - Action to perform
     * @param {Object} params - Additional parameters
     * @returns {string} Deep link URL
     */
    static buildActionLink(action, params = {}) {
        const urlParams = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                urlParams.set(key, value);
            }
        });
        
        const queryString = urlParams.toString();
        return `${TrustWalletSchemes.TRUST}${action}${queryString ? `?${queryString}` : ''}`;
    }
}

export default {
    TrustWalletSchemes,
    TrustWalletActions,
    TrustWalletParams,
    TrustWalletSupportedChains,
    TrustWalletDeepLinkBuilder,
};
