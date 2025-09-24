import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image } from 'react-native';
import { StorageService } from "@modules/core/storage/StorageService";
import { useTranslation } from "react-i18next";
import CommonText from '@components/commons/CommonText';
import { useDispatch, useSelector } from 'react-redux';
import { forexListSymbols } from '@modules/core/constant/constant';
import { logos } from './logos';

import CommonButton from '@components/commons/CommonButton';
import CommonFlatList from '@components/commons/CommonFlatList';
import CommonTouchableOpacity from '@components/commons/CommonTouchableOpacity';
import CommonImage from '@components/commons/CommonImage';
import Price from '@components/Price';
import usePriceHook from '@persistence/price/PriceHook';
import Balance from '@components/Balance';
import NumberFormatted from '@components/NumberFormatted';
import { stockListSymbols } from '@modules/core/constant/constant';
import { setSelectedToken } from '@persistence/token/TokenReducer';
import { useNavigation } from '@react-navigation/native';
import { useWalletList } from '@persistence/wallet/WalletHook';
import { WalletAction } from '@persistence/wallet/WalletAction';

const ForexList = () => {
    const { t } = useTranslation();
    const [forexData, setForexData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { wallets } = useWalletList();
    const { theme } = useSelector(state => state.ThemeReducer);
    const dispatch = useDispatch()
    const navigation = useNavigation()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiKey = 'EgUORG8vbVp9qPeMYeC6uknXFSTcLVih';

                const forexPromises = forexListSymbols.map(symbol =>
                    fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`).then(res => res.json())
                );

                const forexQuotes = await Promise.all(forexPromises);

                const newForexData = forexQuotes.map((forexQuote, index) => {
                    const price = forexQuote[0].price;
                    const previousClose = forexQuote[0].previousClose;
                    const change = ((price - previousClose) / previousClose) * 100;

                    return {
                        name: forexListSymbols[index],
                        price: price,
                        change: change.toFixed(2),
                        amount: 0,
                    };
                });

                setForexData(newForexData);
                await StorageService.setItem('forexData', JSON.stringify(newForexData));

            } catch (error) {
                console.error('Error fetching or saving data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        const loadData = async () => {
            try {
                const storedForexData = await StorageService.getItem('forexData');
                if (storedForexData) {
                    setForexData(JSON.parse(storedForexData));
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
        fetchData();
    }, []);

    const renderForexItem = ({ item }) => {
        const logoSource = logos[item.name] || logos['default_logo'];

        const walletIndex = wallets.findIndex(wallet =>
            wallet.symbol?.trim().toUpperCase() === item.name
        );

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
                        {/* <View>
                        <CommonImage
                            source={logoSource}
                            style={styles.itemImg}
                        />
                    </View> */}
                        <View style={styles.itemDesc}>
                            <CommonText
                                style={[styles.itemName, { color: theme.text2 }]}>
                                {item.name}
                            </CommonText>
                            <CommonText
                                style={[
                                    styles.itemSymbol,
                                    { color: theme.text2 },
                                ]}>
                                {item.price.toFixed(2)}
                            </CommonText>
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
        )
    };

    return (
        <FlatList
            data={forexData}
            renderItem={renderForexItem}
            keyExtractor={(item) => item.name}
            style={styles.container}
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

export default ForexList;
