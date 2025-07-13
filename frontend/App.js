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
import ViewAssignedTasks from './Pages/Task/ViewAssignedTasks';
import ViewAnimalProfile from './Pages/AnimalProf/viewAnimalProfile';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import UserManagement from './Pages/Admin/UserManagement';
import AnimalProfiles from './Pages/Admin/AnimalProfiles';
import TaskManagement from './Pages/Admin/TaskManagement';
import Schedule from './Pages/Admin/Schedule';

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
          <Stack.Screen
            name="AssignedTasks"
            component={ViewAssignedTasks}
            options={{ headerShown: false }} 
          />
          <Stack.Screen
            name="AnimalView" // 🔗 route must match the drawer item
            component={ViewAnimalProfile}
            options={{ headerShown: false }}
          />
           <Stack.Screen
            name="AdminDashboard" // 🔗 route must match the drawer item
            component={AdminDashboard}
            options={{ headerShown: false }}
          />
           <Stack.Screen
            name="CustomDrawer" // 🔗 route must match the drawer item
            component={CustomDrawer}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserManagement" // 🔗 route must match the drawer item
            component={UserManagement}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AnimalProfiles" // 🔗 route must match the drawer item
            component={AnimalProfiles}
            options={{ headerShown: false }}
          />
           <Stack.Screen
            name="TaskManagement" // 🔗 route must match the drawer item
            component={TaskManagement}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Schedule" // 🔗 route must match the drawer item
            component={Schedule}
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