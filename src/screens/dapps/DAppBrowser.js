import React, { useEffect, useState, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { ethers } from 'ethers';
import { View, StyleSheet, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import CommonText from '@components/commons/CommonText';
import CommonButton from '@components/commons/CommonButton';
import WalletConnectionModal from '@components/WalletConnectionModal';
import WalletConnectionStatus from '@components/WalletConnectionStatus';
import { walletConnectionProvider } from '@modules/walletconnect/WalletConnectionProvider';
import { WalletConnectConnectionAction } from '@persistence/walletconnect/WalletConnectConnectionAction';

export default function DAppBrowser() {
    const { theme } = useSelector(state => state.ThemeReducer);
    const { activeConnections } = useSelector(state => state.WalletConnectConnectionReducer);
    const dispatch = useDispatch();
    
    const webViewRef = useRef(null);
    const [showConnectionModal, setShowConnectionModal] = useState(false);
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [currentChain, setCurrentChain] = useState('ETH');
    const [currentUrl, setCurrentUrl] = useState('https://pancakeswap.finance/swap');

    useEffect(() => {
        // Load existing connections
        dispatch(WalletConnectConnectionAction.getConnections());
    }, [dispatch]);

    useEffect(() => {
        // Check if wallet is connected for current chain
        const isConnected = walletConnectionProvider.isWalletConnected(currentChain);
        setIsWalletConnected(isConnected);
    }, [currentChain, activeConnections]);

    const handleWalletConnected = async (connectionData) => {
        try {
            // Save connection to persistence
            await dispatch(WalletConnectConnectionAction.saveConnection({
                id: `conn_${Date.now()}`,
                chain: connectionData.chain,
                address: connectionData.address,
                walletId: connectionData.walletId,
                connectedAt: connectionData.connectedAt,
                metadata: {
                    url: currentUrl,
                    userAgent: 'XPayWallet',
                },
            }));

            setIsWalletConnected(true);
            setCurrentChain(connectionData.chain);
            
            // Reload WebView with new connection
            if (webViewRef.current) {
                webViewRef.current.reload();
            }
        } catch (error) {
            console.error('Error saving connection:', error);
            Alert.alert('Error', 'Failed to save wallet connection');
        }
    };

    const handleDisconnect = () => {
        walletConnectionProvider.disconnectWallet(currentChain);
        setIsWalletConnected(false);
        
        // Reload WebView
        if (webViewRef.current) {
            webViewRef.current.reload();
        }
    };

    const handleSwitchWallet = () => {
        setShowConnectionModal(true);
    };

    const handleUrlChange = (url) => {
        setCurrentUrl(url);
    };

    // Generate injected JavaScript using the wallet connection provider
    const getInjectedJavaScript = () => {
        return walletConnectionProvider.generateInjectedJavaScript();
    };

    // Handle messages from WebView
    const handleMessage = async (event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            
            if (message.type === 'eth_request') {
                const { method, params, id } = message;
                let result;
                let error = null;

                try {
                    result = await walletConnectionProvider.handleRequest(method, params);
                } catch (err) {
                    error = err.message;
                    console.error(`Error handling ${method}:`, err);
                }

                // Inject response back into WebView
                const responseScript = `
                    window.postMessage({
                        id: '${id}',
                        result: ${error ? 'null' : JSON.stringify(result)},
                        error: ${error ? JSON.stringify(error) : 'null'}
                    });
                `;
                
                if (webViewRef.current) {
                    webViewRef.current.injectJavaScript(responseScript);
                }
            }
        } catch (parseError) {
            console.error('Failed to parse message:', parseError);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Wallet Connection Status */}
            {isWalletConnected ? (
                <WalletConnectionStatus
                    onDisconnect={handleDisconnect}
                    onSwitchWallet={handleSwitchWallet}
                />
            ) : (
                <View style={[styles.connectPrompt, { backgroundColor: theme.background2 }]}>
                    <CommonText style={[styles.connectText, { color: theme.text }]}>
                        Connect your wallet to interact with DApps
                    </CommonText>
                    <CommonButton
                        text="Connect Wallet"
                        onPress={() => setShowConnectionModal(true)}
                        style={[styles.connectButton, { backgroundColor: theme.button }]}
                    />
                </View>
            )}

            {/* WebView */}
            <WebView
                ref={webViewRef}
                source={{ uri: currentUrl }}
                injectedJavaScriptBeforeContentLoaded={getInjectedJavaScript()}
                onMessage={handleMessage}
                onNavigationStateChange={(navState) => handleUrlChange(navState.url)}
                javaScriptEnabled={true}
                originWhitelist={['*']}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                style={styles.webView}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <CommonText style={[styles.loadingText, { color: theme.text }]}>
                            Loading DApp...
                        </CommonText>
                    </View>
                )}
            />

            {/* Wallet Connection Modal */}
            <WalletConnectionModal
                visible={showConnectionModal}
                onClose={() => setShowConnectionModal(false)}
                onWalletConnected={handleWalletConnected}
                selectedChain={currentChain}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    connectPrompt: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    connectButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    webView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        marginTop: 10,
    },
});