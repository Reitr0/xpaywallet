import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    StyleSheet,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import CommonText from '@components/commons/CommonText';
import ActionSheet from 'react-native-actions-sheet';
import WebView from 'react-native-webview';
import CommonButton from '@components/commons/CommonButton';
import CommonLoading from '@components/commons/CommonLoading';
import CommonBackButton from '@components/commons/CommonBackButton';
import {
    createWeb3Wallet,
    onConnect,
    web3wallet,
} from '@modules/walletconnect/WalletConnectClient';
import { EIP155_SIGNING_METHODS } from '@modules/walletconnect/EIP155';
import { getSignParamsMessage } from '@modules/walletconnect/HelperUtils';
import {
    approveEIP155Request,
    rejectEIP155Request,
} from '@modules/walletconnect/EIP155Request';
import { WalletFactory } from '@modules/core/factory/WalletFactory';
import { getSdkError } from '@walletconnect/utils';
import _ from 'lodash';
import { CHAIN_ID_TYPE_MAP } from '@modules/core/constant/constant';
import { WalletConnectAction } from '@persistence/walletconnect/WalletConnectAction';
import CommonAlert from '@components/commons/CommonAlert';
import { useTranslation } from 'react-i18next';

export default function DAppsDetailScreen({ navigation, route }) {
    const { item } = route.params;
    const { theme } = useSelector(state => state.ThemeReducer);
    const { walletConnectSites } = useSelector(state => state.WalletConnectReducer);
    const dispatch = useDispatch();
    const { t } = useTranslation();

    const approvalSessionModal = useRef(null);
    const approvalRequestModal = useRef(null);
    const webRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [uri, setUri] = useState('');
    const [pairingProposal, setPairingProposal] = useState(null);
    const [requestEventData, setRequestEventData] = useState(null);
    const [requestSession, setRequestSession] = useState(null);
    const [requiredNamespaces, setRequiredNamespaces] = useState({});
    const [activeChain, setActiveChain] = useState('');

    // Initialize WalletConnect
    useEffect(() => {
        const initWalletConnect = async () => {
            try {
                console.log('Initializing WalletConnect...');
                await createWeb3Wallet();
                web3wallet.on('session_proposal', onSessionProposal);
                web3wallet.on('session_request', onSessionRequest);
                web3wallet.on('session_delete', onSessionDelete);
                console.log('WalletConnect initialized successfully');
            } catch (error) {
                console.error('WalletConnect initialization failed:', error);
                CommonAlert.show({
                    title: t('alert.error'),
                    message: t('walletconnect.init_error'),
                    type: 'error',
                });
            } finally {
                CommonLoading.hide();
            }
        };

        initWalletConnect();
        return () => {
            console.log('Cleaning up WalletConnect listeners');
            web3wallet.off('session_proposal', onSessionProposal);
            web3wallet.off('session_request', onSessionRequest);
            web3wallet.off('session_delete', onSessionDelete);
        };
    }, [t]);

    // Handle session deletion
    const onSessionDelete = useCallback(() => {
        console.log('Session deleted');
        setLoading(false);
        setUri('');
        setPairingProposal(null);
        setRequestEventData(null);
        setRequestSession(null);
        dispatch(WalletConnectAction.remove(uri));
        CommonAlert.show({
            title: t('walletconnect.session_disconnected'),
            message: t('walletconnect.session_disconnected_message'),
            type: 'info',
        });
    }, [uri, dispatch, t]);

    // Improved JavaScript injection for WalletConnect URI extraction
    const injectedJavaScript = `
    (function() {
      console.log('Injecting JavaScript for WalletConnect URI extraction');
      let open = false;
      const attemptUriExtraction = () => {
        try {
          // Standard WalletConnect modal
          const wcmModal = document.querySelector('body wcm-modal');
          if (wcmModal) {
            const wcmRouter = wcmModal.shadowRoot?.querySelector('wcm-modal-router');
            const wcmQrCodeView = wcmRouter?.shadowRoot?.querySelector('wcm-qrcode-view');
            const wcmModalContent = wcmQrCodeView?.shadowRoot?.querySelector('wcm-modal-content');
            const wcmWalletConnectQr = wcmModalContent?.querySelector('wcm-walletconnect-qr');
            const qrCode = wcmWalletConnectQr?.shadowRoot?.querySelector('wcm-qrcode');
            const uri = qrCode?.getAttribute('uri');
            if (uri) {
              console.log('Found WalletConnect URI:', uri);
              window.ReactNativeWebView.postMessage(uri);
              return true;
            }
          }
          // Fallback for other DApp implementations
          const uriElements = document.querySelectorAll('[data-wc-uri], [uri], [data-uri]');
          for (let el of uriElements) {
            const uri = el.getAttribute('data-wc-uri') || el.getAttribute('uri') || el.getAttribute('data-uri');
            if (uri && uri.startsWith('wc:')) {
              console.log('Found fallback WalletConnect URI:', uri);
              window.ReactNativeWebView.postMessage(uri);
              return true;
            }
          }
          // Fallback for direct URI in DOM
          const textNodes = document.evaluate("//text()[contains(., 'wc:')]", document, null, XPathResult.ANY_TYPE, null);
          let node = textNodes.iterateNext();
          while (node) {
            if (node.textContent.includes('wc:')) {
              const match = node.textContent.match(/wc:[^@]+@2/);
              if (match) {
                console.log('Found text-based WalletConnect URI:', match[0]);
                window.ReactNativeWebView.postMessage(match[0]);
                return true;
              }
            }
            node = textNodes.iterateNext();
          }
          return false;
        } catch (error) {
          console.error('URI extraction error:', error);
          window.ReactNativeWebView.postMessage('Error: ' + error.message);
          return false;
        }
      };

      const observer = new MutationObserver(() => {
        if (!open) {
          open = true;
          setTimeout(() => {
            if (attemptUriExtraction()) {
              observer.disconnect();
            }
          }, 500);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      window.addEventListener('click', () => attemptUriExtraction());
    })();
    true;
  `;

    // Handle WebView errors
    const onBrowserError = useCallback(
        syntheticEvent => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
            CommonAlert.show({
                title: t('alert.error'),
                message: t('webview.error'),
                type: 'error',
            });
            CommonLoading.hide();
        },
        [t],
    );

    // Handle WebView messages
    const onBrowserMessage = useCallback(
        async event => {
            const data = event.nativeEvent.data;
            console.log('Received WebView message:', data);
            if (data.startsWith('Error')) {
                console.error('WebView message error:', data);
                CommonAlert.show({
                    title: t('alert.error'),
                    message: data,
                    type: 'error',
                });
                CommonLoading.hide();
                return;
            }

            if (!loading && data.startsWith('wc:')) {
                setLoading(true);
                try {
                    console.log('Attempting to pair with URI:', data);
                    await pair(data);
                } catch (error) {
                    console.error('Pairing error:', error);
                    CommonAlert.show({
                        title: t('alert.error'),
                        message: t('walletconnect.pairing_error'),
                        type: 'error',
                    });
                } finally {
                    setLoading(false);
                    CommonLoading.hide();
                }
            }
        },
        [loading, t],
    );

    // Pair with WalletConnect URI
    const pair = useCallback(
        async wcUri => {
            try {
                const cleanUri = wcUri.replace('amp;', '');
                console.log('Pairing with cleaned URI:', cleanUri);
                setUri(getUri(cleanUri));
                await onConnect({ uri: cleanUri });
                console.log('Pairing successful');
            } catch (error) {
                console.error('WalletConnect pairing failed:', error);
                CommonAlert.show({
                    title: t('alert.error'),
                    message: t('walletconnect.pairing_error'),
                    type: 'error',
                });
                throw error;
            }
        },
        [t],
    );

    // Handle session proposal
    const onSessionProposal = useCallback(
        proposal => {
            console.log('Received session proposal:', JSON.stringify(proposal, null, 2));
            setPairingProposal(proposal);
            const { params } = proposal;
            const { requiredNamespaces, optionalNamespaces } = params;
            const currentNamespaces = _.isEmpty(requiredNamespaces)
                ? optionalNamespaces
                : requiredNamespaces;
            setRequiredNamespaces(currentNamespaces);

            const chains = currentNamespaces.eip155?.chains || [];
            if (!chains.length) {
                console.error('No chains provided in session proposal');
                CommonAlert.show({
                    title: t('alert.error'),
                    message: t('walletconnect.no_chains'),
                    type: 'error',
                });
                return;
            }

            setActiveChain(chains[0].split(':')[1] || '1'); // Default to Ethereum mainnet
            approvalSessionModal.current?.show();
        },
        [t],
    );

    // Handle session request
    const onSessionRequest = useCallback(
        async requestEvent => {
            console.log('Received session request:', JSON.stringify(requestEvent, null, 2));
            const { topic, params } = requestEvent;
            const { request } = params;
            const session = web3wallet.engine.signClient.session.get(topic);

            if (!session) {
                console.error('Invalid session for request:', topic);
                CommonAlert.show({
                    title: t('alert.error'),
                    message: t('walletconnect.invalid_session'),
                    type: 'error',
                });
                return;
            }

            setRequestSession(session);
            setRequestEventData(requestEvent);

            const supportedMethods = [
                EIP155_SIGNING_METHODS.ETH_SIGN,
                EIP155_SIGNING_METHODS.PERSONAL_SIGN,
                EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA,
                EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3,
                EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4,
                EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION,
                EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION,
            ];

            if (supportedMethods.includes(request.method)) {
                approvalRequestModal.current?.show();
            } else {
                console.warn('Unsupported method:', request.method);
                CommonAlert.show({
                    title: t('alert.error'),
                    message: t('walletconnect.unsupported_method'),
                    type: 'error',
                });
                await onRejectRequest(requestEvent);
            }
        },
        [t],
    );

    // Approve session
    const handleAccept = useCallback(async () => {
        if (!pairingProposal) {
            console.error('No pairing proposal available');
            return;
        }

        try {
            CommonLoading.show();
            const { id, params } = pairingProposal;
            const { requiredNamespaces, optionalNamespaces, relays } = params;
            const currentNamespaces = _.isEmpty(requiredNamespaces)
                ? optionalNamespaces
                : requiredNamespaces;

            const chainId = activeChain || '1';
            console.log('Approving session for chain:', chainId);
            const wallet = await WalletFactory.getWallet(CHAIN_ID_TYPE_MAP[chainId]);

            if (!wallet) {
                console.error('Wallet not found for chain:', chainId);
                CommonAlert.show({
                    title: t('alert.error'),
                    message: t('walletconnect.unsupported_network'),
                    type: 'error',
                });
                return;
            }

            const namespaces = {};
            Object.keys(currentNamespaces).forEach(key => {
                const accounts = currentNamespaces[key].chains.map(chain =>
                    `${chain}:${wallet.data.walletAddress}`,
                );
                namespaces[key] = {
                    accounts,
                    methods: currentNamespaces[key].methods,
                    events: currentNamespaces[key].events,
                };
            });

            const approveSession = {
                id,
                relayProtocol: relays[0].protocol,
                namespaces,
            };

            console.log('Approving session:', JSON.stringify(approveSession, null, 2));
            await web3wallet.approveSession(approveSession);
            dispatch(
                WalletConnectAction.add({
                    [uri]: {
                        chain: CHAIN_ID_TYPE_MAP[chainId],
                        approveSession,
                        pairingProposal,
                    },
                }),
            );
            console.log('Session approved successfully');
            approvalSessionModal.current?.hide();
        } catch (error) {
            console.error('Session approval failed:', error);
            CommonAlert.show({
                title: t('alert.error'),
                message: t('walletconnect.approval_error'),
                type: 'error',
            });
        } finally {
            CommonLoading.hide();
        }
    }, [pairingProposal, activeChain, uri, dispatch, t]);

    // Reject session
    const handleDecline = useCallback(async () => {
        if (!pairingProposal) {
            console.error('No pairing proposal to reject');
            return;
        }

        try {
            console.log('Rejecting session:', pairingProposal.id);
            await web3wallet.rejectSession({
                id: pairingProposal.id,
                reason: getSdkError('USER_REJECTED_METHODS'),
            });
            approvalSessionModal.current?.hide();
            console.log('Session rejected successfully');
        } catch (error) {
            console.error('Session rejection failed:', error);
            CommonAlert.show({
                title: t('alert.error'),
                message: t('walletconnect.rejection_error'),
                type: 'error',
            });
        }
    }, [pairingProposal, t]);

    // Approve request
    const onApproveRequest = useCallback(async () => {
        if (!requestEventData || !activeChain) {
            console.error('No request event data or active chain');
            return;
        }

        try {
            CommonLoading.show();
            const wallet = await WalletFactory.getWallet(activeChain);
            if (!wallet) {
                throw new Error('Wallet not found for chain: ' + activeChain);
            }

            console.log('Approving request:', JSON.stringify(requestEventData, null, 2));
            const response = await approveEIP155Request(requestEventData, wallet.signer);
            await web3wallet.respondSessionRequest({
                topic: requestEventData.topic,
                response,
            });
            console.log('Request approved successfully');
            approvalRequestModal.current?.hide();
        } catch (error) {
            console.error('Request approval failed:', error);
            CommonAlert.show({
                title: t('alert.error'),
                message: t('walletconnect.request_approval_error'),
                type: 'error',
            });
        } finally {
            CommonLoading.hide();
        }
    }, [requestEventData, activeChain, t]);

    // Reject request
    const onRejectRequest = useCallback(
        async (event = requestEventData) => {
            if (!event || !activeChain) {
                console.error('No event or active chain for rejection');
                return;
            }

            try {
                CommonLoading.show();
                const wallet = await WalletFactory.getWallet(activeChain);
                if (!wallet) {
                    throw new Error('Wallet not found for chain: ' + activeChain);
                }

                console.log('Rejecting request:', event.id);
                const response = rejectEIP155Request(event, wallet.signer);
                await web3wallet.respondSessionRequest({
                    topic: event.topic,
                    response,
                });
                console.log('Request rejected successfully');
                approvalRequestModal.current?.hide();
            } catch (error) {
                console.error('Request rejection failed:', error);
                CommonAlert.show({
                    title: t('alert.error'),
                    message: t('walletconnect.request_rejection_error'),
                    type: 'error',
                });
            } finally {
                CommonLoading.hide();
            }
        },
        [requestEventData, activeChain, t],
    );

    // Handle WebView navigation
    const onShouldStartLoad = useCallback(
        event => {
            const url = event.url;
            console.log('WebView navigating to:', url);
            if (!url.startsWith('https:')) {
                if (!loading) {
                    setLoading(true);
                    try {
                        const currentSite = walletConnectSites[getUri(url)];
                        if (!currentSite) {
                            console.log('New WalletConnect URI detected, pairing:', url);
                            pair(url);
                        } else {
                            console.log('Restoring existing session for URI:', url);
                            setActiveChain(currentSite.chain);
                            setUri(getUri(url));
                            setPairingProposal(currentSite.pairingProposal);
                            setRequiredNamespaces(
                                _.isEmpty(currentSite.pairingProposal.params.requiredNamespaces)
                                    ? currentSite.pairingProposal.params.optionalNamespaces
                                    : currentSite.pairingProposal.params.requiredNamespaces,
                            );
                            setRequestSession(currentSite.requestSession);
                        }
                    } catch (error) {
                        console.error('Navigation handling error:', error);
                        CommonAlert.show({
                            title: t('alert.error'),
                            message: t('walletconnect.navigation_error'),
                            type: 'error',
                        });
                    } finally {
                        setLoading(false);
                    }
                }
                return false;
            }
            return true;
        },
        [loading, walletConnectSites, pair, t],
    );

    // Extract WalletConnect URI
    const getUri = url => {
        const match = url.match(/wc:([^@]+)@2/);
        const extractedUri = match?.[1] || '';
        console.log('Extracted URI:', extractedUri);
        return extractedUri;
    };

    // Custom user agent for WebView to mimic a browser
    const userAgent = Platform.select({
        ios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        android:
            'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36',
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background4 }]}>
            <View style={styles.header}>
                <View style={styles.leftHeader}>
                    <CommonBackButton
                        onPress={() => navigation.goBack()}
                        color={theme.text}
                    />
                </View>
                <View style={styles.contentHeader}>
                    <CommonText style={styles.headerTitle}>{item.name}</CommonText>
                </View>
            </View>
            <View style={styles.content}>
                <WebView
                    ref={webRef}
                    originWhitelist={['*']}
                    source={{ uri: item.url }}
                    onError={onBrowserError}
                    onMessage={onBrowserMessage}
                    onShouldStartLoadWithRequest={onShouldStartLoad}
                    setSupportMultipleWindows={false}
                    renderLoading={() => <ActivityIndicator size="large" color={theme.primary} />}
                    injectedJavaScript={injectedJavaScript}
                    javaScriptEnabled
                    domStorageEnabled
                    allowFileAccess
                    allowUniversalAccessFromFileURLs
                    allowingReadAccessToURL={item.url}
                    mixedContentMode="always"
                    thirdPartyCookiesEnabled
                    userAgent={userAgent}
                    onConsoleMessage={e => console.log('WebView console:', e.message)}
                />
            </View>
            <ActionSheet
                ref={approvalSessionModal}
                headerAlwaysVisible
                isModal={Platform.OS === 'android'}
                useBottomSafeAreaPadding
                containerStyle={[styles.sessionRequestContainer, { backgroundColor: theme.background4 }]}
            >
                <SafeAreaView>
                    <View style={styles.titleContainer}>
                        <CommonText style={{ fontWeight: 'bold', fontSize: 17 }}>
                            {pairingProposal?.params?.proposer?.metadata?.name || 'Unknown DApp'}
                        </CommonText>
                        <CommonText>{t('walletconnect.connect_request')}</CommonText>
                        <CommonText>{pairingProposal?.params?.proposer?.metadata?.url || 'No URL'}</CommonText>
                    </View>
                    <View style={styles.contentContainer}>
                        <CommonText>{t('walletconnect.requested_permissions')}</CommonText>
                        {requiredNamespaces?.eip155?.chains?.map(chain => (
                            <CommonText key={chain}>{chain.toUpperCase()}</CommonText>
                        ))}
                        {requiredNamespaces?.eip155?.methods?.map(method => (
                            <CommonText key={method}>{method}</CommonText>
                        ))}
                        {requiredNamespaces?.eip155?.events?.map(event => (
                            <CommonText key={event}>{event}</CommonText>
                        ))}
                    </View>
                    <View style={styles.buttonContainer}>
                        <View style={styles.haftButton}>
                            <CommonButton
                                text={t('approve')}
                                onPress={handleAccept}
                                style={[styles.button, { backgroundColor: theme.longColor }]}
                            />
                        </View>
                        <View style={styles.haftButton}>
                            <CommonButton
                                text={t('reject')}
                                style={[styles.button, { backgroundColor: theme.text3 }]}
                                onPress={handleDecline}
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </ActionSheet>
            <ActionSheet
                ref={approvalRequestModal}
                headerAlwaysVisible
                isModal={Platform.OS === 'android'}
                useBottomSafeAreaPadding
                containerStyle={[styles.sessionRequestContainer, { backgroundColor: theme.background }]}
            >
                <View style={styles.titleContainer}>
                    <CommonText style={{ fontWeight: 'bold', fontSize: 17 }}>
                        {pairingProposal?.params?.proposer?.metadata?.name || 'Unknown DApp'}
                    </CommonText>
                    <CommonText>{t('walletconnect.connect_request')}</CommonText>
                    <CommonText>{pairingProposal?.params?.proposer?.metadata?.url || 'No URL'}</CommonText>
                </View>
                <View style={styles.contentContainer}>
                    {requestEventData && (
                        <CommonText>
                            {t(
                                requestEventData?.params?.request?.method === 'personal_sign'
                                    ? 'walletconnect.sign_message'
                                    : 'walletconnect.send_transaction',
                            )}
                        </CommonText>
                    )}
                    {requestEventData && (
                        <CommonText>
                            {JSON.stringify(getSignParamsMessage(requestEventData?.params?.request?.params), null, 2)}
                        </CommonText>
                    )}
                </View>
                <View style={styles.buttonContainer}>
                    <View style={styles.haftButton}>
                        <CommonButton text={t('approve')} onPress={onApproveRequest} />
                    </View>
                    <View style={styles.haftButton}>
                        <CommonButton
                            text={t('reject')}
                            style={[styles.button, { backgroundColor: theme.text3 }]}
                            onPress={onRejectRequest}
                        />
                    </View>
                </View>
            </ActionSheet>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 48,
        paddingHorizontal: 10,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftHeader: {
        width: 30,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    contentHeader: {
        flex: 1,
        justifyContent: 'center',
        height: '100%',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    sessionRequestContainer: {
        width: '100%',
        marginBottom: Platform.OS === 'android' ? 0 : 170,
    },
    titleContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    contentContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        minHeight: 200,
    },
    buttonContainer: {
        width: '100%',
        height: 50,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Platform.OS === 'android' ? 0 : 30,
    },
    haftButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        borderRadius: 5,
    },
});