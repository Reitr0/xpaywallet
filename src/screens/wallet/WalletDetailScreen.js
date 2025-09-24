import * as React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {WalletAction} from '@persistence/wallet/WalletAction';
import CommonTouchableOpacity from '@components/commons/CommonTouchableOpacity';
import Icon, {Icons} from '@components/icons/Icons';
import CommonText from '@components/commons/CommonText';
import CommonImage from '@components/commons/CommonImage';
import CommonLoading from '@components/commons/CommonLoading';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import CommonBackButton from '@components/commons/CommonBackButton';
import {WalletFactory} from '@modules/core/factory/WalletFactory';
import CommonFlatList from '@components/commons/CommonFlatList';
import ActionSheet from 'react-native-actions-sheet';
import WebView from 'react-native-webview';
import Balance from '@components/Balance';
import CommonAlert from '@components/commons/CommonAlert';
import {StorageService} from '@modules/core/storage/StorageService';
import {Logs} from '@modules/log/logs';
import MarqueeText from 'react-native-marquee';
import moment from 'moment';
import numeral from 'numeral';
import {ASSET_TYPE_TOKEN} from '@modules/core/constant/constant';

function WalletDetailScreen({route}) {
    const {t} = useTranslation();
    const actionSheetRef = useRef(null);
    const [url, setUrl] = useState('');
    const navigation = useNavigation();
    const {activeWallet} = useSelector(state => state.WalletReducer);
    const {theme} = useSelector(state => state.ThemeReducer);
    const dispatch = useDispatch();
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [messageErr, setMessageErr] = useState(null);
    // const displayValue = ethers.utils.formatEther(item.value.toString());

    const groupTransaction = transaction => {
        const grouped = {};

        transaction.forEach(item => {
            const date = moment.unix(item.createdAt);

            let label;
            if (date.isSame(moment(), 'day')) {
                label = t('date.today');
            } else if (date.isSame(moment().subtract(1, 'day'), 'day')) {
                label = t('date.yesterday');
            } else {
                label = date.format('MMMM D, YYYY');
            }

            if (!grouped[label]) grouped[label] = [];
            grouped[label].push({...item, type: 'item'});
        });

        const flattened = [];
        Object.keys(grouped).forEach(label => {
            flattened.push({type: 'header', label});
            flattened.push(...grouped[label]);
        });

        return flattened;
    };

    useEffect(() => {
        const loadTransactions = async () => {
            await processTransactions(activeWallet.activeAsset);
        };

        loadTransactions();
    }, [activeWallet.activeAsset]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setMessageErr(null);
        try {
            await dispatch(WalletAction.balance());
            await processTransactions(activeWallet.activeAsset);
        } catch (error) {
            Logs.error('WalletFactory: getTransactions', error);
            setTransactions([]);
            setErrorMsg(error.message);
            CommonAlert.show({
                title: t('alert.error'),
                message: error.message,
                type: 'error',
                onConfirm: () => {
                    setMessageErr(null);
                },
            });
        } finally {
            setRefreshing(false);
            CommonLoading.hide();
        }
    }, [dispatch, activeWallet.activeAsset]);
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            onRefresh(); // Call your refresh function here
        });

        return unsubscribe; // Cleanup the listener on unmount
    }, [navigation, onRefresh]);

    async function processTransactions(wallet) {
        try {
            let result;

            if (activeWallet.activeAsset.id === 'solana') {
                // Consistent check with getSolTransactions
                result = await WalletFactory.getSolTransactions(wallet);
            } else if (activeWallet.activeAsset.chain === 'BSC') {
                result = await WalletFactory.getBscTransaction(wallet);
            } else if (activeWallet.activeAsset.chain === 'ETH') {
                result = await WalletFactory.getEthTransaction(wallet);
            }else if (
                activeWallet.activeAsset.type === ASSET_TYPE_TOKEN &&
                activeWallet.activeAsset.chain === 'SOLANA'
            ) {
                result = await WalletFactory.getTransactions(wallet);
            } else {
                result = await WalletFactory.getTransactions2(wallet);
            }

            if (!result) {
                console.error(
                    'Error fetching transactions: No result returned',
                );
                setTransactions([]);
                return;
            }

            if (result.success) {
                const allTransactions = result.data;
                setTransactions(prevTransactions => [...allTransactions]); // Functional update
                const storageKey = `transactions_${activeWallet.activeAsset.id}`;
                await StorageService.setItem(storageKey, allTransactions);
            } else {
                console.error(
                    'Error fetching transactions:',
                    result.error || 'Unknown error',
                );
                setTransactions([]);
            }
        } catch (error) {
            console.error('Error processing transactions:', error);
            setTransactions([]);
        }
    }

    useEffect(() => {
        const loadStoredTransactions = async () => {
            try {
                console.log('Load Stored Transaction');
                const storageKey = `transactions_${activeWallet.activeAsset.id}`; // Use id for storage key
                const storedTransactions = await StorageService.getItem(
                    storageKey,
                );
                if (storedTransactions) {
                    setTransactions(storedTransactions);
                }
            } catch (error) {
                console.error('Error loading stored transactions:', error);
            }
        };

        loadStoredTransactions();
    }, [activeWallet.activeAsset.id]);

    useEffect(() => {
        console.log(activeWallet);
    }, [activeWallet]);

    const formatSmallValue = (value, coin) => {
        if (!value) return '0';

        let converted = 0;

        switch (coin) {
            case 'BNB':
            case 'ETH':
            case 'MATIC':
                converted = parseFloat(value) / 1;
                break;
            case 'TRX':
                converted = parseFloat(value) / 1e6;
                break;
            case 'SOL':
                converted = parseFloat(value) / 1;
                break;
            case 'BTC':
                converted = parseFloat(value) / 1e8;
                break;
            default:
                return numeral(value).format('0,0.[00000]');
        }

        if (converted < 0.000001 && converted > 0) {
            return converted.toExponential(8);
        }

        return converted.toString();
    };
    const renderItem = ({item}) => {
        const handleTransactionPress = () => {
            navigation.navigate('TransactionDetail', {item});
        };

        if (item.type === 'header') {
            return (
                <CommonText
                    style={[
                        {paddingTop: 8, fontWeight: 'bold', color: theme.text2},
                    ]}>
                    {item.label}
                </CommonText>
            );
        }

        return (
            <CommonTouchableOpacity
                onPress={handleTransactionPress}
                style={[styles.item, {borderBottomColor: theme.border}]}>
                <View style={styles.itemIcon}>
                    {/* <Text style={{color}}></Text> */}
                    <CommonImage
                        source={
                            item.isSender
                                ? require('@assets/images/transaction/send.png')
                                : require('@assets/images/transaction/receive.png')
                        }
                        style={{width: 32, height: 32}}
                    />
                </View>
                <View style={styles.itemDetail}>
                    <CommonText
                        ellipsizeMode="middle"
                        numberOfLines={1}
                        style={[
                            {
                                fontFamily: 'Sora-Bold',
                                color:
                                    item.status == '-1'
                                        ? theme.success
                                        : theme.error,
                            },
                        ]}>
                        {t(
                            item.status == '-1'
                                ? 'transactionStatus.success'
                                : 'transactionStatus.fail',
                        )}
                    </CommonText>
                    <CommonText
                        ellipsizeMode="middle"
                        numberOfLines={1}
                        style={[
                            styles.itemToAddressText,
                            {color: theme.text2},
                        ]}>
                        {item.isSender ? item.to : item.from}
                    </CommonText>
                    {/* <CommonText
                        style={[styles.itemAmountSub, { color: theme.subText }]}>
                        {item.createdAt
                            ? moment(item.createdAt * 1000).fromNow()
                            : "N/A"}
                    </CommonText> */}
                </View>
                <View style={styles.itemAmount}>
                    <CommonText
                        style={[
                            styles.itemAmountText,
                            {color: item.isSender ? '#f33360' : '#24a86f'},
                        ]}>
                        <View
                            style={{
                                justifyContent: 'flex-end',
                                alignItems: 'flex-end',
                                maxWidth: 96,
                                display: 'flex',
                            }}>
                            <MarqueeText
                                style={{
                                    textAlign: 'right',
                                    fontSize: 11,
                                    fontWeight: '600',
                                    color: item.isSender
                                        ? '#f33360'
                                        : '#24a86f',
                                    fontFamily: 'Sora-Regular',
                                }}
                                speed={1}
                                marqueeOnStart={true}
                                loop={true}
                                delay={2000}>
                                {item.isSender ? '-' : '+'}
                                {formatSmallValue(
                                    item.value,
                                    activeWallet.activeAsset.symbol,
                                )}{' '}
                                {(
                                    activeWallet?.activeAsset?.symbol ||
                                    activeWallet?.activeAsset?.tokenSymbol ||
                                    ''
                                ).toUpperCase()}
                                {/* <Balance
                                    symbol={
                                        activeWallet.activeAsset.symbol ||
                                        activeWallet.activeAsset.tokenSymbol
                                    }>
                                    {item.value}
                                </Balance> */}
                            </MarqueeText>
                        </View>
                    </CommonText>
                </View>
            </CommonTouchableOpacity>
        );
    };
    return (
        <SafeAreaView
            style={[styles.container, {backgroundColor: theme.background4}]}>
            <View
                style={[styles.container, {backgroundColor: theme.background}]}>
                <View
                    style={[
                        styles.header,
                        {backgroundColor: theme.background2},
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
                            {activeWallet.activeAsset.name}
                        </CommonText>
                    </View>
                </View>
                <View style={{marginTop: 32}}>
                    <CommonImage
                        source={{uri: activeWallet.activeAsset.logoURI}}
                        style={styles.img}
                    />
                    {/* {item.type !== ASSET_TYPE_COIN && (
                        <CommonImage
                            source={{ uri: chainLogo }}
                            style={styles.itemChainImg}
                        />
                    )} */}
                </View>
                <View
                    style={[
                        styles.balanceContainer,
                        {backgroundColor: theme.background},
                    ]}>
                    <Balance
                        style={[styles.balanceText, {color: theme.text2}]}
                        symbol={activeWallet.activeAsset.symbol.toUpperCase()}>
                        {activeWallet.activeAsset.balance}
                    </Balance>
                </View>
                <View
                    style={[
                        styles.actionContainer,
                        {
                            backgroundColor: theme.background,
                            paddingHorizontal:
                                activeWallet.activeAsset.symbol === 'BTC'
                                    ? 100
                                    : 60,
                        },
                    ]}>
                    <CommonTouchableOpacity
                        style={styles.actionItem}
                        onPress={() => {
                            let nextScreen = 'WalletSendScreen';
                            if (activeWallet.activeAsset.chain === 'TRON') {
                                nextScreen = 'TronWalletSendScreen';
                            } else if (
                                activeWallet.activeAsset.chain === 'BTC'
                            ) {
                                nextScreen = 'BtcWalletSendScreen';
                            } else if (
                                activeWallet.activeAsset.chain === 'SOLANA'
                            ) {
                                nextScreen = 'SolanaWalletSendScreen';
                            }
                            navigation.navigate(nextScreen, {
                                coin: activeWallet.activeAsset,
                            });
                        }}>
                        <View
                            style={[
                                styles.actionIcon,
                                {backgroundColor: theme.background2},
                            ]}>
                            <Icon
                                type={Icons.Feather}
                                size={18}
                                name={'arrow-up'}
                                color={theme.text}
                            />
                        </View>
                        <CommonText style={{fontSize: 11, color: theme.button}}>
                            {t('wallet.send')}
                        </CommonText>
                    </CommonTouchableOpacity>
                    <CommonTouchableOpacity
                        style={styles.actionItem}
                        onPress={() => {
                            navigation.navigate('WalletReceiveScreen', {
                                coin: activeWallet.activeAsset,
                            });
                        }}>
                        <View
                            style={[
                                styles.actionIcon,
                                {backgroundColor: theme.background2},
                            ]}>
                            <Icon
                                type={Icons.Feather}
                                size={18}
                                name={'arrow-down'}
                                color={theme.text}
                            />
                        </View>
                        <CommonText style={{fontSize: 11, color: theme.button}}>
                            {t('wallet.receive')}
                        </CommonText>
                    </CommonTouchableOpacity>
                    {/*<CommonTouchableOpacity*/}
                    {/*    style={styles.actionItem}*/}
                    {/*    onPress={() => {*/}
                    {/*        navigation.navigate('WalletBuyScreen', {*/}
                    {/*            coin: activeWallet.activeAsset,*/}
                    {/*        });*/}
                    {/*    }}>*/}
                    {/*    <View*/}
                    {/*        style={[*/}
                    {/*            styles.actionIcon,*/}
                    {/*            {backgroundColor: theme.background2},*/}
                    {/*        ]}>*/}
                    {/*        <Icon*/}
                    {/*            type={Icons.Ionicons}*/}
                    {/*            size={18}*/}
                    {/*            name={'ios-cart-outline'}*/}
                    {/*            color={theme.text}*/}
                    {/*        />*/}
                    {/*    </View>*/}
                    {/*    <CommonText style={{color: theme.button}}>*/}
                    {/*        {t('wallet.buy')}*/}
                    {/*    </CommonText>*/}
                    {/*</CommonTouchableOpacity>*/}
                </View>
                <View
                    style={[
                        styles.tabViewContainer,
                        {
                            borderTopColor: theme.border,
                            backgroundColor: theme.background,
                        },
                    ]}>
                    <View style={styles.tabViewContent}>
                        <CommonFlatList
                            messageTrx={messageErr}
                            data={groupTransaction(transactions)}
                            renderItem={renderItem}
                            keyExtractor={item => item.hash}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                />
                            }
                            ListEmptyComponent={() => {
                                return (
                                    <View style={styles.emptyContainer}>
                                        <CommonImage
                                            source={require('@assets/images/transaction/empty.png')}
                                            style={styles.emptyImg}
                                        />
                                        <CommonText
                                            style={{color: theme.subText}}>
                                            {messageErr
                                                ? messageErr
                                                : t(
                                                      'wallet.your_transaction_will_appear_here',
                                                  )}
                                        </CommonText>
                                    </View>
                                );
                            }}
                        />
                    </View>
                </View>
                <ActionSheet
                    ref={actionSheetRef}
                    headerAlwaysVisible
                    containerStyle={[
                        styles.transactionDetailContainer,
                        {backgroundColor: theme.background},
                    ]}>
                    <WebView
                        source={{
                            uri: url,
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
    rightHeader: {
        width: 30,
        height: '100%',
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    balanceContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    balanceText: {
        fontSize: 23,
        fontFamily: 'Kanchenjunga-SemiBold',
    },
    walletNameText: {
        fontSize: 10,
    },
    actionContainer: {
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    actionItem: {
        width: 55,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
    actionIcon: {
        width: 50,
        height: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabViewContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
    },
    tabViewHeader: {
        height: 50,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabViewHeaderItem: {
        flex: 1,
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#fff',
    },
    tabViewContent: {
        flex: 1,
        paddingHorizontal: 10,
    },
    itemInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemDesc: {
        marginLeft: 10,
    },
    itemName: {
        fontWeight: 'bold',
    },
    itemSymbol: {
        fontSize: 12,
    },
    itemPrice: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    addTokenButton: {
        width: '100%',
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    item: {
        height: 70,
        width: '100%',
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 0,
    },
    itemImg: {
        width: 42,
        height: 42,
        borderRadius: 10000,
    },
    img: {
        width: 64,
        height: 64,
        marginRight: 0,
        justifyContent: 'center',
        alignSelf: 'center',
        borderRadius: 100,
        backgroundColor: 'black',
    },
    itemIcon: {
        width: 30,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemAmount: {
        width: 120,
        height: '100%',
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    itemDetail: {
        flex: 1,
        paddingLeft: 10,
    },
    itemAmountText: {
        color: '#f33360',
        fontSize: 13,
    },
    itemAmountSub: {
        color: '#8c8c8c',
        fontSize: 12,
        // fontWeight: 'bold',
    },
    itemToAddressText: {
        fontFamily: 'Sora-Bold',
        fontSize: 11,
    },
    emptyContainer: {
        width: '100%',
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyImg: {
        width: 150,
        height: 150,
    },
    transactionDetailContainer: {
        height: '90%',
    },
});
export default WalletDetailScreen;
