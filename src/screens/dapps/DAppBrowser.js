import React, { useEffect, useState, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { ethers } from 'ethers'; // Make sure to install ethers: yarn add ethers@5 (or latest compatible version)
import { View, TextInput, Button, StyleSheet } from 'react-native';

export default function DAppBrowser() {
    const webViewRef = useRef(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [address, setAddress] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [inputPrivateKey, setInputPrivateKey] = useState('');

    useEffect(() => {
        // Set up BSC provider (signer will be set dynamically when private key is provided)
        const prov = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
        setProvider(prov);
    }, []);

    const handleSetPrivateKey = () => {
        if (inputPrivateKey) {
            try {
                const sign = new ethers.Wallet(inputPrivateKey, provider);
                setSigner(sign);
                sign.getAddress().then(addr => setAddress(addr.toLowerCase()));
                setPrivateKey(inputPrivateKey);
                setInputPrivateKey(''); // Clear input for security
                alert('Private key set successfully. Address: ' + addr);
            } catch (error) {
                alert('Invalid private key: ' + error.message);
            }
        } else {
            alert('Please enter a private key.');
        }
    };

    // Script to inject into WebView: Creates a proxy window.ethereum that communicates via postMessage
    const injectedJavaScript = `
        (function() {
            // Add viewport meta for better mobile rendering
            const meta = document.createElement('meta');
            meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
            meta.setAttribute('name', 'viewport');
            document.getElementsByTagName('head')[0].appendChild(meta);

            // Proxy Ethereum provider (EIP-1193 compatible)
            window.ethereum = {
                chainId: '0x38',  // BSC chain ID in hex
                networkVersion: 56,  // BSC chain ID
                selectedAddress: '${address}',
                isMetaMask: true,  // Many DApps check for this
                enable: function() {
                    return Promise.resolve(['${address}']);
                },
                request: function(args) {
                    return new Promise((resolve, reject) => {
                        const id = Math.random().toString(36).substring(7);  // Unique request ID
                        // Listener for response from native
                        const handler = (event) => {
                            if (event.data && event.data.id === id) {
                                if (event.data.error) {
                                    reject(new Error(event.data.error));
                                } else {
                                    resolve(event.data.result);
                                }
                                window.removeEventListener('message', handler);
                            }
                        };
                        window.addEventListener('message', handler);
                        // Send request to native
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'eth_request',
                            args: args,
                            id: id
                        }));
                    });
                }
            };
            // Dispatch events to notify DApp that ethereum is ready
            window.dispatchEvent(new Event('ethereum#initialized'));
            const event = new CustomEvent('load');
            window.dispatchEvent(event);
        })();
        true;  // Required for injectedJavaScriptBeforeContentLoaded
    `;

    // Handle messages from WebView
    async function handleMessage(event) {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'eth_request' && signer && provider) {
                const { method, params } = message.args;
                const id = message.id;
                let result;
                let error = null;

                try {
                    switch (method) {
                        case 'eth_chainId':
                            result = '0x38';
                            break;
                        case 'net_version':
                            result = '56';
                            break;
                        case 'eth_accounts':
                        case 'eth_requestAccounts':
                            result = [address];
                            break;
                        case 'personal_sign':
                            // params: [message, address, password?]
                            const [msg, from] = params;
                            if (from.toLowerCase() !== address) throw new Error('Address mismatch');
                            result = await signer.signMessage(ethers.utils.arrayify(msg));
                            break;
                        case 'eth_sign':
                            // Similar to personal_sign, but params: [address, message]
                            const [fromSign, msgSign] = params;
                            if (fromSign.toLowerCase() !== address) throw new Error('Address mismatch');
                            result = await signer.signMessage(ethers.utils.arrayify(msgSign));
                            break;
                        case 'eth_signTransaction':
                            // params: [transaction]
                            const tx = params[0];
                            result = await signer.signTransaction(tx);
                            break;
                        case 'eth_sendTransaction':
                            // params: [transaction]
                            const txParams = params[0];
                            const signedTx = await signer.signTransaction(txParams);
                            const txResponse = await provider.sendTransaction(signedTx);
                            result = txResponse.hash;  // Return transaction hash
                            break;
                        // For other RPC methods, forward to provider
                        default:
                            result = await provider.send(method, params || []);
                            break;
                    }
                } catch (err) {
                    error = err.message;
                }

                // Inject response back into WebView
                const responseScript = `
                    window.postMessage({
                        id: '${id}',
                        result: ${error ? 'null' : JSON.stringify(result)},
                        error: ${error ? JSON.stringify(error) : 'null'}
                    });
                `;
                webViewRef.current.injectJavaScript(responseScript);
            }
        } catch (parseError) {
            console.error('Failed to parse message:', parseError);
        }
    }

    return (
        <View style={styles.container}>
            {!privateKey ? (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your private key (for testing only)"
                        secureTextEntry={true}
                        value={inputPrivateKey}
                        onChangeText={setInputPrivateKey}
                    />
                    <Button title="Set Private Key" onPress={handleSetPrivateKey} />
                </View>
            ) : (
                <WebView
                    ref={webViewRef}
                    source={{ uri: 'https://pancakeswap.finance/swap' }}  // Example BSC DApp (PancakeSwap)
                    injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
                    onMessage={handleMessage}
                    javaScriptEnabled={true}
                    originWhitelist={['*']}
                    allowsInlineMediaPlayback={true}  // Optional for better UX
                    mediaPlaybackRequiresUserAction={false}
                    style={{ flex: 1 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inputContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 10,
    },
});