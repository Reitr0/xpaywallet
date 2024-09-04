import React, {useEffect, useRef, useState} from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import CommonBackButton from '@components/commons/CommonBackButton';
import CommonText from '@components/commons/CommonText';
import {useTranslation} from 'react-i18next';
import CommonTouchableOpacity from '@components/commons/CommonTouchableOpacity';
import Icon, {Icons} from '@components/icons/Icons';
import Clipboard from '@react-native-clipboard/clipboard';
import CommonLoading from '@components/commons/CommonLoading';
import {Logs} from '@modules/log/logs';
import ActionSheet from 'react-native-actions-sheet';
import QRCodeScanner from 'react-native-qrcode-scanner';
import {RNCamera} from 'react-native-camera';
import CommonAlert from '@components/commons/CommonAlert';
import {WalletFactory} from '@modules/core/factory/WalletFactory';
import {
    ASSET_TYPE_COIN,
    ASSET_TYPE_TOKEN,
    CHAIN_TO_SYMBOL_MAP,
} from '@modules/core/constant/constant';
import {WalletAction} from '@persistence/wallet/WalletAction';
import Balance from '@components/Balance';
import CommonButton from '@components/commons/CommonButton';
import Price from '@components/Price';

export default function TronWalletSendScreen({navigation}) {
    const {activeWallet} = useSelector(state => state.WalletReducer);
    const {prices} = useSelector(state => state.PriceReducer);
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const {theme} = useSelector(state => state.ThemeReducer);
    const {fee: feeData} = useSelector(state => state.FeeReducer);
    const [fee] = useState(feeData[activeWallet.activeAsset.chain]);
    const [destination, setDestination] = useState('');
    const [value, setValue] = useState('');
    const [maxAmount, setMaxAmount] = useState(0);
    const [toFiat, setToFiat] = useState(0);
    const [estimatedGasFee, setEstimatedGasFee] = useState({});
    const [serviceFee, setServiceFee] = useState(0);
    const actionSheetRef = useRef(null);
    const actionCamera = useRef(null);
    const [refreshing, setRefreshing] = useState(false);
    const [gasFee, setGasFee] = useState({
        TRON: 0.002,
    });
    useEffect(() => {
        (async () => {
            initMaxAmount();
        })();
    }, []);
    const onRefresh = async () => {
        CommonLoading.show();
        dispatch(WalletAction.balance()).then(() => {
            CommonLoading.hide();
        });
    };
    const reset = () => {
        setToFiat('');
        setValue('');
        setEstimatedGasFee({});
        setServiceFee(0);
        setDestination(0);
    };
    const initMaxAmount = () => {
        let max = activeWallet.activeAsset.balance;
        let makerFee = fee.rate;
        let makerAmount = (activeWallet.activeAsset.balance * makerFee) / 100;
        if (activeWallet.activeAsset.type === ASSET_TYPE_TOKEN) {
            max -= makerAmount;
        } else {
            max = max - makerAmount - gasFee[activeWallet.activeAsset.chain];
        }
        setMaxAmount(max > 0 ? max.toString() : '');
    };
    const getServiceFee = async balance => {
        if (fee.enabled === true) {
            let makerFee = fee.rate;
            return (balance * makerFee * 0) / 100;
        }
        return 0;
    };
    const fetchCopiedText = async () => {
        const text = await Clipboard.getString();
        setDestination(text);
    };
    const onSuccess = e => {
        setDestination(e.data);
        actionCamera.current?.hide();
    };
    const onEndEditing = async () => {
        if (!value || !destination) {
            return;
        }
        await prepareTx();
    };
    const prepareTx = async () => {
        if (!value || !destination) {
            CommonAlert.show({
                title: t('alert.error'),
                message: t('please_fill'),
                type: 'error',
            });
            return;
        }
        if (value <= 0) {
            CommonAlert.show({
                title: t('alert.error'),
                message: t('insufficient_fund'),
                type: 'error',
            });
            return;
        }
        try {
            const tx = {
                from: activeWallet.activeAsset.walletAddress,
                to: destination,
                value: value,
            };
            const {success, data} = await WalletFactory.getTransactionFee(
                activeWallet.activeAsset.chain,
                tx,
            );

            if (!success) {
                CommonAlert.show({
                    title: t('alert.error'),
                    message: data,
                    type: 'error',
                });
                return;
            }
            setEstimatedGasFee(data);
            const makerFee = await getServiceFee(value);
            setServiceFee(makerFee);
            actionSheetRef.current?.show();
        } catch (error) {
            Logs.error('TronWalletSendScreen: prepareTx' + error);
            CommonAlert.show({
                title: t('alert.error'),
                message: error,
                type: 'error',
            });
        }
    };

    const executeTX = async () => {
        actionSheetRef.current?.hide();
        try {
            console.log(activeWallet.activeAsset.chain);
            const tx = {
                to: destination,
                value: value,
                privateKey: activeWallet.activeAsset.privateKey,
            };
            if (fee.enabled === true) {
                tx.takerFee = fee.rate;
                tx.takerAddress = fee.address;
            }
            if (activeWallet.activeAsset.type === ASSET_TYPE_TOKEN) {
                tx.tokenContractAddress = activeWallet.activeAsset.contract;
            }
            console.log(activeWallet.activeAsset.chain);
            const {success, data} = await WalletFactory.sendTransaction(
                activeWallet.activeAsset.chain,
                tx,
            );
            if (success) {
                CommonAlert.show({
                    title: t('alert.success'),
                    message: t('message.transaction_done'),
                });
                reset();
            } else {
                CommonAlert.show({
                    title: t('alert.error'),
                    message: data,
                    type: 'error',
                });
            }
        } catch (error) {
            Logs.error('TronWalletSendScreen: executeTX' + error);
            CommonAlert.show({
                title: t('alert.error'),
                message: error,
                type: 'error',
            });
        }
    };

    return (
        <View style={[styles.container, {backgroundColor: theme.background4}]}>
            <SafeAreaView style={[styles.container]}>
                <View
                    style={[
                        styles.container,
                        {backgroundColor: theme.background},
                    ]}>
                    <View
                        style={[
                            styles.header,
                            {backgroundColor: theme.background4},
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
                                {t('send.send_transaction')}{' '}
                                {activeWallet.activeAsset.symbol}
                            </CommonText>
                        </View>
                        <View style={[styles.rightHeader, {width: 150}]}>
                            <Balance
                                style={styles.headerTitle}
                                symbol={activeWallet.activeAsset.symbol}>
                                {activeWallet.activeAsset.balance}
                            </Balance>
                        </View>
                    </View>
                    <ScrollView
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                            />
                        }>
                        <View style={styles.content}>
                            <View
                                style={[
                                    styles.inputView,
                                    {backgroundColor: theme.inputBackground},
                                ]}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {color: theme.inputText},
                                    ]}
                                    onChangeText={v => setDestination(v)}
                                    value={destination}
                                    placeholder={t('tx.destination_address')}
                                    numberOfLines={1}
                                    returnKeyType="done"
                                    placeholderTextColor="gray"
                                    autoCompleteType={'off'}
                                    autoCapitalize={'none'}
                                    autoCorrect={false}
                                    onEndEditing={async () => {
                                        await onEndEditing();
                                    }}
                                />
                                <CommonTouchableOpacity
                                    onPress={async () => {
                                        await fetchCopiedText();
                                    }}
                                    style={styles.moreBtn}>
                                    <CommonText
                                        style={{
                                            color: theme.inputIcon,
                                            fontWeight: 'bold',
                                        }}>
                                        {t('paste')}
                                    </CommonText>
                                </CommonTouchableOpacity>
                                <CommonTouchableOpacity
                                    onPress={() => actionCamera.current?.show()}
                                    style={styles.moreBtn2}>
                                    <Icon
                                        name="scan-outline"
                                        size={21}
                                        type={Icons.Ionicons}
                                        color={theme.inputIcon}
                                    />
                                </CommonTouchableOpacity>
                            </View>

                            <View
                                style={[
                                    styles.inputView,
                                    {backgroundColor: theme.inputBackground},
                                ]}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {color: theme.inputText},
                                    ]}
                                    value={value}
                                    placeholder={
                                        t('tx.amount') +
                                        ' ' +
                                        activeWallet.activeAsset.symbol
                                    }
                                    onChangeText={v => {
                                        setValue(v);
                                        setToFiat(
                                            v *
                                                prices[
                                                    activeWallet.activeAsset.id
                                                ][0],
                                        );
                                    }}
                                    keyboardType="numeric"
                                    numberOfLines={1}
                                    returnKeyType="done"
                                    placeholderTextColor="gray"
                                    onEndEditing={async () => {
                                        await onEndEditing();
                                    }}
                                />
                                <CommonTouchableOpacity
                                    style={styles.moreBtn2}
                                    onPress={async () => {
                                        setValue(maxAmount);
                                        setToFiat(
                                            parseFloat(maxAmount) *
                                                prices[
                                                    activeWallet.activeAsset.id
                                                ][0],
                                        );
                                    }}>
                                    <CommonText
                                        style={[
                                            styles.max,
                                            {color: theme.inputIcon},
                                        ]}>
                                        {t('tx.max')}
                                    </CommonText>
                                </CommonTouchableOpacity>
                            </View>
                            {value !== '' && (
                                <View style={styles.fiatContainer}>
                                    <CommonText
                                        style={[
                                            styles.totalOfferAmount,
                                            {color: theme.text},
                                        ]}>
                                        <CommonText
                                            style={styles.totalOfferAmount}>
                                            {t('total_offer_amount')} {': '}{' '}
                                            {value}{' '}
                                            {activeWallet.activeAsset.symbol}
                                            {' ('}
                                        </CommonText>
                                        <Price style={styles.totalOfferAmount}>
                                            {toFiat}
                                        </Price>
                                        <CommonText
                                            style={styles.totalOfferAmount}>
                                            {')'}
                                        </CommonText>
                                    </CommonText>
                                </View>
                            )}
                        </View>
                        <View style={styles.buttonContainer}>
                            <CommonButton
                                text={t('tx.next')}
                                onPress={async () => {
                                    await prepareTx();
                                }}
                            />
                        </View>
                        <ActionSheet
                            ref={actionSheetRef}
                            gestureEnabled={true}
                            containerStyle={{
                                backgroundColor: theme.background2,
                            }}
                            headerAlwaysVisible>
                            <View
                                style={[
                                    styles.confirmTx,
                                    {backgroundColor: theme.background2},
                                ]}>
                                <View
                                    style={[
                                        styles.confirmTxHeader,
                                        {backgroundColor: theme.background2},
                                    ]}>
                                    <View
                                        style={[
                                            styles.confirmTxItem,
                                            {
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            },
                                        ]}>
                                        <CommonText
                                            style={{
                                                fontWeight: 'bold',
                                                fontSize: 18,
                                            }}>
                                            {t('send.confirm_transaction')}
                                        </CommonText>
                                    </View>
                                </View>

                                <View style={styles.confirmTxItem}>
                                    <CommonText>{t('send.amount')}</CommonText>
                                    <Balance
                                        symbol={
                                            activeWallet.activeAsset.symbol
                                        }>
                                        {value}
                                    </Balance>
                                </View>
                                {
                                    fee?.enabled === true
                                        && (
                                        <View style={styles.confirmTxItem}>
                                            <CommonText>
                                                {t('send.service_fee')}
                                            </CommonText>
                                            <Balance
                                                symbol={
                                                    activeWallet.activeAsset
                                                        .type === ASSET_TYPE_COIN
                                                        ? CHAIN_TO_SYMBOL_MAP[
                                                              activeWallet
                                                                  .activeAsset.chain
                                                          ]
                                                        : activeWallet.activeAsset
                                                              .symbol
                                                }>
                                                {serviceFee}
                                            </Balance>
                                        </View>
                                    )
                                }
                                <View style={styles.confirmTxItem}>
                                    <CommonText>
                                        {t('send.bandwidth')}
                                    </CommonText>
                                    <CommonText>
                                        <Balance>
                                            {estimatedGasFee.freeNetUsed}
                                        </Balance>
                                        /
                                        <Balance>
                                            {estimatedGasFee.freeNetLimit}
                                        </Balance>
                                    </CommonText>
                                </View>
                                <View style={styles.confirmTxItem}>
                                    <CommonText>{t('send.total')}</CommonText>
                                    {activeWallet.activeAsset.type ===
                                        ASSET_TYPE_COIN && (
                                        <Balance
                                            symbol={
                                                activeWallet.activeAsset.symbol
                                            }>
                                            {parseFloat(value) +
                                                parseFloat(serviceFee)}
                                        </Balance>
                                    )}
                                    {activeWallet.activeAsset.type ===
                                        ASSET_TYPE_TOKEN && (
                                        <>
                                            <CommonText>
                                                <Balance
                                                    symbol={
                                                        activeWallet.activeAsset
                                                            .symbol
                                                    }>
                                                    {parseFloat(value) +
                                                        parseFloat(serviceFee)}
                                                </Balance>
                                                {' + '}
                                                <Balance
                                                    symbol={
                                                        CHAIN_TO_SYMBOL_MAP[
                                                            activeWallet
                                                                .activeAsset
                                                                .chain
                                                        ]
                                                    }>
                                                    {parseFloat(
                                                        estimatedGasFee
                                                            .estimateGas
                                                            ?.ether * 2,
                                                    )}
                                                </Balance>
                                            </CommonText>
                                        </>
                                    )}
                                </View>
                                <View style={styles.confirmTxButton}>
                                    <CommonButton
                                        textStyle={{color: 'black'}}
                                        style={{backgroundColor: 'white'}}
                                        text={t('tx.send')}
                                        onPress={async () => {
                                            await executeTX();
                                        }}
                                    />
                                </View>
                            </View>
                        </ActionSheet>
                        <ActionSheet
                            ref={actionCamera}
                            gestureEnabled={true}
                            headerAlwaysVisible
                            containerStyle={styles.cameraContainer}>
                            <QRCodeScanner
                                onRead={onSuccess}
                                cameraContainerStyle={{margin: 20}}
                                flashMode={RNCamera.Constants.FlashMode.auto}
                            />
                        </ActionSheet>
                    </ScrollView>
                </View>
            </SafeAreaView>
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
    content: {
        flex: 1,
    },
    gradient: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    inputView: {
        height: 60,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 5,
        borderRadius: 10,
        fontSize: 14,
        marginVertical: 10,
        marginBottom: 0,
        marginHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    input: {flex: 1, color: 'black'},
    moreBtn: {
        justifyContent: 'center',
        marginRight: 20,
        paddingLeft: 10,
    },
    moreBtn2: {
        justifyContent: 'center',
        marginRight: 10,
    },
    toFiat: {
        marginLeft: 20,
        marginTop: 10,
        fontSize: 28,
        fontWeight: 'bold',
    },
    fiatContainer: {
        flexDirection: 'row',
        height: 50,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    buttonContainer: {
        height: 70,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    cameraContainer: {
        margin: 10,
        backgroundColor: 'black',
        height: 500,
    },
    confirmTx: {
        width: '100%',
    },
    confirmTxItem: {
        height: 40,
        width: '100%',
        marginVertical: 5,
        paddingHorizontal: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    middleHeader: {
        flex: 1,
    },
    max: {
        textTransform: 'capitalize',
        fontWeight: 'bold',
    },
    totalOfferAmount: {
        color: '#616161',
    },
    confirmTxHeader: {
        height: 50,
        width: '100%',
    },
    confirmTxButton: {
        marginVertical: 10,
        paddingHorizontal: 10,
    },
    gapBackground: {
        height: 50,
        width: '100%',
        position: 'absolute',
        top: 0,
    },
});
