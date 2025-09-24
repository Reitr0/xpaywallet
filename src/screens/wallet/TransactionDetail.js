import * as React from 'react';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import CommonText from '@components/commons/CommonText';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import CommonBackButton from '@components/commons/CommonBackButton';
import { WalletFactory } from '@modules/core/factory/WalletFactory';
import ActionSheet from 'react-native-actions-sheet';
import WebView from 'react-native-webview';
import CommonImage from '@components/commons/CommonImage';
import CommonButton from '@components/commons/CommonButton';
import moment from 'moment'
import Clipboard from '@react-native-clipboard/clipboard';
import Icon, { Icons } from '@components/icons/Icons';
import CommonAlert from '@components/commons/CommonAlert';
import MarqueeText from 'react-native-marquee';

function TransactionDetail({ route }) {
    const { item } = route.params;
    const { t } = useTranslation();
    const { txHash } = item
    const navigation = useNavigation();
    const actionSheetRef = React.useRef(null);
    const { activeWallet } = useSelector(state => state.WalletReducer);
    console.log(`active wallet:${JSON.stringify(activeWallet)}`)
    const { theme } = useSelector(state => state.ThemeReducer);

    const copyToClipboard = () => {
        Clipboard.setString(item.explore);
        CommonAlert.show({
            title: t('transaction_detail.copied'),
            message: t('transaction_detail.link_copied'),
            type: '',
        });
    };
    const copyToClipboard2 = () => {
        Clipboard.setString(item.txHash);
        CommonAlert.show({
            title: t('transaction_detail.copied'),
            message: t('transaction_detail.tx_copied'),
            type: '',
        });
    };

    // const { txHash } = route.params; // Get txHash from route params
    // const [transactionDetail, setTransactionDetail] = useState(null);
    // const [isLoading, setIsLoading] = useState(true);

    // useEffect(() => {
    //     const fetchTransactionDetail = async () => {
    //         setIsLoading(true);
    //         try {
    //             const detail = await WalletFactory.getTransactionDetails(activeWallet, txHash);
    //             if (detail.success) {
    //                 setTransactionDetail(detail.data);
    //             } else {
    //                 console.error("Error fetching transaction detail:", detail.error);
    //                 // Optionally, you can display an error message to the user
    //             }
    //         } catch (error) {
    //             console.error("Error fetching transaction detail:", error);
    //         } finally {
    //             setIsLoading(false);
    //         }
    //     };

    //     fetchTransactionDetail();
    // }, [item, activeWallet]); // Dependency array includes txHash and activeWallet

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

    useEffect(() => {
        console.log(activeWallet.activeAsset.logoURI)
    }, [activeWallet.activeAsset])

    const borderColor = theme.backgroundTable || '#1e1e1e';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background4 }]}>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* ... (rest of your component code) ... */}
                {/* {isLoading ? (
                    <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
                ) : ( */}
                <View
                    style={[
                        styles.header,
                        { backgroundColor: theme.background2 },
                    ]}>
                    <View style={styles.leftHeader}>
                        <CommonBackButton
                            color={theme.text}
                            onPress={async () => {
                                navigation.goBack();
                            }}
                        />
                    </View>
                    <View style={styles.contentHeader}>
                        <CommonText style={styles.headerTitle}>
                            {t("transaction_detail." + item.type)}
                        </CommonText>
                    </View>
                </View>
                <View style={styles.itemIcon}>
                    <CommonImage
                        source={{ uri: activeWallet.activeAsset.logoURI }}
                        style={styles.img}
                    />
                </View>
                <View style={styles.valueContainer}>
                    <Text style={[styles.valueValue, { color: theme.text2 }]}>
                        {`${item.value} ${activeWallet.activeAsset.symbol}`}
                    </Text>
                </View>
                <View style={styles.detailContainer}>
                    {item ? (
                        <View style={[styles.infoCard, { backgroundColor: borderColor, borderColor: theme.border, borderWidth: 1 }]}>
                            {[
                                <InfoRow label={t('transaction_detail.date')} labelColor={theme.textTable} valueColor={theme.textTable} value={moment(item.createdAt * 1000).format('MMMM Do YYYY, h:mm:ss a')} marquee />,
                                <StatusRow label={t('transaction_detail.status')} labelColor={theme.textTable} value={t(`transaction_detail.${item.status == -1 ? 'succeeded' : 'failed'}`)} valueColor={item.status == -1 ? theme.success : theme.error} />,
                                <InfoRow label={t('transaction_detail.to')} labelColor={theme.textTable} valueColor={theme.textTable} value={item.to} marquee={true} />,
                                <InfoRow label={t('transaction_detail.network')} labelColor={theme.textTable} valueColor={theme.textTable} value={item.chain || 'Solana'} />,
                                <InfoRow label={t('transaction_detail.network_fee')} labelColor={theme.textTable} valueColor={theme.textTable} value={`-${item.gasFee / 1000000000} ${item.networkFeeSymbol || 'SOL'}`} />
                            ].map((row, index) => (
                                <View
                                    key={index}
                                    style={{
                                        borderBottomWidth: index === 4 ? 0 : 1, // terakhir ga usah garis
                                        borderBottomColor: theme.background2, // atau pakai borderColor
                                        paddingVertical: 8,
                                    }}
                                >
                                    {row}
                                </View>
                            ))}
                        </View>
                    ) : (
                        <CommonText style={styles.noDataText}>{t('transaction_detail.no_data')}</CommonText>
                    )}

                    <CommonButton text={t('transaction_detail.view_on_sol')} style={{ borderRadius: 16 }} onPress={() => {
                        actionSheetRef.current?.show();
                    }} />
                    <TouchableOpacity
                        onPress={copyToClipboard}
                        style={[
                            styles.buttonContainer,
                            { backgroundColor: theme.backgroundTable, borderColor: theme.border, borderWidth: 1, borderRadius: 16 },
                        ]}>
                        <CommonText
                            style={[
                                styles.text,
                                { color: theme.textTable },
                            ]}>
                            {t('transaction_detail.copy_link')}
                        </CommonText>
                        <Icon
                            name="copy-outline"
                            size={25}
                            type={Icons.Ionicons}
                            color={theme.textTable}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={copyToClipboard2}
                        style={[
                            styles.buttonContainer,
                            { backgroundColor: theme.backgroundTable, borderColor: theme.border, borderWidth: 1, borderRadius: 16 },
                        ]}>
                        <CommonText
                            style={[
                                styles.text,
                                { color: theme.textTable },
                            ]}>
                            {t('transaction_detail.copy_txhash')}
                        </CommonText>
                        <Icon
                            name="copy-outline"
                            size={25}
                            type={Icons.Ionicons}
                            color={theme.textTable}
                        />
                    </TouchableOpacity>
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

