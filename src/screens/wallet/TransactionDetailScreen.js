import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useSelector } from 'react-redux';
import CommonText from '@components/commons/CommonText';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import CommonBackButton from '@components/commons/CommonBackButton';
import { WalletFactory } from '@modules/core/factory/WalletFactory';
import ActionSheet from 'react-native-actions-sheet';
import WebView from 'react-native-webview';

function TransactionDetail({ route }) {
    const { item } = route.params;
    const { t } = useTranslation();
    const { txHash } = item
    const navigation = useNavigation();
    const actionSheetRef = React.useRef(null);
    const { activeWallet } = useSelector(state => state.WalletReducer);
    const { theme } = useSelector(state => state.ThemeReducer);
    // const { txHash } = route.params; // Get txHash from route params
    const [transactionDetail, setTransactionDetail] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTransactionDetail = async () => {
            setIsLoading(true);
            try {
                const detail = await WalletFactory.getTransactionDetails(activeWallet, txHash);
                if (detail.success) {
                    setTransactionDetail(detail.data);
                } else {
                    console.error("Error fetching transaction detail:", detail.error);
                    // Optionally, you can display an error message to the user
                }
            } catch (error) {
                console.error("Error fetching transaction detail:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactionDetail();
    }, [item, activeWallet]); // Dependency array includes txHash and activeWallet

    const renderDetailItem = (label, value) => (
        <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{label}:</Text>
            <Text style={styles.detailLabel}>{String(value)}</Text>
            {/* <CommonText style={styles.detailLabel}>{label}:</CommonText>
            <CommonText style={styles.detailLabel}>{value}</CommonText> */}
        </View>
    );

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: activeWallet.activeAsset.currency || 'USD'
        }).format(value);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background4 }]}>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* ... (rest of your component code) ... */}
                {/* {isLoading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
                ) : ( */}
                    <View style={styles.detailContainer}>
                        {item ? (
                            <>
                                {renderDetailItem(t('transaction.txHash'), item.txHash)}
                                {renderDetailItem(t('transaction.from'), item.from)}
                                {renderDetailItem(t('transaction.to'), item.to)}
                                {renderDetailItem(t('transaction.value'), `${formatCurrency(item.value)} ${activeWallet.activeAsset.symbol}`)}
                                {renderDetailItem(t('transaction.gasFee'), item.gasFee)}
                                {renderDetailItem(t('transaction.status'), item.status)}
                                {renderDetailItem(t('transaction.createdAt'), item.createdAt)}
                            </>
                        ) : (
                            <CommonText style={styles.noDataText}>{t('transaction.noData')}</CommonText>
                        )}
                    </View>
                {/* )} */}
                <ActionSheet
                    ref={actionSheetRef}
                    headerAlwaysVisible
                    containerStyle={[
                        styles.transactionDetailContainer,
                        { backgroundColor: theme.background },
                    ]}>
                    <WebView
                        source={{
                            uri: item.explore,
                        }}
                        originWhitelist={['*']}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={true}
                        showsVerticalScrollIndicator={false}
                    />
                </ActionSheet>
            </View>
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
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailContainer: {
        flex: 1,
        padding: 20,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    detailLabel: {
        fontWeight: 'bold',
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 16,
        color: 'gray',
    },
    transactionDetailContainer: {
        height: '90%',
    },
});

export default TransactionDetail;
