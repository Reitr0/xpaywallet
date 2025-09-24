import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Image } from 'react-native';
import { StorageService } from "@modules/core/storage/StorageService"; // Assuming you have this module
import { useTranslation } from 'react-i18next';
import { logos } from './logos';
import CommonText from '@components/commons/CommonText';
import { useDispatch, useSelector } from 'react-redux';

import CommonButton from '@components/commons/CommonButton';
import CommonFlatList from '@components/commons/CommonFlatList';
import CommonTouchableOpacity from '@components/commons/CommonTouchableOpacity';
import CommonImage from '@components/commons/CommonImage';
import Price from '@components/Price';
import usePriceHook from '@persistence/price/PriceHook';
import Balance from '@components/Balance';
import NumberFormatted from '@components/NumberFormatted';
import { ASSET_TYPE_COIN, stockListSymbols } from '@modules/core/constant/constant';
import { setSelectedToken } from '@src/persistence/token/TokenReducer';
import { useNavigation } from '@react-navigation/native';
import { useWalletList } from '@persistence/wallet/WalletHook';
import { WalletAction } from '@persistence/wallet/WalletAction';
import { applicationProperties } from '@src/application.properties';
import CommonLoading from '@components/commons/CommonLoading';
import { MarketAction } from '@persistence/market/MarketAction';

