import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import CommonText from '@components/commons/CommonText';
import CommonButton from '@components/commons/CommonButton';
import CommonImage from '@components/commons/CommonImage';
import Icon, { Icons } from '@components/icons/Icons';
import { WalletFactory } from '@modules/core/factory/WalletFactory';
import { walletConnectionProvider } from '@modules/walletconnect/WalletConnectionProvider';

const WalletConnectionModal = ({ visible, onClose, onWalletConnected, selectedChain = 'ETH' }) => {
    const { theme } = useSelector(state => state.ThemeReducer);
    const { wallets } = useSelector(state => state.WalletReducer);
    const [loading, setLoading] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);

    const availableChains = [
        { key: 'ETH', name: 'Ethereum', chainId: '0x1', color: '#627EEA' },
        { key: 'BSC', name: 'BSC', chainId: '0x38', color: '#F3BA2F' },
        { key: 'POLYGON', name: 'Polygon', chainId: '0x89', color: '#8247E5' },
    ];

    const [currentChain, setCurrentChain] = useState(selectedChain);

    useEffect(() => {
        if (visible) {
            setCurrentChain(selectedChain);
            setSelectedWallet(null);
        }
    }, [visible, selectedChain]);

    const handleChainSelect = (chain) => {
        setCurrentChain(chain);
        setSelectedWallet(null);
    };

    const handleWalletSelect = (wallet) => {
        setSelectedWallet(wallet);
    };

    const handleConnect = async () => {
        if (!selectedWallet) {
            Alert.alert('Error', 'Please select a wallet to connect');
            return;
        }

        setLoading(true);
        try {
            // Connect wallet using the provider
            const connectionData = await walletConnectionProvider.connectWallet(
                currentChain,
                selectedWallet
            );

            // Update the provider's current chain
            walletConnectionProvider.setCurrentChain(currentChain);

            Alert.alert(
                'Success',
                `Wallet connected successfully!\nAddress: ${connectionData.address}`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            onWalletConnected(connectionData);
                            onClose();
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error connecting wallet:', error);
            Alert.alert('Error', `Failed to connect wallet: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const renderChainItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.chainItem,
                {
                    backgroundColor: currentChain === item.key ? item.color : theme.background2,
                    borderColor: currentChain === item.key ? item.color : theme.border,
                },
            ]}
            onPress={() => handleChainSelect(item.key)}
        >
            <View style={[styles.chainIndicator, { backgroundColor: item.color }]} />
            <CommonText
                style={[
                    styles.chainText,
                    {
                        color: currentChain === item.key ? '#FFFFFF' : theme.text,
                        fontWeight: currentChain === item.key ? 'bold' : 'normal',
                    },
                ]}
            >
                {item.name}
            </CommonText>
            {currentChain === item.key && (
                <Icon
                    type={Icons.MaterialIcons}
                    name="check"
                    size={20}
                    color="#FFFFFF"
                />
            )}
        </TouchableOpacity>
    );

    const renderWalletItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.walletItem,
                {
                    backgroundColor: selectedWallet?.id === item.id ? theme.button : theme.background2,
                    borderColor: selectedWallet?.id === item.id ? theme.button : theme.border,
                },
            ]}
            onPress={() => handleWalletSelect(item)}
        >
            <View style={styles.walletInfo}>
                <CommonImage
                    source={{ uri: item.logoURI }}
                    style={styles.walletLogo}
                />
                <View style={styles.walletDetails}>
                    <CommonText
                        style={[
                            styles.walletName,
                            {
                                color: selectedWallet?.id === item.id ? '#FFFFFF' : theme.text,
                                fontWeight: selectedWallet?.id === item.id ? 'bold' : 'normal',
                            },
                        ]}
                    >
                        {item.name}
                    </CommonText>
                    <CommonText
                        style={[
                            styles.walletAddress,
                            {
                                color: selectedWallet?.id === item.id ? '#FFFFFF' : theme.subText,
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {item.walletAddress ? 
                            `${item.walletAddress.slice(0, 6)}...${item.walletAddress.slice(-4)}` : 
                            'No address'
                        }
                    </CommonText>
                </View>
            </View>
            {selectedWallet?.id === item.id && (
                <Icon
                    type={Icons.MaterialIcons}
                    name="check"
                    size={20}
                    color="#FFFFFF"
                />
            )}
        </TouchableOpacity>
    );

    const filteredWallets = wallets.filter(wallet => {
        // Filter wallets that have the selected chain
        return wallet.coins && wallet.coins.some(coin => coin.chain === currentChain);
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <CommonText style={[styles.title, { color: theme.text }]}>
                            Connect Wallet
                        </CommonText>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon
                                type={Icons.MaterialIcons}
                                name="close"
                                size={24}
                                color={theme.text}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Chain Selection */}
                        <View style={styles.section}>
                            <CommonText style={[styles.sectionTitle, { color: theme.text }]}>
                                Select Network
                            </CommonText>
                            <FlatList
                                data={availableChains}
                                renderItem={renderChainItem}
                                keyExtractor={item => item.key}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.chainList}
                            />
                        </View>

                        {/* Wallet Selection */}
                        <View style={styles.section}>
                            <CommonText style={[styles.sectionTitle, { color: theme.text }]}>
                                Select Wallet
                            </CommonText>
                            {filteredWallets.length > 0 ? (
                                <FlatList
                                    data={filteredWallets}
                                    renderItem={renderWalletItem}
                                    keyExtractor={item => item.id}
                                    style={styles.walletList}
                                    showsVerticalScrollIndicator={false}
                                />
                            ) : (
                                <View style={styles.emptyState}>
                                    <Icon
                                        type={Icons.MaterialIcons}
                                        name="wallet"
                                        size={48}
                                        color={theme.subText}
                                    />
                                    <CommonText style={[styles.emptyText, { color: theme.subText }]}>
                                        No wallets available for {availableChains.find(c => c.key === currentChain)?.name}
                                    </CommonText>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <CommonButton
                            text="Cancel"
                            onPress={onClose}
                            style={[styles.button, styles.cancelButton, { backgroundColor: theme.background2 }]}
                            textStyle={{ color: theme.text }}
                        />
                        <CommonButton
                            text={loading ? "Connecting..." : "Connect"}
                            onPress={handleConnect}
                            disabled={!selectedWallet || loading}
                            style={[
                                styles.button,
                                styles.connectButton,
                                {
                                    backgroundColor: selectedWallet && !loading ? theme.button : theme.subText,
                                },
                            ]}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        minHeight: '60%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    chainList: {
        marginBottom: 10,
    },
    chainItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 10,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 100,
    },
    chainIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    chainText: {
        fontSize: 14,
        flex: 1,
    },
    walletList: {
        maxHeight: 200,
    },
    walletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        marginBottom: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    walletInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    walletLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    walletDetails: {
        flex: 1,
    },
    walletName: {
        fontSize: 16,
        marginBottom: 4,
    },
    walletAddress: {
        fontSize: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 10,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        gap: 10,
    },
    button: {
        flex: 1,
        height: 48,
    },
    cancelButton: {
        marginRight: 5,
    },
    connectButton: {
        marginLeft: 5,
    },
});

export default WalletConnectionModal;