function InfoRow({ label, value, valueColor = '#fff', labelColor = '#fafafa', style, marquee }) {
    return (
        <View style={[styles.infoRow, style]}>
            <Text style={[styles.infoLabel, { color: labelColor }]}>{label}</Text>
            {marquee ? (
                <View style={{maxWidth: '70%'}}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end', maxWidth: '100%', display: 'flex' }}>
                        <MarqueeText
                            style={{
                                color: valueColor, fontSize: 14,
                                textAlign: 'right',
                                fontWeight: '600'
                            }}
                            speed={1}
                            marqueeOnStart={true}
                            loop={true}
                            delay={1000}
                        >
                            {value}
                        </MarqueeText>
                    </View>
                </View>
            ) : (
                <Text style={[styles.infoValue, { color: valueColor }]} numberOfLines={1}>
                    {value}
                </Text>
            )}
        </View>
    );
}

function StatusRow({ label, value, valueColor = '#fff', labelColor = '#fafafa', style }) {
    return (
        <View style={[styles.infoRow, style]}>
            <Text style={[styles.infoLabel, { color: labelColor }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: valueColor, fontWeight: '900' }]} numberOfLines={1}>
                {value}
            </Text>
        </View>
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
    valueContainer: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    valueValue: {
        fontSize: 20,
        fontWeight: '800'
    },
    itemIcon: {
        width: '100%',
        height: 'auto',
        marginTop: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCard: {
        width: '100%',
        borderRadius: 16,
        paddingVertical: 8,
        marginVertical: 20,
        // Shadow untuk iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        // Shadow untuk Android
        elevation: 5,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        // Shadow untuk iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        // Shadow untuk Android
        elevation: 1,
        paddingHorizontal: 20,
        marginVertical: 8,
    },
    infoLabel: {
        // color: '#fafafa',
        fontSize: 14,
        fontWeight: '800'
    },
    infoValue: {
        // color: '#fff',
        fontSize: 14,
        maxWidth: '60%',
        textAlign: 'right',
        fontWeight: '600'
    },
    contentHeader: {
        flex: 1,
        justifyContent: 'center',
        height: '100%',
    },
    headerTitle: {
        fontSize: 14,
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
        fontSize: 13,
        color: 'gray',
    },
    transactionDetailContainer: {
        height: '90%',
    },
    img: {
        width: 64,
        height: 64,
        marginRight: 0,
        justifyContent: 'center',
        alignSelf: 'center',
        borderRadius: 100,
        backgroundColor: 'black'
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'row',
        width: "100%",
        height: 48,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8
    },
    text: {
        fontSize: 13,
        marginRight: 4,
        fontWeight: "bold",
        color: "white",
    },
});

export default TransactionDetail;
