import * as React from 'react';
import {useCallback, useEffect, useRef, useState} from 'react';
import usePriceHook from '@persistence/price/PriceHook';
import Price from '@components/Price';
import {Dimensions, StyleSheet, View} from 'react-native';
import CommonButton from '@components/commons/CommonButton';
import CommonFlatList from '@components/commons/CommonFlatList';
import CommonTouchableOpacity from '@components/commons/CommonTouchableOpacity';
import {WalletAction} from '@persistence/wallet/WalletAction';
import CommonImage from '@components/commons/CommonImage';
import CommonText from '@components/commons/CommonText';
import Balance from '@components/Balance';
import NumberFormatted from '@components/NumberFormatted';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import CommonLoading from '@components/commons/CommonLoading';
import {MarketAction} from '@persistence/market/MarketAction';
import {useWalletList} from '@persistence/wallet/WalletHook';
import {applicationProperties} from '@src/application.properties';
import {ASSET_TYPE_COIN} from '@modules/core/constant/constant';
import _ from 'lodash';
import {StorageService} from "@modules/core/storage/StorageService";

function StockList(props) {
    const {getPriceData} = usePriceHook();
    const {t} = useTranslation();
    const navigation = useNavigation();
    const {wallets} = useWalletList();
    const {theme} = useSelector(state => state.ThemeReducer);
    const [refreshing, setRefreshing] = useState(false);
    const dispatch = useDispatch();
    const onRefresh = useCallback(async () => {
        CommonLoading.show();
        dispatch(WalletAction.balance()).then(() => {
            setRefreshing(false);
            dispatch(MarketAction.getMarkets(30, true));
            CommonLoading.hide();
        });
    }, []);
    const [mxgPrice, setMXGPrice] = useState(null);
    const [bitcoinPrice, setBitcoinPrice] = useState(null);
    const [ethPrice, setEthPrice] = useState(null);
    const [dogePrice, setDogePrice] = useState(null);
    const [ltcPrice, setLtcPrice] = useState(null);
    const [usdcPrice, setUsdcPrice] = useState(null);
    const initialPrice = useRef(null);
    const ltcinitialPrice = useRef(null);
    const dogeinitialPrice = useRef(null);
    const ethinitialPrice = useRef(null);
    const usdcInitialPrice = useRef(null);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const response = await fetch('https://account.metaxbank.io/api/mx-gold-price');
                const priceText = await response.text();
                setMXGPrice(parseFloat(priceText)); // Store the price as a number
            } catch (error) {
                console.error('Error fetching MXG price:', error);
            }
        };

        fetchPrice();
    }, []);
    useEffect(() => {
        const fetchBitcoinPrice = async () => {
            try {
                const url = "https://pro-api.coingecko.com/api/v3/simple/price"; // Example paid API endpoint
                const params = {
                    ids: 'bitcoin',
                    vs_currencies: 'usd'
                };
                const headers = {
                    'x-cg-pro-api-key': 'CG-LNED56hrE5VAyB57GyXBkuSu' // Include your API key
                };

                const response = await fetch(`${url}?${new URLSearchParams(params)}`, { headers });
                const data = await response.json();

                const price = parseFloat(data.bitcoin.usd);

                // Load the initial price from localStorage on the first render
                if (initialPrice.current === null) {
                    const storedPrice = await StorageService.getItem('initialBitcoinPrice');
                    if (storedPrice) {
                        initialPrice.current = parseFloat(storedPrice);
                        setBitcoinPrice(initialPrice.current);
                    } else {
                        initialPrice.current = price;
                        await StorageService.setItem('initialBitcoinPrice', price);
                    }
                }

                setBitcoinPrice(price);

                // Save the latest price to localStorage after each fetch
                await StorageService.setItem('latestBitcoinPrice', price);

            } catch (error) {
                console.error('Error fetching Bitcoin price:', error);
            }
        };

        // Check if it's a new day and reset the initial price
        const resetInitialPrice = async () => {
            const lastResetDate = await StorageService.getItem('lastResetDate');
            const today = new Date().toDateString();

            if (lastResetDate !== today) {
                // It's a new day, reset initial price
                initialPrice.current = bitcoinPrice;
                await StorageService.setItem('initialBitcoinPrice', bitcoinPrice);
                await StorageService.setItem('lastResetDate', today);
            }
        }

        // Call resetInitialPrice on initial render and every subsequent fetch
        resetInitialPrice();
        fetchBitcoinPrice();
        const intervalId = setInterval(() => {
            fetchBitcoinPrice();
            resetInitialPrice();
        }, 10000);

        return () => clearInterval(intervalId);
    }, []);
    useEffect(() => {
        const fetchEthPrice = async () => {
            try {
                const url = "https://pro-api.coingecko.com/api/v3/simple/price"; // Example paid API endpoint
                const params = {
                    ids: 'ethereum',
                    vs_currencies: 'usd'
                };
                const headers = {
                    'x-cg-pro-api-key': 'CG-LNED56hrE5VAyB57GyXBkuSu' // Include your API key
                };

                const response = await fetch(`${url}?${new URLSearchParams(params)}`, { headers });
                const data = await response.json();

                const price = parseFloat(data.ethereum.usd);

                // Load initial price from localStorage
                if (ethinitialPrice.current === null) {
                    const storedPrice = await StorageService.getItem('initialEthPrice');
                    if (storedPrice) {
                        ethinitialPrice.current = parseFloat(storedPrice);
                        setEthPrice(ethinitialPrice.current);
                    } else {
                        ethinitialPrice.current = price;
                        await StorageService.setItem('initialEthPrice', price);
                    }
                }

                setEthPrice(price);

                // Save the latest price to localStorage after each fetch
                await StorageService.setItem('latestEthPrice', price);
            } catch (error) {
                console.error('Error fetching Ethereum price:', error);
            }
        };

        const resetethInitialPrice = async () => {
            const lastResetDate = await StorageService.getItem('lastResetDate');
            const today = new Date().toDateString();

            if (lastResetDate !== today) {
                // It's a new day, reset initial price
                ethinitialPrice.current = ethPrice;
                await StorageService.setItem('initialEthPrice', ethPrice);
                await StorageService.setItem('lastResetDate', today);
            }
        }
        resetethInitialPrice();
        fetchEthPrice();
        const intervalId = setInterval(() => {
            fetchEthPrice();
            resetethInitialPrice();
        }, 10000);

        return () => clearInterval(intervalId);
    }, []);
    useEffect(() => {
        const fetchDogePrice = async () => {
            try {
                const url = "https://pro-api.coingecko.com/api/v3/simple/price"; // Example paid API endpoint
                const params = {
                    ids: 'dogecoin',
                    vs_currencies: 'usd'
                };
                const headers = {
                    'x-cg-pro-api-key': 'CG-LNED56hrE5VAyB57GyXBkuSu' // Include your API key
                };

                const response = await fetch(`${url}?${new URLSearchParams(params)}`, { headers });
                const data = await response.json();

                const price = parseFloat(data.dogecoin.usd);

                // Load initial price from localStorage
                if (dogeinitialPrice.current === null) {
                    const storedPrice = await StorageService.getItem('initialDogePrice');
                    if (storedPrice) {
                        dogeinitialPrice.current = parseFloat(storedPrice);
                        setDogePrice(dogeinitialPrice.current);
                    } else {
                        dogeinitialPrice.current = price;
                        await StorageService.setItem('initialDogePrice', price);
                    }
                }

                setDogePrice(price);

                // Save the latest price to localStorage after each fetch
                await StorageService.setItem('latestDogePrice', price);
            } catch (error) {
                console.error('Error fetching Dogecoin price:', error);
            }
        };

        fetchDogePrice();
        const intervalId = setInterval(fetchDogePrice, 10000);

        return () => clearInterval(intervalId);
    }, []);
    useEffect(() => {
        const fetchLtcPrice = async () => {
            try {
                const url = "https://pro-api.coingecko.com/api/v3/simple/price"; // Example paid API endpoint
                const params = {
                    ids: 'litecoin',
                    vs_currencies: 'usd'
                };
                const headers = {
                    'x-cg-pro-api-key': 'CG-LNED56hrE5VAyB57GyXBkuSu' // Include your API key
                };

                const response = await fetch(`${url}?${new URLSearchParams(params)}`, { headers });
                const data = await response.json();

                const price = parseFloat(data.litecoin.usd);

                // Load initial price from localStorage
                if (ltcinitialPrice.current === null) {
                    const storedPrice = await StorageService.getItem('initialLtcPrice');
                    if (storedPrice) {
                        ltcinitialPrice.current = parseFloat(storedPrice);
                        setLtcPrice(ltcinitialPrice.current);
                    } else {
                        ltcinitialPrice.current = price;
                        await StorageService.setItem('initialLtcPrice', price);
                    }
                }

                setLtcPrice(price);

                // Save the latest price to localStorage after each fetch
                await StorageService.setItem('latestLtcPrice', price);
            } catch (error) {
                console.error('Error fetching Litecoin price:', error);
            }
        };

        fetchLtcPrice();
        const intervalId = setInterval(fetchLtcPrice, 10000);

        return () => clearInterval(intervalId);
    }, []);
    useEffect(() => {
        const fetchUsdcPrice = async () => {
            try {
                const url = "https://pro-api.coingecko.com/api/v3/simple/price";
                const params = {
                    ids: 'usd-coin',
                    vs_currencies: 'usd'
                };
                const headers = {
                    'x-cg-pro-api-key': 'CG-LNED56hrE5VAyB57GyXBkuSu'
                };

                const response = await fetch(`${url}?${new URLSearchParams(params)}`, { headers });
                const data = await response.json();

                const price = parseFloat(data['usd-coin'].usd);

                // Load initial price from localStorage
                if (usdcInitialPrice.current === null) {
                    const storedPrice = await StorageService.getItem('initialUsdcPrice');
                    if (storedPrice) {
                        usdcInitialPrice.current = parseFloat(storedPrice);
                        setUsdcPrice(usdcInitialPrice.current);
                    } else {
                        usdcInitialPrice.current = price;
                        await StorageService.setItem('initialUsdcPrice', price);
                    }
                }

                setUsdcPrice(price);

                // Save the latest price to localStorage after each fetch
                await StorageService.setItem('latestUsdcPrice', price);
            } catch (error) {
                console.error('Error fetching USDC price:', error);
            }
        };

        fetchUsdcPrice();
        const intervalId = setInterval(fetchUsdcPrice, 10000);

        return () => clearInterval(intervalId);
    }, []);
    useEffect(() => {}, []);
    useFocusEffect(
        useCallback(() => {
            const refreshData = async () => {
                CommonLoading.show();
                await dispatch(WalletAction.balance());
                await dispatch(MarketAction.getMarkets(30, true));
                CommonLoading.hide();
            };

            refreshData();

            return () => {
            };
        }, [])
    );
    function getConditionalStyling(item, mxgPrice, bitcoinPrice, ethPrice, dogePrice, ltcPrice, usdcPrice) {
        const itemId = item.id.toLowerCase();

        if (itemId.includes("mxg")) {
            return (mxgPrice - 0.8300) * 100 > 0
                ? { backgroundColor: '#2eb781' }
                : { backgroundColor: '#eb445a' };
        } else if (itemId.includes("btc")) {
            return (bitcoinPrice - initialPrice.current) / 100 > 0
                ? { backgroundColor: '#2eb781' }
                : { backgroundColor: '#eb445a' };
        } else if (itemId.includes("eths")) {
            return (ethPrice - ethinitialPrice.current) / 100 > 0
                ? { backgroundColor: '#2eb781' }
                : { backgroundColor: '#eb445a' };
        } else if (itemId.includes("doge")) {
            return (dogePrice - dogeinitialPrice.current) * 100 > 0
                ? { backgroundColor: '#2eb781' }
                : { backgroundColor: '#eb445a' };
        } else if (itemId.includes("ltc")) {
            return (ltcPrice - ltcinitialPrice.current) / 100 > 0
                ? { backgroundColor: '#2eb781' }
                : { backgroundColor: '#eb445a' };
        } else if (itemId.includes("usdc")) {
            return (usdcPrice - usdcInitialPrice.current) / 100 > 0
                ? { backgroundColor: '#2eb781' }
                : { backgroundColor: '#eb445a' };
        }

        return {}; // No additional styling if no condition matches
    }
    const renderItem = ({item}) => {
        let chainLogo = applicationProperties.logoURI.eth;
        switch (item.chain) {
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
                    dispatch(WalletAction.setActiveAsset(item)).then(() => {
                        navigation.navigate('WalletDetailScreen', {
                            coin: {...item, isNative: item.type !== 'coin'},
                        });
                    });
                }}>
                <View style={[styles.item, {borderBottomColor: theme.border}]}>
                    <View style={styles.itemInfo}>
                        <View>
                            <CommonImage
                                source={{uri: item.logoURI}}
                                style={styles.itemImg}
                            />
                            {item.type !== ASSET_TYPE_COIN && (
                                <CommonImage
                                    source={{uri: chainLogo}}
                                    style={styles.itemChainImg}
                                />
                            )}
                        </View>
                        <View style={styles.itemDesc}>
                            <CommonText
                                style={[styles.itemName, {color: theme.text2}]}>
                                {item.symbol}
                            </CommonText>
                            <Price
                                style={[
                                    styles.itemSymbol,
                                    {color: getPriceData(item.id, 4)},
                                ]}>
                                {item.id.toLowerCase().includes("xusdt") ? 1 : item.id.toLowerCase().includes("usdt") ? 1 : item.id.toLowerCase().includes("mxg") ? mxgPrice : item.id.toLowerCase().includes("btc") ? bitcoinPrice : item.id.toLowerCase().includes("eths") ? ethPrice :
                                    item.id.toLowerCase().includes("doge") ? dogePrice :  item.id.toLowerCase().includes("ltc") ? ltcPrice : item.id.toLowerCase().includes("usdc") ? usdcPrice : getPriceData(item.id, 0)}
                            </Price>
                        </View>
                    </View>
                    <View style={styles.itemPrice}>
                        <View
                            style={[styles.itemDesc, {alignItems: 'flex-end'}]}>
                            <Balance
                                style={[
                                    styles.itemName,
                                    {color: getPriceData(item.id, 4)},
                                ]}>
                                {item.balance}
                            </Balance>
                            <Price
                                style={[
                                    styles.itemSymbol,
                                    {color: getPriceData(item.id, 4)},
                                ]}>
                                {item.id.toLowerCase().includes("xusdt") ? 1 * item.balance : item.id.toLowerCase().includes("usdt") ? 1 * item.balance : item.id.toLowerCase().includes("mxg") ? mxgPrice * item.balance : item.id.toLowerCase().includes("btc") ? bitcoinPrice * item.balance : item.id.toLowerCase().includes("eths") ? ethPrice * item.balance :
                                    item.id.toLowerCase().includes("doge") ? dogePrice * item.balance :  item.id.toLowerCase().includes("ltc") ? ltcPrice * item.balance : item.id.toLowerCase().includes("usdc") ? usdcPrice * item.balance : item.balance * getPriceData(item.id, 0)}
                            </Price>
                        </View>
                    </View>
                    <View
                        style={[
                            styles.percentContainer,
                            {
                                backgroundColor: getPriceData(item.id, 5), // Keep existing backgroundColor logic
                                ...getConditionalStyling(item, mxgPrice, bitcoinPrice, ethPrice, dogePrice, ltcPrice, usdcPrice)
                            }
                        ]}
                    >
                        <NumberFormatted
                            decimals={2}
                            sign={true}
                            style={{color: theme.text, fontSize: 13}}
                            symbol={'%'}>
                            {item.id.toLowerCase().includes("mxg") ? (mxgPrice - 0.9300) * 100 : item.id.toLowerCase().includes("btc") ? (bitcoinPrice - initialPrice.current) / 100 : item.id.toLowerCase().includes("eths") ? (ethPrice - ethinitialPrice.current) / 100
                                : item.id.toLowerCase().includes("doge") ? (dogePrice - dogeinitialPrice.current) * 100 : item.id.toLowerCase().includes("ltc") ? (ltcPrice - ltcinitialPrice.current) / 100 : item.id.toLowerCase().includes("usdc") ? (usdcPrice - usdcInitialPrice.current) / 100 : getPriceData(item.id, 1)}
                        </NumberFormatted>
                    </View>
                </View>
            </CommonTouchableOpacity>
        );
    };
    return (
        <CommonFlatList
            data={wallets}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            keyExtractor={item => `${item.id}${item.chain}${item.contract}`}
            onRefresh={onRefresh}
            refreshing={refreshing}
            ListFooterComponent={() => {
                return (
                    <View style={styles.addTokenButton}>
                        <CommonButton
                            text={t('token.manage')}
                            textStyle={{color: theme.text}}
                            onPress={() => {
                                navigation.navigate('TokenScreen');
                            }}
                        />
                    </View>
                );
            }}
        />
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
    nftItem: {
        width: Dimensions.get('screen').width / 2 - 20,
        height: 220,
        marginLeft: 8,
        marginBottom: 15,
        borderRadius: 10,
        justifyContent: 'center',
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
    image: {height: 220, width: '100%', borderRadius: 20},
    percentContainer: {
        width: 60,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
export default StockList;
