import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Platform,
    Alert,
    Dimensions,
    TouchableOpacity,
    Animated,
    Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import CommonButton from './commons/CommonButton';
import CommonText from './commons/CommonText';
import CommonImage from './commons/CommonImage';
import Icon, { Icons } from '@components/icons/Icons';
import { walletConnectSessionManager } from '@modules/walletconnect/WalletConnectSessionManager';

const { width, height } = Dimensions.get('window');

const WalletConnectSessionModal = () => {
    const { theme } = useSelector(state => state.ThemeReducer);
    const [isVisible, setIsVisible] = useState(false);
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showDetailedPermissions, setShowDetailedPermissions] = useState(false);
    const [showNetworks, setShowNetworks] = useState(false);
    const [showMethods, setShowMethods] = useState(false);
    const animatedHeight = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Listen for session proposals
        const handleSessionProposal = (proposal) => {
            console.log('📱 WalletConnectSessionModal: Received proposal', proposal);
            console.log('📱 WalletConnectSessionModal: Setting proposal and showing modal');
            setProposal(proposal);
            setIsVisible(true);
        };

        // Add event listener to session manager
        walletConnectSessionManager.onSessionProposal = handleSessionProposal;
        console.log('📱 WalletConnectSessionModal: Event listener registered');

        return () => {
            walletConnectSessionManager.onSessionProposal = null;
            console.log('📱 WalletConnectSessionModal: Event listener removed');
        };
    }, []);

    const handleApprove = async () => {
        if (!proposal) return;
        
        setLoading(true);
        console.log('🔌 Starting WalletConnect session approval...');
        
        // Add timeout protection
        const timeoutId = setTimeout(() => {
            console.error('🔌 Session approval timeout - forcing modal close');
            setLoading(false);
            setIsVisible(false);
            setProposal(null);
        }, 15000); // 15 second timeout
        
        try {
            await walletConnectSessionManager.approveSession(proposal);
            console.log('✅ Session approved successfully');
            
            // Trigger auto-connection in MetaMaskProvider
            const { metaMaskWeb3Provider } = require('@modules/web3/MetaMaskProvider');
            // Note: MetaMaskProvider doesn't need triggerAutoConnection as it's stateless
            
            clearTimeout(timeoutId);
            setIsVisible(false);
            setProposal(null);
        } catch (error) {
            console.error('❌ Error approving session:', error);
            console.error('❌ Error details:', error.message, error.stack);
            clearTimeout(timeoutId);
            Alert.alert('Error', `Failed to approve session: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!proposal) return;
        
        setLoading(true);
        console.log('🔌 Starting WalletConnect session rejection...');
        
        // Add timeout protection
        const timeoutId = setTimeout(() => {
            console.error('🔌 Session rejection timeout - forcing modal close');
            setLoading(false);
            setIsVisible(false);
            setProposal(null);
        }, 10000); // 10 second timeout
        
        try {
            await walletConnectSessionManager.rejectSession(proposal);
            console.log('🚫 Session rejected successfully');
            clearTimeout(timeoutId);
            setIsVisible(false);
            setProposal(null);
        } catch (error) {
            console.error('❌ Error rejecting session:', error);
            console.error('❌ Error details:', error.message, error.stack);
            clearTimeout(timeoutId);
            Alert.alert('Error', `Failed to reject session: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Debug logging
    console.log('📱 WalletConnectSessionModal: Render - proposal:', !!proposal, 'isVisible:', isVisible);
    
    if (!proposal) {
        console.log('📱 WalletConnectSessionModal: No proposal, returning null');
        return null;
    }

    const { params } = proposal;
    const { proposer, requiredNamespaces, optionalNamespaces } = params;
    const metadata = proposer?.metadata || {};

    // Format networks for display
    const formatNetworks = (namespaces) => {
        const networks = [];
        Object.entries(namespaces).forEach(([namespace, config]) => {
            if (config.chains) {
                config.chains.forEach(chain => {
                    networks.push({
                        chain,
                        name: getChainName(chain),
                        namespace
                    });
                });
            }
        });
        return networks;
    };

    // Format methods for display
    const formatMethods = (namespaces) => {
        const methods = [];
        Object.entries(namespaces).forEach(([namespace, config]) => {
            if (config.methods) {
                const methodGroups = groupMethods(config.methods);
                Object.entries(methodGroups).forEach(([category, methodList]) => {
                    methods.push({
                        category,
                        methods: methodList,
                        namespace
                    });
                });
            }
        });
        return methods;
    };

    // Get summary for collapsed view
    const getSummary = (namespaces) => {
        const networks = formatNetworks(namespaces);
        const methods = formatMethods(namespaces);
        
        return {
            networkCount: networks.length,
            mainNetworks: networks.slice(0, 2).map(n => n.name),
            methodCategories: [...new Set(methods.map(m => m.category))]
        };
    };

    // Get user-friendly chain names
    const getChainName = (chain) => {
        const chainMap = {
            '1': 'Ethereum Mainnet',
            '56': 'BSC (Binance Smart Chain)',
            '97': 'BSC Testnet',
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
            '421613': 'Arbitrum Goerli',
            '421614': 'Arbitrum Sepolia',
            '59140': 'Linea Testnet',
            '84531': 'Base Goerli',
            '84532': 'Base Sepolia',
            '5611': 'opBNB Testnet',
        };
        return chainMap[chain] || `Chain ${chain}`;
    };

    // Group methods by category for better readability
    const groupMethods = (methods) => {
        const groups = {
            'Account Access': [],
            'Transaction Signing': [],
            'Data Signing': [],
            'Network Info': [],
            'Other': []
        };

        methods.forEach(method => {
            if (['eth_accounts', 'eth_requestAccounts', 'personal_sign'].includes(method)) {
                groups['Account Access'].push(method);
            } else if (['eth_sendTransaction', 'eth_signTransaction', 'eth_sendRawTransaction'].includes(method)) {
                groups['Transaction Signing'].push(method);
            } else if (['eth_sign', 'eth_signTypedData', 'eth_signTypedData_v3', 'eth_signTypedData_v4'].includes(method)) {
                groups['Data Signing'].push(method);
            } else if (['eth_chainId', 'eth_getBalance', 'eth_blockNumber'].includes(method)) {
                groups['Network Info'].push(method);
            } else {
                groups['Other'].push(method);
            }
        });

        // Remove empty groups
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) {
                delete groups[key];
            }
        });

        return groups;
    };

    const requiredNetworks = formatNetworks(requiredNamespaces);
    const requiredMethods = formatMethods(requiredNamespaces);
    const requiredSummary = getSummary(requiredNamespaces);
    
    const optionalNetworks = formatNetworks(optionalNamespaces);
    const optionalMethods = formatMethods(optionalNamespaces);
    const optionalSummary = getSummary(optionalNamespaces);

    const CollapsibleSection = ({ title, isExpanded, onToggle, children, summary, icon }) => (
        <View style={[styles.section, { backgroundColor: theme.background2 }]}>
            <TouchableOpacity 
                style={styles.sectionHeader} 
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.sectionHeaderLeft}>
                    <Icon 
                        type={Icons.MaterialIcons} 
                        name={icon} 
                        size={20} 
                        color={theme.text1} 
                        style={styles.sectionIcon}
                    />
                    <View style={styles.sectionTitleContainer}>
                        <CommonText style={[styles.sectionTitle, { color: theme.text1 }]}>
                            {title}
                        </CommonText>
                        {!isExpanded && summary && (
                            <CommonText style={[styles.sectionSummary, { color: theme.text2 }]}>
                                {summary}
                            </CommonText>
                        )}
                    </View>
                </View>
                <Icon 
                    type={Icons.MaterialIcons} 
                    name={isExpanded ? "expand-less" : "expand-more"} 
                    size={24} 
                    color={theme.text2} 
                />
            </TouchableOpacity>
            
            {isExpanded && (
                <Animated.View style={[styles.sectionContent]}>
                    {children}
                </Animated.View>
            )}
        </View>
    );

    const NetworkItem = ({ network }) => (
        <View style={styles.listItem}>
            <View style={[styles.networkIndicator, { backgroundColor: theme.button }]} />
            <CommonText style={[styles.listItemText, { color: theme.text1 }]}>
                {network.name}
            </CommonText>
        </View>
    );

    const MethodGroup = ({ group }) => (
        <View style={styles.methodGroup}>
            <CommonText style={[styles.methodCategory, { color: theme.text1 }]}>
                {group.category}
            </CommonText>
            <View style={styles.methodList}>
                {group.methods.map((method, index) => (
                    <View key={index} style={styles.listItem}>
                        <View style={[styles.methodIndicator, { backgroundColor: theme.longColor }]} />
                        <CommonText style={[styles.methodText, { color: theme.text2 }]}>
                            {method}
                        </CommonText>
                    </View>
                ))}
            </View>
        </View>
    );

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <SafeAreaView style={styles.safeArea}>
                        {/* Header Section - Matching Web3RequestModal */}
                        <View style={styles.header}>
                            <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={() => setIsVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Icon 
                                    type={Icons.MaterialIcons} 
                                    name="close" 
                                    size={24} 
                                    color="#666666" 
                                />
                            </TouchableOpacity>
                            <CommonText style={styles.headerTitle}>
                                {metadata.name || 'Unknown DApp'}
                            </CommonText>
                            <View style={styles.headerRight} />
                        </View>

                        {/* DApp Info Section */}
                        <View style={styles.dappInfoContainer}>
                            <View style={styles.dappInfoRow}>
                                <CommonText style={styles.dappInfoLabel}>DApp</CommonText>
                                <View style={styles.dappInfoValue}>
                                    <CommonImage 
                                        source={{ uri: metadata.icons?.[0] || 'https://via.placeholder.com/24' }}
                                        style={styles.dappIcon}
                                    />
                                    <CommonText style={styles.dappInfoText}>
                                        {metadata.name || 'Unknown DApp'}
                                    </CommonText>
                                </View>
                            </View>
                            <View style={styles.dappInfoRow}>
                                <CommonText style={styles.dappInfoLabel}>URL</CommonText>
                                <CommonText style={styles.dappInfoText}>
                                    {metadata.url || 'Unknown URL'}
                                </CommonText>
                            </View>
                        </View>

                        {/* Description */}
                        <View style={styles.descriptionContainer}>
                            <CommonText style={styles.description}>
                                This DApp would like to connect to your wallet
                            </CommonText>
                        </View>

                {/* Scrollable Content Section */}
                <View style={styles.scrollContainer}>
                    <ScrollView 
                        style={styles.content} 
                        showsVerticalScrollIndicator={true}
                        nestedScrollEnabled={true}
                        bounces={true}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Required Permissions */}
                        <CollapsibleSection
                            title="Required Permissions"
                            isExpanded={showDetailedPermissions}
                            onToggle={() => setShowDetailedPermissions(!showDetailedPermissions)}
                            summary={`${requiredSummary.networkCount} networks • ${requiredSummary.methodCategories.join(', ')}`}
                            icon="security"
                        >
                            {/* Networks Section */}
                            <CollapsibleSection
                                title="Networks"
                                isExpanded={showNetworks}
                                onToggle={() => setShowNetworks(!showNetworks)}
                                summary={`${requiredNetworks.length} networks`}
                                icon="network-check"
                            >
                                {requiredNetworks.map((network, index) => (
                                    <NetworkItem key={index} network={network} />
                                ))}
                            </CollapsibleSection>

                            {/* Methods Section */}
                            <CollapsibleSection
                                title="Permissions"
                                isExpanded={showMethods}
                                onToggle={() => setShowMethods(!showMethods)}
                                summary={`${requiredMethods.length} permission categories`}
                                icon="verified-user"
                            >
                                {requiredMethods.map((group, index) => (
                                    <MethodGroup key={index} group={group} />
                                ))}
                            </CollapsibleSection>
                        </CollapsibleSection>
                        
                        {/* Optional Permissions */}
                        {(optionalNetworks.length > 0 || optionalMethods.length > 0) && (
                            <CollapsibleSection
                                title="Optional Permissions"
                                isExpanded={showDetailedPermissions}
                                onToggle={() => setShowDetailedPermissions(!showDetailedPermissions)}
                                summary={`${optionalSummary.networkCount} networks • ${optionalSummary.methodCategories.join(', ')}`}
                                icon="check-circle-outline"
                            >
                                <CommonText style={[styles.optionalNote, { color: theme.text2 }]}>
                                    These permissions are optional and can be approved separately.
                                </CommonText>
                            </CollapsibleSection>
                        )}
                        
                        {/* Bottom padding */}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <CommonButton
                                title="Reject"
                                onPress={handleReject}
                                loading={loading}
                                style={styles.rejectButton}
                                textStyle={styles.rejectButtonText}
                            />
                            <CommonButton
                                title="Approve"
                                onPress={handleApprove}
                                loading={loading}
                                style={styles.approveButton}
                                textStyle={styles.approveButtonText}
                            />
                        </View>
            </SafeAreaView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        height: '90%',
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    closeButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    headerRight: {
        width: 34, // Same width as close button for centering
    },
    dappInfoContainer: {
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    dappInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    dappInfoLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    dappInfoValue: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
    },
    dappIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    dappInfoText: {
        fontSize: 14,
        fontWeight: '500',
    },
    descriptionContainer: {
        paddingVertical: 20,
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        textAlign: 'center',
    },
    detailsContainer: {
        paddingVertical: 20,
    },
    detailsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    scrollContainer: {
        flex: 1,
        minHeight: 0,
    },
    content: {
        flexGrow: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        flexGrow: 1,
    },
    // Trust Wallet style cards
    section: {
        borderRadius: 12,
        marginVertical: 8,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sectionIcon: {
        marginRight: 14,
        opacity: 0.8,
    },
    sectionTitleContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 3,
        letterSpacing: -0.3,
    },
    sectionSummary: {
        fontSize: 13,
        opacity: 0.7,
        fontWeight: '400',
    },
    sectionContent: {
        paddingHorizontal: 18,
        paddingBottom: 18,
    },
    // Trust Wallet style list items
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        marginVertical: 2,
    },
    networkIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 14,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    methodIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 14,
    },
    listItemText: {
        fontSize: 14,
        flex: 1,
        fontWeight: '500',
        letterSpacing: -0.2,
    },
    methodText: {
        fontSize: 13,
        opacity: 0.85,
        fontWeight: '400',
    },
    // Method groups with Trust Wallet styling
    methodGroup: {
        marginVertical: 10,
        paddingHorizontal: 4,
    },
    methodCategory: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        paddingLeft: 14,
        letterSpacing: -0.3,
    },
    methodList: {
        marginLeft: 14,
    },
    optionalNote: {
        fontSize: 13,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 16,
        opacity: 0.7,
        lineHeight: 18,
    },
    // Web3RequestModal style buttons
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 20,
        gap: 12,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        paddingVertical: 16,
    },
    rejectButtonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    approveButton: {
        flex: 1,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
    },
    approveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default WalletConnectSessionModal;
