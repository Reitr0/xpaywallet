import React, {useEffect, useState} from 'react';
import {PinCode} from '@components/PinCode';
import {SafeAreaView, StyleSheet, View, BackHandler} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import CommonText from '@components/commons/CommonText';
import CommonLoading from '@components/commons/CommonLoading';
import {UserAction} from '@persistence/user/UserAction';
import {FeeAction} from '@persistence/fee/FeeAction';
import {StorageService} from "@modules/core/storage/StorageService";
import {AppLockAction} from "@persistence/applock/AppLockAction";
import {ThemeAction} from "@persistence/theme/ThemeAction";

const EnterPinCodeScreen = ({route}) => {
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const {theme} = useSelector(state => state.ThemeReducer);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;
    useEffect(() => {
        (async () => {
            // Load appLock settings on component mount
            const storedAppLock = await StorageService.getItem('appLock');
            if (storedAppLock) {
                dispatch(AppLockAction.setAppLock(JSON.parse(storedAppLock)));
            }
            const storedBiometryLock = await StorageService.getItem('biometryLock');
            if (storedBiometryLock !== null) {
                dispatch(AppLockAction.setAppLock({
                    ...appLock,
                    biometryLock: JSON.parse(storedBiometryLock)
                }));
            }
            const savedTheme = await StorageService.getItem('@defaultTheme');
            if (savedTheme) {
                dispatch(ThemeAction.setDefault(JSON.parse(savedTheme)));
            }
        })();
    }, [dispatch]);
    useEffect(() => {
        const backAction = () => {
            return true; // Disable back button
        };

        const backHandler = BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );

        return () => backHandler.remove();
    }, []);

    const success = async () => {
        setTimeout(() => {
            CommonLoading.show();
            dispatch(UserAction.signIn()).then(() => {
                dispatch(FeeAction.getFee());
                CommonLoading.hide();
            });
        }, 150);
    };

    const handleFail = () => {
        if (retryCount < maxRetries) {
            setRetryCount(retryCount + 1);
            console.log(`Retry attempt ${retryCount + 1}`);
        } else {
            console.log('Maximum retry attempts reached');
            // Optionally, handle max retry limit reached
        }
    };

    return (
        <SafeAreaView style={{flex: 1}}>
            <View style={styles.header} />
            <PinCode
                onFail={handleFail}
                onSuccess={success}
                onClickButtonLockedPage={() => console.log('Quit')}
                status={'enter'}
            />
            <View style={styles.securityTextContainer}>
                <CommonText style={[styles.securityText, {color: theme.text2}]}>
                    {t('pincode.pass_code_will_add')}
                </CommonText>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        height: 48,
        paddingHorizontal: 10,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    securityTextContainer: {
        width: '100%',
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    securityText: {
        fontSize: 13,
        textAlign: 'center',
    },
});

export default EnterPinCodeScreen;
