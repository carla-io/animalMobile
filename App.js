import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { toastConfig } from './utils/toast';
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import Home from './Pages/Home';
import CustomDrawer from './Pages/CustomDrawer';

const Stack = createStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200ee',
    secondary: '#03dac6',
    background: '#f6f6f6',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen 
            name="Login" 
            component={Login} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Register" 
            component={Register} 
            options={{ headerShown: false }} 
          />
            <Stack.Screen 
            name="Home" 
            component={Home} 
            options={{ headerShown: false }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast 
        config={toastConfig}
        position="top"
        topOffset={50}
        visibilityTime={3000}
        autoHide={true}
      />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});