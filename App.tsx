import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { AppNavigator } from '@/navigation/AppNavigator';
import { theme } from '@/constants/theme';
import { StoreProvider } from '@/store/StoreProvider';

const App: React.FC = () => {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <StoreProvider>
                <PaperProvider theme={theme}>
                    <NavigationContainer>
                        <StatusBar
                            barStyle="light-content"
                            backgroundColor={theme.colors.primary}
                        />
                        <AppNavigator />
                        <Toast />
                    </NavigationContainer>
                </PaperProvider>
            </StoreProvider>
        </GestureHandlerRootView>
    );
};

export default App;

