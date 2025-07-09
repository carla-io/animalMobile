import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from '../utils/toast';
import API_BASE_URL from '../utils/api';

const { height } = Dimensions.get('window');

const CustomDrawer = ({ navigation, onClose }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState('user'); // Default to regular user

  // Regular user menu items
  const userMenuItems = [
    { id: '1', title: 'View Assigned Tasks', icon: 'clipboard-outline', route: 'AssignedTasks' },
    { id: '2', title: 'Input Daily Animal Behavior', icon: 'create-outline', route: 'AnimalBehaviorInput' },
    { id: '3', title: 'View Animal', icon: 'paw-outline', route: 'AnimalView' },
  ];

  // Admin menu items (based on your React admin panel)
  const adminMenuItems = [
    { id: '1', title: 'Dashboard', icon: 'bar-chart-outline', route: 'AdminDashboard' },
    { id: '2', title: 'Manage Users', icon: 'people-outline', route: 'UserManagement' },
    { id: '3', title: 'Animal Profiles', icon: 'paw-outline', route: 'AnimalProfiles' },
    { id: '4', title: 'Task Management', icon: 'checkmark-circle-outline', route: 'TaskManagement' },
    { id: '5', title: 'Schedules', icon: 'calendar-outline', route: 'Schedule' },
    { id: '6', title: 'Health Logs', icon: 'document-text-outline', route: 'HealthLogs' },
    // { id: '7', title: 'Reports', icon: 'download-outline', route: 'Reports' },
    // { id: '8', title: 'Audit Logs', icon: 'shield-outline', route: 'AuditLogs' },
  ];

  const bottomItems = [
    { id: '9', title: 'Settings', icon: 'settings-outline', route: 'Settings' },
    { id: '10', title: 'Help & Support', icon: 'help-circle-outline', route: 'Support' },
    { id: '11', title: 'About', icon: 'information-circle-outline', route: 'About' },
  ];

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Profile fetch failed');

      setProfileData(data.user);
      
      // Set user type based on profile data
      // Assuming your API returns userType or role field
      setUserType(data.user.userType || data.user.role || 'user');
      
    } catch (error) {
      console.error('Profile fetch error:', error);
      showToast('error', 'Profile Error', error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Alternative method: Get user type from AsyncStorage if it's stored separately
  const getUserType = async () => {
    try {
      const storedUserType = await AsyncStorage.getItem('userType');
      if (storedUserType) {
        setUserType(storedUserType);
      }
    } catch (error) {
      console.error('Error getting user type:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    // Uncomment this if you store userType separately in AsyncStorage
    // getUserType();
  }, []);

  const handleNavigation = (route) => {
    onClose?.();
    navigation.navigate(route);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: performLogout,
        },
      ],
      { cancelable: true }
    );
  };

  const performLogout = async () => {
    try {
      onClose?.();
      await AsyncStorage.multiRemove(['userToken', 'userData', 'isAuthenticated', 'userType']);
      
      showToast('success', 'Logged Out', 'You have been successfully logged out');
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      showToast('error', 'Logout Failed', 'Something went wrong. Please try again.');
    }
  };

  const renderMenuItem = (item, isBottom = false) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, isBottom && styles.bottomMenuItem]}
      onPress={() => handleNavigation(item.route)}
      activeOpacity={0.7}
    >
      <Ionicons name={item.icon} size={24} color="#a4d9ab" />
      <Text style={styles.menuText}>{item.title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#a4d9ab" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
      </SafeAreaView>
    );
  }

  const user = profileData || {
    name: 'User',
    email: 'user@example.com',
    profilePhoto: null,
    address: null
  };

  // Determine which menu items to show based on user type
  const currentMenuItems = userType === 'admin' ? adminMenuItems : userMenuItems;
  const sectionTitle = userType === 'admin' ? 'Admin Panel' : 'Main Menu';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={userType === 'admin' ? ['#315342', '#1e3a2a'] : ['#315342', '#1e3a2a']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#a4d9ab" />
          </TouchableOpacity>

          <View style={styles.profileSection}>
            <Image
              source={user.profilePhoto 
                ? { uri: user.profilePhoto } 
                : require('../assets/default-profile.png')}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              {userType === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Administrator</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Animals</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {userType === 'admin' ? '25' : '10'}
              </Text>
              <Text style={styles.statLabel}>
                {userType === 'admin' ? 'Users' : 'Vets'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            {currentMenuItems.map(item => renderMenuItem(item))}
          </View>

          {/* Special Offer Banner - Hide for admin */}
          {userType !== 'admin' && (
            <TouchableOpacity
              style={styles.offerBanner}
              onPress={() => handleNavigation('SpecialOffer')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(49, 83, 66, 0.1)', 'rgba(30, 58, 42, 0.1)']}
                style={styles.offerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.offerContent}>
                  <Ionicons name="gift" size={32} color="#315342" />
                  <View style={styles.offerText}>
                    <Text style={styles.offerTitle}>Premium Access</Text>
                    <Text style={styles.offerSubtitle}>Upgrade to unlock all features</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#315342" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Bottom Menu Items */}
          <View style={styles.bottomSection}>
            <View style={styles.divider} />
            {bottomItems.map(item => renderMenuItem(item, true))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color="#ff4757" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#a4d9ab',
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#a4d9ab',
  },
  adminBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a2a',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#a4d9ab',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#a4d9ab',
    opacity: 0.5,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bottomMenuItem: {
    backgroundColor: '#f8f9fa',
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#315342',
    fontWeight: '500',
  },
  offerBanner: {
    marginVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  offerGradient: {
    padding: 20,
  },
  offerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerText: {
    flex: 1,
    marginLeft: 15,
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 2,
  },
  offerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  bottomSection: {
    marginTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ffebee',
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#ff4757',
    fontWeight: '600',
  },
});

export default CustomDrawer;