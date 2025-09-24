import * as React from 'react';
import {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {useDispatch} from 'react-redux';
import CommonImage from '@components/commons/CommonImage';
import {UserAction} from '@persistence/user/UserAction';
import {ThemeAction} from '@persistence/theme/ThemeAction';
import {AppLockAction} from '@persistence/applock/AppLockAction';
import {CurrencyAction} from '@persistence/currency/CurrencyAction';
import {WalletAction} from '@persistence/wallet/WalletAction';

function SplashScreen({navigation}) {
    const dispatch = useDispatch();
    useEffect(() => {
        (async () => {
            dispatch(ThemeAction.set());
            dispatch(AppLockAction.getAppLock());
            dispatch(CurrencyAction.getCurrency());
            setTimeout(() => {
                dispatch(UserAction.get()).then(user => {
                    if (user.registered) {
                        dispatch(WalletAction.findAll());
                    }
                    const nextScreen = user.registered
                        ? 'EnterPinCodeScreen'
                        : 'WalkThroughScreen';
                    navigation.navigate(nextScreen);
                });
            }, 2000);
        })();
    }, []);
    return (
        <View style={[styles.container, {backgroundColor: '#000000'}]}>
            <CommonImage
                source={require('@assets/images/loadingscreen.jpg')}
                style={styles.logo}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 400,
        height: 1200,
    },
});
export default SplashScreen;
