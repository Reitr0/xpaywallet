import { Linking } from 'react-native';
import { onConnect } from '@modules/walletconnect/WalletConnectClient';
import { walletConnectSessionManager } from '@modules/walletconnect/WalletConnectSessionManager';
import { TrustWalletDeepLinkBuilder, TrustWalletActions } from './TrustWalletConfig';

export class DeepLinkHandler {
    constructor() {
        this.supportedSchemes = {
            // WalletConnect schemes
            'wc': this.handleWalletConnect,
            'yo-wallet': this.handleWalletConnect,
            'walletconnect': this.handleWalletConnect,
            
            // MetaMask schemes
            'metamask': this.handleMetaMask,
            'metamask-wc': this.handleMetaMaskWalletConnect,
            
            // Other popular wallet schemes
            'trust': this.handleTrustWallet,
            'rainbow': this.handleRainbowWallet,
            'coinbase': this.handleCoinbaseWallet,
            'phantom': this.handlePhantomWallet,
            'solflare': this.handleSolflareWallet,
            
            // Custom app schemes
            'newxpay': this.handleCustomApp,
            'xpay': this.handleCustomApp,
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        console.log('🔗 Setting up deeplink event listeners...');
        
        // Handle initial URL when app is opened from a deep link
        Linking.getInitialURL().then((url) => {
            console.log('🔗 Initial URL:', url);
            if (url) {
                this.handleDeepLink(url);
            }
        });

        // Handle deep links when app is already running
        const linkingListener = Linking.addEventListener('url', (event) => {
            console.log('🔗 Received deeplink event:', event.url);
            this.handleDeepLink(event.url);
        });

        console.log('🔗 Deeplink event listeners setup complete');
        return () => {
            linkingListener?.remove();
        };
    }

    handleDeepLink(url) {
        console.log('🔗 Deep link received:', url);
        
        if (!url) {
            console.log('❌ No URL provided');
            return;
        }

        try {
            // Parse the URL to get scheme and data
            const parsedUrl = this.parseUrl(url);
            console.log('📋 Parsed URL:', parsedUrl);

            if (!parsedUrl.scheme) {
                console.log('❌ No scheme found in URL');
                return;
            }

            // Find handler for the scheme
            const handler = this.supportedSchemes[parsedUrl.scheme.toLowerCase()];
            if (handler) {
                console.log(`✅ Found handler for scheme: ${parsedUrl.scheme}`);
                handler.call(this, parsedUrl);
            } else {
                console.log(`❌ No handler found for scheme: ${parsedUrl.scheme}`);
                this.handleUnknownScheme(parsedUrl);
            }
        } catch (error) {
            console.error('❌ Error handling deep link:', error);
        }
    }

    parseUrl(url) {
        try {
            const urlObj = new URL(url);
            return {
                scheme: urlObj.protocol.replace(':', ''),
                host: urlObj.host,
                pathname: urlObj.pathname,
                search: urlObj.search,
                hash: urlObj.hash,
                fullUrl: url,
                params: Object.fromEntries(urlObj.searchParams)
            };
        } catch (error) {
            // Fallback parsing for non-standard URLs
            const schemeMatch = url.match(/^([^:]+):/);
            if (schemeMatch) {
                return {
                    scheme: schemeMatch[1],
                    fullUrl: url,
                    params: this.parseQueryString(url.split('?')[1] || '')
                };
            }
            throw new Error('Invalid URL format');
        }
    }

    parseQueryString(queryString) {
        const params = {};
        if (queryString) {
            queryString.split('&').forEach(param => {
                const [key, value] = param.split('=');
                if (key) {
                    params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
                }
            });
        }
        return params;
    }

    // WalletConnect handlers
    handleWalletConnect(parsedUrl) {
        console.log('🔌 Handling WalletConnect deep link');
        
        let wcUri = parsedUrl.fullUrl;
        
        // Handle different WalletConnect URL formats
        if (parsedUrl.params.uri) {
            // Extract WalletConnect URI from any scheme that has uri parameter
            wcUri = parsedUrl.params.uri;
            console.log('📋 Found URI parameter:', wcUri);
        } else if (parsedUrl.fullUrl.includes('wc%3A') || parsedUrl.fullUrl.includes('wc:')) {
            // Decode URL-encoded WalletConnect URI
            wcUri = decodeURIComponent(parsedUrl.fullUrl);
            
            // Extract the wc: URI from the full URL
            const wcMatch = wcUri.match(/wc:[^&]+/);
            if (wcMatch) {
                wcUri = wcMatch[0];
            }
        }
        
        console.log('🔗 Extracted WalletConnect URI:', wcUri);
        
        // Validate WalletConnect URI
        if (!wcUri.startsWith('wc:')) {
            console.error('❌ Invalid WalletConnect URI:', wcUri);
            return;
        }
        
        // Clean the URI
        let cleanUri = wcUri;
        if (cleanUri.includes('&expiryTimestamp=')) {
            cleanUri = cleanUri.split('&expiryTimestamp=')[0];
        }
        
        console.log('✨ Cleaned WalletConnect URI:', cleanUri);
        
        // Connect to WalletConnect
        onConnect({ uri: cleanUri }).catch(error => {
            console.error('❌ WalletConnect connection failed:', error);
        });
    }

    // MetaMask handlers
    handleMetaMask(parsedUrl) {
        console.log('🦊 Handling MetaMask deep link');
        
        // Check if this is a WalletConnect URI
        if (parsedUrl.params.uri) {
            console.log('🔌 MetaMask WalletConnect detected, routing to WalletConnect handler');
            this.handleWalletConnect(parsedUrl);
            return;
        }
        
        // MetaMask deep link format: metamask://dapp?url=https://example.com
        if (parsedUrl.params.url) {
            const dappUrl = parsedUrl.params.url;
            console.log('🌐 Opening DApp in MetaMask:', dappUrl);
            
            // You can implement MetaMask-specific logic here
            // For example, opening the DApp URL in a browser or WebView
            this.openDAppInBrowser(dappUrl);
        } else {
            console.log('📱 Opening MetaMask app');
            // Handle other MetaMask deep links
        }
    }

    handleMetaMaskWalletConnect(parsedUrl) {
        console.log('🦊🔌 Handling MetaMask WalletConnect deep link');
        
        // MetaMask WalletConnect format: metamask-wc://wc?uri=wc:...
        if (parsedUrl.params.uri) {
            const wcUri = parsedUrl.params.uri;
            console.log('🔗 MetaMask WalletConnect URI:', wcUri);
            
            // Handle as WalletConnect
            this.handleWalletConnect({
                fullUrl: wcUri,
                scheme: 'wc',
                params: {}
            });
        }
    }

    // Trust Wallet handlers
    handleTrustWallet(parsedUrl) {
        console.log('🛡️ Handling Trust Wallet deep link');
        console.log('📋 Trust Wallet URL:', parsedUrl.fullUrl);
        console.log('📋 Trust Wallet params:', parsedUrl.params);
        
        // Trust Wallet deep link formats:
        // trust://open_url?url=https://example.com
        // trust://wc?uri=wc:...
        // trust://dapp?url=https://example.com&chainId=1
        // trust://connect?url=https://example.com&chainId=1
        
        // Handle WalletConnect URI
        if (parsedUrl.params.uri) {
            console.log('🔌 Trust Wallet WalletConnect detected');
            this.handleWalletConnect(parsedUrl);
            return;
        }
        
        // Handle DApp URL (for connecting to DApps)
        if (parsedUrl.params.url) {
            const dappUrl = parsedUrl.params.url;
            const chainId = parsedUrl.params.chainId;
            
            console.log('🌐 Trust Wallet connecting to DApp:', dappUrl);
            console.log('⛓️ Chain ID:', chainId);
            
            // For DApp connections, we should open the DApp URL
            // This will trigger the wallet connection flow in the DApp
            this.openDAppInBrowser(dappUrl, { 
                chainId,
                walletProvider: 'trust',
                action: 'connect'
            });
            return;
        }
        
        // Handle Trust Wallet specific actions
        if (parsedUrl.pathname) {
            const action = parsedUrl.pathname.replace('/', '');
            console.log('🎯 Trust Wallet action:', action);
            
            switch (action) {
                case 'open_url':
                case 'dapp':
                case 'connect':
                    // These actions are handled above with params.url
                    console.log('✅ Trust Wallet DApp connection handled');
                    break;
                case TrustWalletActions.SEND:
                    this.navigateToScreen('SendScreen');
                    break;
                case TrustWalletActions.RECEIVE:
                    this.navigateToScreen('ReceiveScreen');
                    break;
                case TrustWalletActions.SWAP:
                    this.navigateToScreen('SwapScreen');
                    break;
                case TrustWalletActions.DAPPS:
                    this.navigateToScreen('DAppsScreen');
                    break;
                case TrustWalletActions.SETTINGS:
                    this.navigateToScreen('SettingsScreen');
                    break;
                default:
                    console.log('❓ Unknown Trust Wallet action:', action);
            }
        }
    }

    // Rainbow Wallet handlers
    handleRainbowWallet(parsedUrl) {
        console.log('🌈 Handling Rainbow Wallet deep link');
        
        // Rainbow Wallet deep link format: rainbow://open?url=https://example.com
        if (parsedUrl.params.url) {
            const dappUrl = parsedUrl.params.url;
            console.log('🌐 Opening DApp in Rainbow Wallet:', dappUrl);
            this.openDAppInBrowser(dappUrl);
        }
    }

    // Coinbase Wallet handlers
    handleCoinbaseWallet(parsedUrl) {
        console.log('🪙 Handling Coinbase Wallet deep link');
        
        // Coinbase Wallet deep link format: cbwallet://open?url=https://example.com
        if (parsedUrl.params.url) {
            const dappUrl = parsedUrl.params.url;
            console.log('🌐 Opening DApp in Coinbase Wallet:', dappUrl);
            this.openDAppInBrowser(dappUrl);
        }
    }

    // Phantom Wallet handlers (Solana)
    handlePhantomWallet(parsedUrl) {
        console.log('👻 Handling Phantom Wallet deep link');
        
        // Phantom Wallet deep link format: phantom://open?url=https://example.com
        if (parsedUrl.params.url) {
            const dappUrl = parsedUrl.params.url;
            console.log('🌐 Opening DApp in Phantom Wallet:', dappUrl);
            this.openDAppInBrowser(dappUrl);
        }
    }

    // Solflare Wallet handlers (Solana)
    handleSolflareWallet(parsedUrl) {
        console.log('☀️ Handling Solflare Wallet deep link');
        
        // Solflare Wallet deep link format: solflare://open?url=https://example.com
        if (parsedUrl.params.url) {
            const dappUrl = parsedUrl.params.url;
            console.log('🌐 Opening DApp in Solflare Wallet:', dappUrl);
            this.openDAppInBrowser(dappUrl);
        }
    }

    // Custom app handlers
    handleCustomApp(parsedUrl) {
        console.log('📱 Handling custom app deep link');
        
        const path = parsedUrl.pathname || parsedUrl.fullUrl.split('://')[1];
        console.log('🛣️ Custom deep link path:', path);
        
        // Handle different custom app paths
        switch (path) {
            case 'wallet':
                console.log('💰 Navigate to wallet screen');
                this.navigateToScreen('WalletScreen');
                break;
            case 'dapps':
                console.log('🌐 Navigate to DApps screen');
                this.navigateToScreen('DAppsScreen');
                break;
            case 'settings':
                console.log('⚙️ Navigate to settings screen');
                this.navigateToScreen('SettingsScreen');
                break;
            case 'swap':
                console.log('🔄 Navigate to swap screen');
                this.navigateToScreen('SwapScreen');
                break;
            case 'nft':
                console.log('🎨 Navigate to NFT screen');
                this.navigateToScreen('NFTScreen');
                break;
            default:
                console.log('❓ Unknown custom deep link path:', path);
        }
    }

    // Unknown scheme handler
    handleUnknownScheme(parsedUrl) {
        console.log('❓ Handling unknown scheme:', parsedUrl.scheme);
        
        // Try to extract useful information from unknown schemes
        if (parsedUrl.params.url) {
            console.log('🌐 Found URL parameter, opening in browser:', parsedUrl.params.url);
            this.openDAppInBrowser(parsedUrl.params.url);
        } else {
            console.log('📋 Unknown scheme data:', parsedUrl);
        }
    }

    // Utility methods
    openDAppInBrowser(url, context = {}) {
        console.log('🌐 Opening DApp in browser:', url);
        console.log('📋 Context:', context);
        
        // For DApp connections, we should navigate to the DApp screen
        // This will allow the DApp to initiate wallet connection
        if (context.action === 'connect' && context.walletProvider) {
            console.log('🔗 DApp connection initiated via', context.walletProvider);
            console.log('⛓️ Chain ID:', context.chainId);
            
            // Navigate to DApp screen with connection context
            this.navigateToDAppScreen(url, context);
            return;
        }
        
        // If chainId is provided, you might want to switch to that chain first
        if (context.chainId) {
            console.log('⛓️ Switching to chain:', context.chainId);
            // Implement chain switching logic here
        }
        
        // Default: open URL in external browser
        Linking.openURL(url).catch(error => {
            console.error('❌ Failed to open URL:', error);
        });
    }

    navigateToDAppScreen(url, context = {}) {
        console.log('🧭 Navigate to DApp screen:', url);
        console.log('📋 DApp context:', context);
        
        // You can implement navigation to DApp screen here
        // For example, using React Navigation
        // navigation.navigate('DAppsDetailScreen', { 
        //     item: { url, ...context } 
        // });
        
        // For now, open in external browser as fallback
        Linking.openURL(url).catch(error => {
            console.error('❌ Failed to open DApp URL:', error);
        });
    }

    navigateToScreen(screenName) {
        console.log('🧭 Navigate to screen:', screenName);
        
        // You can implement navigation logic here
        // For example, using React Navigation
        // navigation.navigate(screenName);
    }

    // Trust Wallet specific methods
    generateTrustWalletDAppLink(url, chainId = null) {
        return TrustWalletDeepLinkBuilder.buildDAppLink(url, chainId);
    }

    generateTrustWalletWalletConnectLink(uri) {
        return TrustWalletDeepLinkBuilder.buildWalletConnectLink(uri);
    }

    generateTrustWalletSendLink(address, amount, token = null, chainId = null) {
        return TrustWalletDeepLinkBuilder.buildSendLink(address, amount, token, chainId);
    }

    // Test method for debugging
    testDeepLink(url) {
        console.log('🧪 Testing deep link:', url);
        this.handleDeepLink(url);
    }

    // Test TrustWallet deeplinks specifically
    testTrustWalletDeeplinks() {
        console.log('🧪 Testing TrustWallet deeplinks...');
        
        const testUrls = [
            'trust://open_url?url=https://solxdapp.io/signin',
            'trust://dapp?url=https://solxdapp.io/signin&chainId=1',
            'trust://connect?url=https://solxdapp.io/signin',
            'trust://wc?uri=wc:test123'
        ];
        
        testUrls.forEach((url, index) => {
            console.log(`🧪 Test ${index + 1}: ${url}`);
            this.handleDeepLink(url);
        });
    }
}

// Export singleton instance
export const deepLinkHandler = new DeepLinkHandler();
