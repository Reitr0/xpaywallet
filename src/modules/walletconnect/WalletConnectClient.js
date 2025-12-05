import {Core} from '@walletconnect/core';
import {Web3Wallet} from '@walletconnect/web3wallet';
import CommonLoading from '@components/commons/CommonLoading';

export let web3wallet;

export async function createWeb3Wallet() {
    const core = new Core({
        //logger: "debug",
        projectId: '7b6e0bd9fe7379154288cbff433bcaee',
        relayUrl: 'wss://relay.walletconnect.com',
    });
    web3wallet = await Web3Wallet.init({
        core, // <- pass the shared `core` instance
        metadata: {
            name: 'NewXPay Wallet',
            description: 'NewXPay - Your Secure Crypto Wallet',
            url: 'https://newxpay.com',
            icons: ['https://newxpay.com/icon.png'],
        },
    });
    
    console.log('🔌 Web3Wallet initialized successfully');
    
    // Trigger event listener setup in session manager
    try {
        const { walletConnectSessionManager } = require('./WalletConnectSessionManager');
        if (walletConnectSessionManager && walletConnectSessionManager.retrySetupEventListeners) {
            walletConnectSessionManager.retrySetupEventListeners();
        }
    } catch (error) {
        console.log('🔌 Session manager not available yet:', error.message);
    }
}

export async function onConnect({uri}) {
    try {
        console.log('onConnect = ' + uri);
        
        // Ensure web3wallet is initialized
        if (!web3wallet) {
            console.log('Web3Wallet not initialized, creating...');
            await createWeb3Wallet();
        }
        
        // Validate and clean the URI
        if (!uri || !uri.startsWith('wc:')) {
            throw new Error('Invalid WalletConnect URI: ' + uri);
        }
        
        // Ensure the URI is properly formatted
        let cleanUri = uri;
        if (cleanUri.includes('&expiryTimestamp=')) {
            // Remove expiry timestamp if present as it can cause issues
            cleanUri = cleanUri.split('&expiryTimestamp=')[0];
        }
        
        console.log('Cleaned WalletConnect URI:', cleanUri);
        
        const pairing = await web3wallet.core.pairing.pair({uri: cleanUri});
        
        // Event listeners are handled by WalletConnectSessionManager
        // No need to duplicate them here
        
        return pairing;
    } catch (e) {
        console.log('Error connecting to WalletConnect:', e);
        CommonLoading.hide();
        throw e;
    }
}

// Function to approve session proposal
export async function approveSession(proposal) {
    try {
        const { id, params } = proposal;
        const { requiredNamespaces, optionalNamespaces } = params;
        
        // Create session with supported namespaces
        const session = await web3wallet.approveSession({
            id,
            namespaces: {
                eip155: {
                    accounts: [`eip155:1:0x1234567890123456789012345678901234567890`], // Replace with actual wallet address
                    methods: ['eth_sendTransaction', 'eth_signTransaction', 'eth_sign', 'personal_sign'],
                    events: ['chainChanged', 'accountsChanged']
                }
            }
        });
        
        console.log('Session approved:', session);
        return session;
    } catch (error) {
        console.error('Error approving session:', error);
        throw error;
    }
}

// Function to reject session proposal
export async function rejectSession(proposal) {
    try {
        const { id } = proposal;
        await web3wallet.rejectSession({
            id,
            reason: {
                code: 1,
                message: 'User rejected the session'
            }
        });
        console.log('Session rejected');
    } catch (error) {
        console.error('Error rejecting session:', error);
        throw error;
    }
}
