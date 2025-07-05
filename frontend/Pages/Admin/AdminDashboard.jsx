import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Animated,
  Easing,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawer from '../CustomDrawer'; // Import your CustomDrawer component

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

const AdminDashboard = () => {
  const navigation = useNavigation();
  
  // Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Data state
  const [users, setUsers] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Navigation state
  const [activeTab, setActiveTab] = useState('dashboard');

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'bar-chart-outline' },
    { id: 'users', label: 'Manage Users', icon: 'people-outline' },
    { id: 'animals', label: 'Animal Profiles', icon: 'paw-outline' },
    { id: 'tasks', label: 'Task Management', icon: 'checkmark-circle-outline' },
    { id: 'schedules', label: 'Schedules', icon: 'calendar-outline' },
    { id: 'logs', label: 'Health Logs', icon: 'document-text-outline' },
    { id: 'reports', label: 'Reports', icon: 'download-outline' },
    { id: 'audit', label: 'Audit Logs', icon: 'shield-outline' },
  ];

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      // Initialize with sample data
      setUsers([
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Caretaker', status: 'active' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'Veterinarian', status: 'active' },
        { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'Admin', status: 'inactive' },
      ]);

      setAnimals([
        { id: 1, name: 'Leo', species: 'Lion', age: 5, health: 'Good', caretaker: 'John Doe' },
        { id: 2, name: 'Bella', species: 'Elephant', age: 12, health: 'Fair', caretaker: 'Jane Smith' },
        { id: 3, name: 'Charlie', species: 'Chimpanzee', age: 8, health: 'Excellent', caretaker: 'John Doe' },
      ]);

      setTasks([
        { id: 1, title: 'Feed Leo', description: 'Morning feeding routine', assignee: 'John Doe', status: 'pending', priority: 'high', dueDate: '2025-01-15' },
        { id: 2, title: 'Health Check - Bella', description: 'Weekly health examination', assignee: 'Jane Smith', status: 'completed', priority: 'medium', dueDate: '2025-01-14' },
        { id: 3, title: 'Enclosure Cleaning', description: 'Clean Charlie\'s enclosure', assignee: 'John Doe', status: 'pending', priority: 'low', dueDate: '2025-01-16' },
      ]);

    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Drawer animations
  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 300,
        easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      })
    ]).start(() => setDrawerVisible(false));
  };

  // Stats calculations
  const getStats = () => {
    const totalUsers = users.length;
    const totalAnimals = animals.length;
    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const activeUsers = users.filter(user => user.status === 'active').length;

    return {
      totalUsers,
      totalAnimals,
      totalTasks,
      pendingTasks,
      completedTasks,
      activeUsers,
    };
  };

  const stats = getStats();

  // Render functions
  const renderStatsCard = (title, value, icon, color) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <View style={styles.statsInfo}>
          <Text style={styles.statsTitle}>{title}</Text>
          <Text style={[styles.statsValue, { color }]}>{value}</Text>
        </View>
        <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
    </View>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      <Text style={styles.sectionTitle}>Dashboard Overview</Text>
      
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatsCard('Total Users', stats.totalUsers, 'people-outline', '#3182ce')}
        {renderStatsCard('Total Animals', stats.totalAnimals, 'paw-outline', '#38a169')}
        {renderStatsCard('Total Tasks', stats.totalTasks, 'checkmark-circle-outline', '#805ad5')}
        {renderStatsCard('Pending Tasks', stats.pendingTasks, 'time-outline', '#e53e3e')}
      </View>

      {/* Recent Activity */}
      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <Ionicons name="checkmark-circle" size={20} color="#38a169" />
            <Text style={styles.activityText}>Task "Health Check - Bella" completed</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="person-add" size={20} color="#3182ce" />
            <Text style={styles.activityText}>New user "Mike Johnson" added</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="paw" size={20} color="#38a169" />
            <Text style={styles.activityText}>Animal "Charlie" profile updated</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderUserManagement = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>User Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowUserModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add User</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{item.name}</Text>
              <Text style={styles.listItemSubtitle}>{item.email}</Text>
              <Text style={styles.listItemMeta}>Role: {item.role}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#48bb78' : '#ed8936' }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderAnimalProfiles = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Animal Profiles</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAnimalModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Animal</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={animals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{item.name}</Text>
              <Text style={styles.listItemSubtitle}>{item.species} • Age: {item.age}</Text>
              <Text style={styles.listItemMeta}>Caretaker: {item.caretaker}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.health === 'Excellent' ? '#48bb78' : item.health === 'Good' ? '#38a169' : '#ed8936' }]}>
              <Text style={styles.statusText}>{item.health}</Text>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderTaskManagement = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Task Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowTaskModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Task</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>{item.title}</Text>
              <Text style={styles.listItemSubtitle}>{item.description}</Text>
              <Text style={styles.listItemMeta}>Assigned to: {item.assignee} • Priority: {item.priority}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#48bb78' : '#ed8936' }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderComingSoon = (feature) => (
    <View style={styles.comingSoon}>
      <Ionicons name="construct-outline" size={64} color="#a0aec0" />
      <Text style={styles.comingSoonText}>{feature} coming soon...</Text>
      <Text style={styles.comingSoonSubtext}>This feature is currently under development</Text>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return renderUserManagement();
      case 'animals':
        return renderAnimalProfiles();
      case 'tasks':
        return renderTaskManagement();
      case 'schedules':
        return renderComingSoon('Schedules');
      case 'logs':
        return renderComingSoon('Health Logs');
      case 'reports':
        return renderComingSoon('Reports');
      case 'audit':
        return renderComingSoon('Audit Logs');
      default:
        return renderDashboard();
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              navigation.replace('Login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
        <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#315342" />
      
      {/* Header */}
      <LinearGradient
        colors={['#315342', '#1e3a2a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
              <Ionicons name="menu" size={28} color="#a4d9ab" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.headerButton}>
                <Ionicons name="notifications-outline" size={28} color="#a4d9ab" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
                <Ionicons name="log-out-outline" size={28} color="#a4d9ab" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.headerTitle}>Captivity & Care</Text>
          <Text style={styles.headerSubtitle}>Admin Panel</Text>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
        >
          {sidebarItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.tabItem,
                activeTab === item.id && styles.activeTabItem
              ]}
              onPress={() => setActiveTab(item.id)}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={activeTab === item.id ? '#315342' : '#a0aec0'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === item.id && styles.activeTabLabel
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderContent()}
      </ScrollView>

      {/* Custom Drawer */}
      <Modal visible={drawerVisible} transparent animationType="none" onRequestClose={closeDrawer}>
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[styles.drawerContainer, { transform: [{ translateX: slideAnim }] }]}>
            <CustomDrawer navigation={navigation} onClose={closeDrawer} />
          </Animated.View>
        </View>
      </Modal>
    </View>
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#315342',
  },
  header: {
    paddingBottom: 30,
    paddingTop: getStatusBarHeight(),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabScrollView: {
    paddingHorizontal: 20,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f7fafc',
  },
  activeTabItem: {
    backgroundColor: '#e6fffa',
  },
  tabLabel: {
    marginLeft: 6,
    fontSize: 14,
    color: '#a0aec0',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#315342',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dashboardContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statsCard: {
    width: (width - 60) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentActivity: {
    marginTop: 20,
  },
  activityList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#4a5568',
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#315342',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  listItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#315342',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 2,
  },
  listItemMeta: {
    fontSize: 12,
    color: '#a0aec0',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#718096',
    textAlign: 'center',
    marginTop: 16,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerContainer: {
    width: width * 0.8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default AdminDashboard;