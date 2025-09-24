import './shim.js';
import * as React from 'react';
import {useEffect, useMemo} from 'react';
import {enableScreens} from 'react-native-screens';
import 'text-encoding';
import {Provider} from 'react-redux';
import ReduxStore from '@modules/redux/ReduxStore';
import 'react-native-gesture-handler';
import ApplicationNavigator from '@modules/navigation/ApplicationNavigator';
import '@modules/i18n/i18n';
import {SheetProvider} from 'react-native-actions-sheet';
import CommonLoading from '@components/commons/CommonLoading';
import CustomisableAlert from 'react-native-customisable-alert';
import {LogBox} from 'react-native';
import {VCoinPlatform} from '@modules/core/app/VCoinPlatform';
import {StorageService} from '@modules/core/storage/StorageService';
import i18n from 'i18next';
import {ThemeAction} from "@persistence/theme/ThemeAction";

LogBox.ignoreAllLogs(true);
enableScreens();

//FastImage.clearDiskCache();
//FastImage.clearMemoryCache();
export default function App() {
    useEffect(() => {
        (async () => {
            //await StorageService.clear();
            VCoinPlatform.init();
        })();
    }, []);
    const loadLanguage = async () => {
        try {
            const lng = await StorageService.getItem('@lng');
            if (lng) {
                i18n.changeLanguage(lng);
            }
        } catch (error) {
            console.error('Error loading language:', error);
        }
    };
    const loadlang = useMemo(() => loadLanguage(), []);
    return (
        <Provider store={ReduxStore}>
            <SheetProvider>
                <ApplicationNavigator />
                <CommonLoading ref={ref => CommonLoading.setRef(ref)} />
                <CustomisableAlert />
            </SheetProvider>
        </Provider>
    );
}