const AssetList = () => {
    const { getPriceData } = usePriceHook();
    const { wallets } = useWalletList();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [stockData, setStockData] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const { theme } = useSelector(state => state.ThemeReducer);
    const navigation = useNavigation();
    const onRefresh = useCallback(async () => {
        CommonLoading.show();
        dispatch(WalletAction.balance()).then(() => {
            setRefreshing(false);
            dispatch(MarketAction.getMarkets(30, true));
            CommonLoading.hide();
        });
    }, []);
    const stockListSymbols = ['AAPL', 'GOOG', 'TSLA', 'AMZN']

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiKey = 'EgUORG8vbVp9qPeMYeC6uknXFSTcLVih';

                // 1. Fetch all data concurrently with Promise.all
                const stockPromises = stockListSymbols.map(symbol =>
                    // fetch(`https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=${apiKey}`)
                    //     .then(res => res.json())
                    fetch(`https://financialmodelingprep.com/stable/quote-short?symbol=${symbol}&apikey=${apiKey}`)
                        .then(res => res.json())
                );

                console.log('Wallets: ', wallets)
                const stockQuotes = await Promise.all(stockPromises);

                const newStockData = stockQuotes.map((stockQuote, index) => {
                    const price = stockQuote[0]?.price || 0;
                    const change = stockQuote[0]?.change || 0;
                    const percentageChange = ((change / price) * 100).toFixed(2);
                    const name = stockListSymbols[index]

                    return {
                        name,
                        price,
                        change: percentageChange,
                        amount: 5
                    };
                });

                console.log('NewStockData', newStockData)

                setStockData(newStockData);
                await StorageService.setItem('stockData', JSON.stringify(newStockData));
            } catch (error) {
                console.error('Error fetching or saving data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const loadData = async () => {
            try {
                const storedStockData = await StorageService.getItem('stockData');
                if (storedStockData) {
                    setStockData(JSON.parse(storedStockData));
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        if (!wallets || wallets.length <= 0)
            return

        loadData(); // Load from storage first
        fetchData(); // Then fetch new data
        console.log('Wallet: ', wallets)
    }, [wallets]);
    const renderStockItem = ({ item }) => {
        const logoSource = logos[item.name] || logos['default_logo'];

        const walletIndex = wallets.findIndex(wallet =>
            wallet.symbol?.trim().toUpperCase() === item.name
        );

        let chainLogo = applicationProperties.logoURI.eth;
        switch (wallets[walletIndex].chain) {
            case 'ETH':
                chainLogo = applicationProperties.logoURI.eth;
                break;
            case 'BSC':
                chainLogo = applicationProperties.logoURI.bsc;
                break;
            case 'POLYGON':
                chainLogo = applicationProperties.logoURI.polygon;
                break;
            case 'TRON':
                chainLogo = applicationProperties.logoURI.tron;
                break;
            case 'SOLANA':
                chainLogo = applicationProperties.logoURI.solana;
                break;
        }

        return (
            <CommonTouchableOpacity
                onPress={() => {
                    dispatch(WalletAction.setActiveAsset(wallets[walletIndex])).then(() => {
                        navigation.navigate('WalletDetailScreen', {
                            coin: { ...item, isNative: item.type !== 'coin' },
                        });
                    });
                }}>
                <View style={[styles.item, { borderBottomColor: theme.border }]}>
                    <View style={styles.itemInfo}>
                        <View>
                            <CommonImage
                                source={{ uri: wallets[walletIndex].logoURI }}
                                style={styles.itemImg}
                            />
                            {wallets[walletIndex].type !== ASSET_TYPE_COIN && (
                                <CommonImage
                                    source={{ uri: chainLogo }}
                                    style={styles.itemChainImg}
                                />
                            )}
                        </View>
                        <View style={styles.itemDesc}>
                            <CommonText
                                style={[styles.itemName, { color: theme.text2 }]}>
                                {item.name}
                            </CommonText>
                            <Price
                                style={[
                                    styles.itemSymbol,
                                    { color: theme.text2 },
                                ]}>
                                {item.price}
                            </Price>
                        </View>
                    </View>
                    <View style={styles.itemPrice}>
                        <View
                            style={[styles.itemDesc, { alignItems: 'flex-end' }]}>
                            <Balance
                                style={[
                                    styles.itemName,
                                    { color: theme.text2 },
                                ]}>
                                {wallets[walletIndex].balance}
                            </Balance>
                            <Price
                                style={[
                                    styles.itemSymbol,
                                    { color: theme.text2 },
                                ]}>
                                {wallets[walletIndex].balance}
                            </Price>
                        </View>
                    </View>
                    <View
                        style={[
                            styles.percentContainer,
                            {
                                backgroundColor: (parseFloat(item.change) >= 0 ? '#2eb781' : '#eb445a')
                            }
                        ]}
                    >
                        <NumberFormatted
                            decimals={2}
                            sign={true}
                            style={{ color: theme.text, fontSize: 13 }}
                            symbol={'%'}>
                            {item.change}
                        </NumberFormatted>
                    </View>
                </View>
            </CommonTouchableOpacity>
        );
    };

    return (
        <FlatList
            data={stockData}
            renderItem={renderStockItem}
            keyExtractor={(item) => item.name}
            style={styles.container}
            onRefresh={onRefresh}
            refreshing={refreshing}
        />
    );
};

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
    balanceContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    balanceText: {
        fontSize: 35,
        fontWeight: 'bold',
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
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 15,
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
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
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
        fontSize: 13,
    },
    itemSymbol: {
        fontSize: 11,
    },
    itemPrice: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flex: 1,
        paddingRight: 10,
    },
    addTokenButton: {
        width: '100%',
        marginBottom: 16,
        height: 40,
        borderRadius: 50, // Add this line to make the button rounded
        justifyContent: 'center',
        alignItems: 'center',
    },
    item: {
        height: 60,
        width: '100%',
        marginBottom: 10,
        borderRadius: 3,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemChainImg: {
        width: 16,
        height: 16,
        borderRadius: 10000,
        backgroundColor: 'black',
        position: 'absolute',
        borderWidth: 1,
        borderColor: 'yellow',
        bottom: 0,
        right: 0,
    },
    itemImg: {
        width: 42,
        height: 42,
        borderRadius: 10000,
        borderWidth: 1,
        borderColor: 'blue',
        backgroundColor: 'black',
    },
    notifyContainer: {
        width: 15,
        height: 15,
        backgroundColor: '#c7122a',
        borderRadius: 30,
        position: 'absolute',
        top: -5,
        left: -5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadText: {
        fontWeight: 'bold',
        fontSize: 8,
    },
    logo: {
        width: 24,
        height: 24,
        padding: 5,
        borderRadius: 100,
    },
    itemInfoContainer: {
        width: '100%',
        height: 30,
        position: 'absolute',
        bottom: 10,
        borderBottomWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemNameContainer: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        width: '80%',
        height: 30,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    image: { height: 220, width: '100%', borderRadius: 20 },
    percentContainer: {
        width: 60,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AssetList;
