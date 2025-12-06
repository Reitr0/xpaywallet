import { web3wallet } from './WalletConnectClient';
import { WalletFactory } from '@modules/core/factory/WalletFactory';

export class WalletConnectSessionManager {
    constructor() {
        this.currentProposal = null;
        this.currentRequest = null;
        this.sessions = new Map();
        this.onSessionProposal = null; // Callback for showing modal
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (!web3wallet) {
            console.log('🔌 web3wallet not available yet, will retry later');
            // Retry after a short delay
            setTimeout(() => {
                this.setupEventListeners();
            }, 1000);
            return;
        }

        console.log('🔌 WalletConnectSessionManager: Event listeners disabled - handled by DAppsDetailScreen');
        
        // Event listeners are now handled directly in DAppsDetailScreen
        // to avoid conflicts and ensure proper popup display
        // This prevents duplicate event handling and response conflicts
    }

    // Method to ensure event listeners are set up after web3wallet is initialized
    ensureEventListeners() {
        if (!web3wallet) {
            console.log('🔌 web3wallet still not available');
            return;
        }
        
        // Check if listeners are already set up
        if (this.listenersSetup) {
            console.log('🔌 Event listeners already set up');
            return;
        }
        
        this.setupEventListeners();
        this.listenersSetup = true;
        console.log('🔌 Event listeners setup completed');
    }

    /**
     * Manually trigger event listener setup
     * Call this when WalletConnect client is ready
     */
    retrySetupEventListeners() {
        console.log('🔌 Manually retrying event listener setup');
        this.setupEventListeners();
    }

    handleSessionProposal(proposal) {
        // Store the proposal for later approval/rejection
        this.currentProposal = proposal;
        
        // Show approval modal instead of auto-approving
        if (this.onSessionProposal) {
            this.onSessionProposal(proposal);
        } else {
            console.warn('No session proposal handler set. Auto-approving for testing.');
            this.autoApproveSession(proposal);
        }
    }

    async approveSession(proposal) {
        try {
            console.log('🔌 Starting session approval process...');
            console.log('🔌 Full proposal object:', proposal);
            
            if (!proposal || !proposal.id) {
                throw new Error('Invalid proposal: missing id');
            }
            
            const { id, params } = proposal;
            const { requiredNamespaces, optionalNamespaces } = params;
            
            console.log('🔌 Proposal ID:', id);
            console.log('🔌 Required namespaces:', requiredNamespaces);
            console.log('🔌 Optional namespaces:', optionalNamespaces);
            
            // Determine the correct chain from the DApp request
            let targetChain = 'BSC'; // Default to BSC
            let walletAddress = '0x1234567890123456789012345678901234567890';
            
            // Check if DApp requested specific chains
            if (requiredNamespaces.eip155?.chains && requiredNamespaces.eip155.chains.length > 0) {
                const requestedChainId = requiredNamespaces.eip155.chains[0];
                console.log('🔌 DApp requested chain ID:', requestedChainId);
                
                // Map chain ID to chain name
                const chainIdToName = {
                    '1': 'ETH',
                    '56': 'BSC', 
                    '137': 'POLYGON',
                    '42161': 'ARB',
                    '199': 'BTTC'
                };
                
                targetChain = chainIdToName[requestedChainId] || 'BSC';
                console.log('🔌 Mapped to chain:', targetChain);
            }
            
            // Get wallet for the correct chain
            const wallet = await WalletFactory.getWallet(targetChain);
            if (wallet && wallet.data && wallet.data.walletAddress) {
                walletAddress = wallet.data.walletAddress;
                console.log('🔌 Found wallet for chain', targetChain, ':', walletAddress);
            } else {
                console.warn('🔌 No wallet found for chain', targetChain, ', using default address');
            }
            
            // Build namespaces based on what the DApp requested
            const namespaces = {};
            
            // Handle EIP155 namespace
            if (requiredNamespaces.eip155 || optionalNamespaces.eip155) {
                const eip155Config = requiredNamespaces.eip155 || optionalNamespaces.eip155;
                const accounts = [];
                
                // Add accounts for all requested chains
                if (eip155Config.chains) {
                    eip155Config.chains.forEach(chain => {
                        // Check if chain already has eip155: prefix
                        const chainId = chain.startsWith('eip155:') ? chain : `eip155:${chain}`;
                        accounts.push(`${chainId}:${walletAddress}`);
                        console.log('🔌 Added account:', `${chainId}:${walletAddress}`);
                    });
                } else {
                    // Default to BSC (chain 56) if no chains specified
                    accounts.push(`eip155:56:${walletAddress}`);
                    console.log('🔌 Added default account:', `eip155:56:${walletAddress}`);
                }
                
                namespaces.eip155 = {
                    accounts,
                    methods: eip155Config.methods || [
                        'eth_sendTransaction',
                        'eth_signTransaction', 
                        'eth_sign',
                        'personal_sign',
                        'eth_signTypedData',
                        'eth_signTypedData_v3',
                        'eth_signTypedData_v4',
                        'eth_requestAccounts',
                        'eth_accounts',
                        'eth_chainId',
                        'eth_getBalance',
                        'eth_getTransactionCount',
                        'eth_getTransactionReceipt',
                        'eth_sendRawTransaction',
                        'eth_blockNumber',
                        'eth_getCode',
                        'eth_getStorageAt',
                        'eth_call',
                        'eth_estimateGas',
                        'eth_gasPrice',
                        'wallet_getCapabilities'
                    ],
                    events: eip155Config.events || ['chainChanged', 'accountsChanged']
                };
                
                console.log('🔌 EIP155 namespace configured:', namespaces.eip155);
            }
            
            console.log('🔌 Final namespaces:', namespaces);
            
            // Create session with timeout protection
            console.log('🔌 Calling web3wallet.approveSession with:', { id, namespaces });
            
            const approvalPromise = web3wallet.approveSession({
                id,
                namespaces
            });
            
            // Add timeout protection (15 seconds)
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Session approval timeout')), 15000);
            });
            
