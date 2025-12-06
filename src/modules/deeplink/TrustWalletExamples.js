/**
 * Trust Wallet Deep Link Test Examples
 * This file demonstrates how to use Trust Wallet deep links
 */

import { deepLinkHandler } from '@modules/deeplink/DeepLinkHandler';
import { TrustWalletDeepLinkBuilder } from '@modules/deeplink/TrustWalletConfig';

export class TrustWalletDeepLinkExamples {
    
    /**
     * Example: Open PancakeSwap DApp in Trust Wallet
     */
    static openPancakeSwap() {
        const dappUrl = 'https://pancakeswap.finance';
        const chainId = '56'; // BSC
        
        const deepLink = TrustWalletDeepLinkBuilder.buildDAppLink(dappUrl, chainId);
        console.log('🛡️ Trust Wallet DApp Link:', deepLink);
        
        // Test the deep link
        deepLinkHandler.testDeepLink(deepLink);
        
        return deepLink;
    }
    
    /**
     * Example: Connect to WalletConnect session via Trust Wallet
     */
    static connectWalletConnect() {
        const wcUri = 'wc:12345678-1234-1234-1234-123456789012@1?bridge=https://bridge.walletconnect.org&key=abc123';
        
        const deepLink = TrustWalletDeepLinkBuilder.buildWalletConnectLink(wcUri);
        console.log('🛡️ Trust Wallet WalletConnect Link:', deepLink);
        
        // Test the deep link
        deepLinkHandler.testDeepLink(deepLink);
        
        return deepLink;
    }
    
    /**
     * Example: Send BNB via Trust Wallet
     */
    static sendBNB() {
        const recipientAddress = '0x1234567890123456789012345678901234567890';
        const amount = '0.1';
        const token = 'BNB';
        const chainId = '56'; // BSC
        
        const deepLink = TrustWalletDeepLinkBuilder.buildSendLink(
            recipientAddress, 
            amount, 
            token, 
            chainId
        );
        console.log('🛡️ Trust Wallet Send Link:', deepLink);
        
        // Test the deep link
        deepLinkHandler.testDeepLink(deepLink);
        
        return deepLink;
    }
    
    /**
     * Example: Open Trust Wallet Swap screen
     */
    static openSwap() {
        const deepLink = 'trust://swap';
        console.log('🛡️ Trust Wallet Swap Link:', deepLink);
        
        // Test the deep link
        deepLinkHandler.testDeepLink(deepLink);
        
        return deepLink;
    }
    
    /**
     * Example: Open Trust Wallet DApps screen
     */
    static openDApps() {
        const deepLink = 'trust://dapps';
        console.log('🛡️ Trust Wallet DApps Link:', deepLink);
        
        // Test the deep link
        deepLinkHandler.testDeepLink(deepLink);
        
        return deepLink;
    }
    
    /**
     * Example: Open Uniswap with specific chain
     */
    static openUniswap() {
        const dappUrl = 'https://app.uniswap.org';
        const chainId = '1'; // Ethereum Mainnet
        
        const deepLink = TrustWalletDeepLinkBuilder.buildDAppLink(dappUrl, chainId);
        console.log('🛡️ Trust Wallet Uniswap Link:', deepLink);
        
        // Test the deep link
        deepLinkHandler.testDeepLink(deepLink);
        
        return deepLink;
    }
    
    /**
     * Run all examples
     */
    static runAllExamples() {
        console.log('🧪 Running Trust Wallet Deep Link Examples...');
        
        this.openPancakeSwap();
        this.connectWalletConnect();
        this.sendBNB();
        this.openSwap();
        this.openDApps();
        this.openUniswap();
        
        console.log('✅ All Trust Wallet examples completed!');
    }
}

export default TrustWalletDeepLinkExamples;
