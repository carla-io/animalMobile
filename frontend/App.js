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
import VetDashboard from './Pages/Veterinarian/VetDashboard'; // New import
import Schedule from './Pages/Admin/Schedule';
/* import MedicalRecords from './Pages/Veterinarian/MedicalRecords'; // New import
import AddRecord from './Pages/Veterinarian/AddRecord'; // New import
import RecordDetail from './Pages/Veterinarian/RecordDetail'; // New import
import GenerateReport from './Pages/Veterinarian/GenerateReport'; // New import
import VaccinationSchedule from './Pages/Veterinarian/VaccinationSchedule'; // New import */

const Stack = createStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#315342', // Updated to match your green theme
    secondary: '#a4d9ab', // Updated to match your light green
    background: '#f6f6f6',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator initialRouteName="Login">
          {/* Auth Screens */}
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
          
          {/* User Screens */}
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
            name="AnimalView"
            component={ViewAnimalProfile}
            options={{ headerShown: false }}
          />
          
          {/* Admin Screens */}
          <Stack.Screen
            name="AdminDashboard"
            component={AdminDashboard}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UserManagement"
            component={UserManagement}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AnimalProfiles"
            component={AnimalProfiles}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TaskManagement"
            component={TaskManagement}
            options={{ headerShown: false }}
          />
            <Stack.Screen
            name="Schedule" // 🔗 route must match the drawer item
            component={Schedule}
            options={{ headerShown: false }}
          />
          
          {/* Veterinarian Screens */}
          <Stack.Screen
            name="VetDashboard"
            component={VetDashboard}
            options={{ headerShown: false }}
          />
      <Stack.Screen
  name="AnimalProfile"
  component={ViewAnimalProfile}
  options={{ headerShown: false }}
/>
       {/*    <Stack.Screen
            name="MedicalRecords"
            component={MedicalRecords}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AddRecord"
            component={AddRecord}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="RecordDetail"
            component={RecordDetail}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="GenerateReport"
            component={GenerateReport}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VaccinationSchedule"
            component={VaccinationSchedule}
            options={{ headerShown: false }}
          /> */}
          
          {/* Common Components */}
          <Stack.Screen
            name="CustomDrawer"
            component={CustomDrawer}
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