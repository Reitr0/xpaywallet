import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import CommonText from '@components/commons/CommonText';
import CommonImage from '@components/commons/CommonImage';
import Icon, { Icons } from '@components/icons/Icons';
import { walletConnectionProvider } from '@modules/walletconnect/WalletConnectionProvider';

const WalletConnectionStatus = ({ onDisconnect, onSwitchWallet }) => {
    const { theme } = useSelector(state => state.ThemeReducer);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        updateConnectionStatus();
    }, []);

    const updateConnectionStatus = () => {
        const connectedChains = walletConnectionProvider.getConnectedChains();
        const currentChain = walletConnectionProvider.getCurrentChain();
        const currentWallet = walletConnectionProvider.getConnectedWallet(currentChain);

        setIsConnected(connectedChains.length > 0);
        setConnectionStatus({
            chain: currentChain,
            address: currentWallet?.address,
            connectedChains,
        });
    };

    const handleDisconnect = () => {
        Alert.alert(
            'Disconnect Wallet',
            'Are you sure you want to disconnect your wallet?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: () => {
                        const currentChain = walletConnectionProvider.getCurrentChain();
                        walletConnectionProvider.disconnectWallet(currentChain);
                        updateConnectionStatus();
                        onDisconnect && onDisconnect();
                    },
                },
            ]
        );
    };

    const handleSwitchWallet = () => {
        onSwitchWallet && onSwitchWallet();
    };

    const getChainInfo = (chain) => {
        const chainMap = {
            'ETH': { name: 'Ethereum', color: '#627EEA' },
            'BSC': { name: 'BSC', color: '#F3BA2F' },
            'POLYGON': { name: 'Polygon', color: '#8247E5' },
        };
        return chainMap[chain] || { name: chain, color: '#666666' };
    };

    const formatAddress = (address) => {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (!isConnected || !connectionStatus) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background2 }]}>
                <View style={styles.statusIndicator}>
                    <Icon
                        type={Icons.MaterialIcons}
                        name="wallet"
                        size={20}
                        color={theme.subText}
                    />
                </View>
                <CommonText style={[styles.statusText, { color: theme.subText }]}>
                    No wallet connected
                </CommonText>
            </View>
        );
    }

    const chainInfo = getChainInfo(connectionStatus.chain);

    return (
        <View style={[styles.container, { backgroundColor: theme.background2 }]}>
            <View style={styles.walletInfo}>
                <View style={styles.chainIndicator}>
                    <View style={[styles.chainDot, { backgroundColor: chainInfo.color }]} />
                    <CommonText style={[styles.chainName, { color: theme.text }]}>
                        {chainInfo.name}
                    </CommonText>
                </View>
                
                <View style={styles.addressContainer}>
                    <CommonText style={[styles.address, { color: theme.text }]}>
                        {formatAddress(connectionStatus.address)}
                    </CommonText>
                    <View style={[styles.connectedDot, { backgroundColor: '#4CAF50' }]} />
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.button }]}
                    onPress={handleSwitchWallet}
                >
                    <Icon
                        type={Icons.MaterialIcons}
                        name="swap-horiz"
                        size={16}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.text3 }]}
                    onPress={handleDisconnect}
                >
                    <Icon
                        type={Icons.MaterialIcons}
                        name="close"
                        size={16}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        marginVertical: 8,
    },
    statusIndicator: {
        marginRight: 12,
    },
    statusText: {
        fontSize: 14,
    },
    walletInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    chainIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    chainDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    chainName: {
        fontSize: 12,
        fontWeight: '600',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    address: {
        fontSize: 14,
        fontWeight: '500',
        marginRight: 8,
    },
    connectedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default WalletConnectionStatus;