            const session = await Promise.race([approvalPromise, timeoutPromise]);
            
            console.log('✅ Session approved successfully:', session);
            this.sessions.set(session.topic, session);
            this.currentProposal = null;
            return session;
        } catch (error) {
            console.error('❌ Error approving session:', error);
            console.error('❌ Error details:', error.message, error.stack);
            console.error('❌ Proposal that failed:', proposal);
            
            // Check if it's a "No matching key" error
            if (error.message && error.message.includes('No matching key')) {
                console.error('❌ Proposal key mismatch - proposal may have expired or been processed already');
                console.error('❌ Proposal ID:', proposal?.id);
            }
            
            this.currentProposal = null;
            throw error;
        }
    }

    async autoApproveSession(proposal) {
        // Fallback method for auto-approval (used when no modal handler is set)
        return this.approveSession(proposal);
    }

    handleSessionRequest(request) {
        // Store the request for later handling
        this.currentRequest = request;
        
        // You can emit an event or call a callback here to show transaction approval modal
        // For now, we'll auto-approve for testing
        this.autoApproveRequest(request);
    }

    async autoApproveRequest(request) {
        try {
            const { id, topic, params } = request;
            const { request: { method, params: requestParams } } = params;
            
            console.log('Handling request:', method, requestParams);
            
            let result;
            
            switch (method) {
                case 'eth_requestAccounts':
                    // Try to get wallet from any available chain
                    let wallet = await WalletFactory.getWallet('BSC') || 
                                await WalletFactory.getWallet('ETH') || 
                                await WalletFactory.getWallet('POLYGON');
                    result = [wallet?.data?.walletAddress || '0x1234567890123456789012345678901234567890'];
                    break;
                    
                case 'eth_accounts':
                    // Try to get wallet from any available chain
                    let wallet2 = await WalletFactory.getWallet('BSC') || 
                                 await WalletFactory.getWallet('ETH') || 
                                 await WalletFactory.getWallet('POLYGON');
                    result = [wallet2?.data?.walletAddress || '0x1234567890123456789012345678901234567890'];
                    break;
                    
                case 'eth_chainId':
                    // Return the chain ID based on the session's namespace
                    const session = this.sessions.get(topic);
                    if (session && session.namespaces?.eip155?.accounts?.length > 0) {
                        const account = session.namespaces.eip155.accounts[0];
                        const chainId = account.split(':')[1];
                        result = `0x${parseInt(chainId).toString(16)}`;
                    } else {
                        result = '0x38'; // Default to BSC
                    }
                    break;
                    
                case 'wallet_getCapabilities':
                    // Return wallet capabilities
                    result = {
                        supportedNamespaces: ['eip155'],
                        features: {
                            'eip155': {
                                supportedMethods: [
                                    'eth_sendTransaction',
                                    'eth_signTransaction', 
                                    'eth_sign',
                                    'personal_sign',
                                    'eth_signTypedData',
                                    'eth_signTypedData_v3',
                                    'eth_signTypedData_v4',
                                    'eth_requestAccounts',
                                    'eth_accounts',
                                    'eth_chainId',
                                    'eth_getBalance',
                                    'eth_getTransactionCount',
                                    'eth_getTransactionReceipt',
                                    'eth_sendRawTransaction',
                                    'eth_blockNumber',
                                    'eth_getCode',
                                    'eth_getStorageAt',
                                    'eth_call',
                                    'eth_estimateGas',
                                    'eth_gasPrice'
                                ],
                                supportedEvents: ['chainChanged', 'accountsChanged'],
                                supportedChains: ['eip155:1', 'eip155:56', 'eip155:137', 'eip155:42161']
                            }
                        }
                    };
                    break;
                    
                case 'eth_getBalance':
                    result = '0x0'; // Return 0 balance for now
                    break;
                    
                default:
                    result = null;
                    break;
            }
            
            if (result !== null) {
                await web3wallet.respondSessionRequest({
                    topic,
                    response: {
                        id,
                        result
                    }
                });
                console.log('Request approved:', method, result);
            } else {
                await web3wallet.respondSessionRequest({
                    topic,
                    response: {
                        id,
                        error: {
                            code: 4200,
                            message: `Method ${method} not supported`
                        }
                    }
                });
                console.log('Request rejected:', method);
            }
        } catch (error) {
            console.error('Error handling request:', error);
        }
    }

    async rejectSession(proposal) {
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
            this.currentProposal = null;
        } catch (error) {
            console.error('Error rejecting session:', error);
            throw error;
        }
    }

    getCurrentProposal() {
        return this.currentProposal;
    }

    getCurrentRequest() {
        return this.currentRequest;
    }

    getSessions() {
        return Array.from(this.sessions.values());
    }

    clearCurrentProposal() {
        this.currentProposal = null;
    }

    clearCurrentRequest() {
        this.currentRequest = null;
    }
}

// Export singleton instance
export const walletConnectSessionManager = new WalletConnectSessionManager();
