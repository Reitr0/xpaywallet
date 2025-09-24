import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { WalletAction } from '@persistence/wallet/WalletAction';
import CommonTouchableOpacity from '@components/commons/CommonTouchableOpacity';
import Icon, { Icons } from '@components/icons/Icons';
import CommonText from '@components/commons/CommonText';
import CommonFlatList from '@components/commons/CommonFlatList';
import CommonImage from '@components/commons/CommonImage';
import CommonLoading from '@components/commons/CommonLoading';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import Price from '@components/Price';
import CommonButton from '@components/commons/CommonButton';
import Balance from '@components/Balance';
import { WalletFactory } from '@modules/core/factory/WalletFactory';
import NftImage from '@components/NftImage';
import { NftsFactory } from '@modules/core/factory/NftsFactory';
import usePriceHook from '@persistence/price/PriceHook';
import NumberFormatted from '@components/NumberFormatted';
import AddTokenScreen from '@screens/token/AddTokenScreen';
import CoinList from '@screens/home/CoinList';
import TotalBalance from '@components/TotalBalance';
import AssetList from "@screens/home/AssetList";
import ForexList from "@screens/home/ForexList";
import LinearGradient from 'react-native-linear-gradient';

function HomeScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { activeWallet } = useSelector(state => state.WalletReducer);
    const { unread } = useSelector(state => state.NotifyReducer);

    const { theme } = useSelector(state => state.ThemeReducer);
    const [tab, setTab] = useState('Tokens');
    const dispatch = useDispatch();
    const [refreshing, setRefreshing] = useState(false);
    const [nfts, setNfts] = useState([]);
    const onRefresh = useCallback(async () => {
        CommonLoading.show();
        dispatch(WalletAction.balance()).then(() => {
            loadNfts();
            setRefreshing(false);
            CommonLoading.hide();
        });
    }, []);
    useEffect(() => {
        (async () => {
            await loadNfts();
        })();
    }, [activeWallet.chain]);
    const loadNfts = async () => {
        setTimeout(async () => {
            const ethWallet = await WalletFactory.getWallet('ETH');
            const result = await NftsFactory.getNfts(
                activeWallet.chain,
                ethWallet.data.walletAddress,
            );
            setNfts(result);
        }, 1000);
    };

    const renderNftItem = ({ item, index }) => {
        return (
            <CommonTouchableOpacity
                style={styles.nftItem}
                onPress={async () => {
                    navigation.navigate('NftDetailScreen', {
                        nft: item,
                        chain: item.chain,
                    });
                }}>
                <NftImage
                    style={styles.image}
                    resizeMode={'cover'}
                    source={item.metadata.image}
                //format={"SVG"}
                />
                <View style={styles.itemInfoContainer}>
                    <View style={styles.itemNameContainer}>
                        <CommonText
                            style={{ color: theme.text }}
                            numberOfLines={1}>
                            {item.name || item.metadata.description}
                        </CommonText>
                    </View>
                </View>
            </CommonTouchableOpacity>
        );
    };
    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: theme.background4 }]}>
            <View style={[styles.header]}>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <CommonImage
                        source={require('@assets/images/logo2.png')}
                        style={styles.logo}
                    />
                </View>
                <CommonText style={{ fontSize: 16, fontWeight: 'Bold', marginLeft: 8 }}>Welcome to XPAY</CommonText>
            </View>
            <LinearGradient colors={theme.gradientMain} style={[styles.headerCard]} start={{ x: 0.0, y: 1 }} end={{ x: 1, y: 0.0 }}>
                <View style={[styles.balanceContainer]}>
                    <CommonText style={styles.walletNameText}>
                        {activeWallet.name}
                    </CommonText>
                    <TotalBalance decimals={2} style={styles.balanceText} />
                </View>
                <View style={[styles.actionContainer]}>
                    <CommonTouchableOpacity
                        style={styles.actionItem}
                        onPress={() => {
                            navigation.navigate('SelectWalletScreen', {
                                action: 'SEND',
                            });
                        }}>
                        {/* <View
                            style={[
                                styles.actionIcon,
                                { backgroundColor: theme.homeButton },
                            ]}>
                            
                        </View> */}
                        <Icon
                            type={Icons.Feather}
                            size={18}
                            name={'arrow-up'}
                            color={theme.text}
                        />
                        <CommonText>{t('wallet.send')}</CommonText>
                    </CommonTouchableOpacity>
                    <View style={{ width: 1.25, height: '30%', backgroundColor: theme.background2 }} />
                    <CommonTouchableOpacity
                        style={styles.actionItem}
                        onPress={() => {
                            navigation.navigate('SelectWalletScreen', {
                                action: 'RECEIVE',
                            });
                        }}>
                        {/* <View
                            style={[
                                styles.actionIcon,
                                { backgroundColor: theme.homeButton },
                            ]}>
                        </View> */}
                        <Icon
                            type={Icons.Feather}
                            size={18}
                            name={'arrow-down'}
                            color={theme.text}
                        />
                        <CommonText>{t('wallet.receive')}</CommonText>
                    </CommonTouchableOpacity>
                    {/*<CommonTouchableOpacity*/}
                    {/*    style={styles.actionItem}*/}
                    {/*    onPress={() => {*/}
                    {/*        navigation.navigate('SelectWalletScreen', {*/}
                    {/*            action: 'BUY',*/}
                    {/*        });*/}
                    {/*    }}>*/}
                    {/*    <View*/}
                    {/*        style={[*/}
                    {/*            styles.actionIcon,*/}
                    {/*            {backgroundColor: theme.homeButton},*/}
                    {/*        ]}>*/}
                    {/*        <Icon*/}
                    {/*            type={Icons.Ionicons}*/}
                    {/*            size={18}*/}
                    {/*            name={'ios-cart-outline'}*/}
                    {/*            color={theme.text}*/}
                    {/*        />*/}
                    {/*    </View>*/}
                    {/*    <CommonText>{t('wallet.buy')}</CommonText>*/}
                    {/*</CommonTouchableOpacity>*/}
                    {/*<CommonTouchableOpacity*/}
                    {/*    style={styles.actionItem}*/}
                    {/*    onPress={() => {*/}
                    {/*        navigation.navigate('AddTokenScreen', {});*/}
                    {/*    }}>*/}
                    {/*    <View*/}
                    {/*        style={[*/}
                    {/*            styles.actionIcon,*/}
                    {/*            {backgroundColor: theme.homeButton},*/}
                    {/*        ]}>*/}
                    {/*        <Icon*/}
                    {/*            type={Icons.Ionicons}*/}
                    {/*            size={18}*/}
                    {/*            name={'add-outline'}*/}
                    {/*            color={theme.text}*/}
                    {/*        />*/}
                    {/*    </View>*/}
                    {/*    <CommonText>{t('import_import_wallet')}</CommonText>*/}
                    {/*</CommonTouchableOpacity>*/}
                </View>
            </LinearGradient>
            <View
                style={[
                    styles.tabViewContainer,
                    { backgroundColor: theme.background },
                ]}>
                <View style={styles.tabViewHeader}>
                    <CommonTouchableOpacity
                        onPress={() => {
                            setTab('Tokens');
                        }}
                        style={[
                            styles.tabViewHeaderItem,
                            { borderBottomColor: theme.tabBorder },
                            tab === 'Tokens'
                                ? {
                                    borderBottomColor: theme.button,
                                    borderBottomWidth: 2,
                                }
                                : {},
                        ]}>
                        <CommonText
                            style={{
                                color:
                                    tab === 'Tokens'
                                        ? theme.button
                                        : theme.subText,
                                fontWeight: 'bold',
                            }}>
                            {t('home.tokens')}
                        </CommonText>
                    </CommonTouchableOpacity>
                    <CommonTouchableOpacity
                        onPress={() => {
                            setTab('NFTs');
                        }}
                        style={[
                            styles.tabViewHeaderItem,
                            { borderBottomColor: theme.tabBorder },
                            tab === 'NFTs'
                                ? {
                                    borderBottomColor: theme.button,
                                    borderBottomWidth: 2,
                                }
                                : {},
                        ]}>
                        <CommonText
                            style={{
                                color:
                                    tab === 'NFTs'
                                        ? theme.button
                                        : theme.subText,
                                fontWeight: 'bold',
                            }}>
                            {t('home.nfts')}
                        </CommonText>
                    </CommonTouchableOpacity>
                    <CommonTouchableOpacity
                        onPress={() => {
                            setTab('Forex');
                        }}
                        style={[
                            styles.tabViewHeaderItem,
                            { borderBottomColor: theme.tabBorder },
                            tab === 'Forex'
                                ? {
                                    borderBottomColor: theme.button,
                                    borderBottomWidth: 2,
                                }
                                : {},
                        ]}>
                        <CommonText
                            style={{
                                color:
                                    tab === 'Forex'
                                        ? theme.button
                                        : theme.subText,
                                fontWeight: 'bold',
                            }}>
                            {t('home.forex')}
                        </CommonText>
                    </CommonTouchableOpacity>
                </View>
                <View style={styles.tabViewContent}>
                    {tab === 'Tokens' && <CoinList />}
                    {tab === 'NFTs' && <AssetList />}
                    {tab === 'Forex' && <ForexList />}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 64,
        paddingHorizontal: 10,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'space-between',
    },
    headerCard: {
        width: 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        paddingBottom: 4,
        margin: 16,
        borderRadius: 8,
        // backgroundColor: '#fff'
    },
    balanceContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    balanceText: {
        fontFamily: 'Sora-Bold',
        fontSize: 28,
        fontWeight: 'bold',
    },
    walletNameText: {
        fontSize: 12,
    },
    actionContainer: {
        height: 100,
        width: '100%',
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'space-evenly',
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
        fontSize: 15,
    },
    itemSymbol: {
        fontSize: 12,
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
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    item: {
        height: 60,
        width: '100%',
        marginBottom: 10,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemImg: {
        width: 42,
        height: 42,
        borderRadius: 10000,
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
        width: 56,
        height: 56,
        borderRadius: 100,
        padding: 8,
        marginTop: 16,
        marginBottom: 16,
        borderWidth: 5,
        borderColor: '#fff',
        backgroundColor: '#fff',
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
        borderBottomColor: '#555555',
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
        borderRadius: 20,
    },
});
export default HomeScreen;
