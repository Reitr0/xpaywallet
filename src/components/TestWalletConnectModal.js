import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import WalletConnectSessionModal from './WalletConnectSessionModal';
import { walletConnectSessionManager } from '@modules/walletconnect/WalletConnectSessionManager';

const TestWalletConnectModal = () => {
    const [showModal, setShowModal] = useState(false);

    const triggerTestModal = () => {
        // Create a mock proposal for testing
        const mockProposal = {
            id: 'test-proposal-123',
            params: {
                proposer: {
                    metadata: {
                        name: 'PancakeSwap - Everyone\'s Favorite DEX',
                        url: 'https://pancakeswap.finance',
                        icons: ['https://pancakeswap.finance/favicon.ico']
                    }
                },
                requiredNamespaces: {
                    eip155: {
                        chains: ['eip155:1', 'eip155:56', 'eip155:137'],
                        methods: [
                            'eth_accounts',
                            'eth_requestAccounts',
                            'eth_sendTransaction',
                            'eth_sign',
                            'eth_signTypedData',
                            'personal_sign'
                        ]
                    }
                },
                optionalNamespaces: {
                    eip155: {
                        chains: ['eip155:42161', 'eip155:10'],
                        methods: ['eth_getBalance', 'eth_blockNumber']
                    }
                }
            }
        };

        // Trigger the session proposal event
        if (walletConnectSessionManager.onSessionProposal) {
            walletConnectSessionManager.onSessionProposal(mockProposal);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.button} 
                onPress={triggerTestModal}
            >
                <View style={styles.buttonText}>
                    Test WalletConnect Modal
                </View>
            </TouchableOpacity>
            
            <WalletConnectSessionModal />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TestWalletConnectModal;
