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
  Dimensions,
  Animated,
  Easing,
  Modal,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawer from '../CustomDrawer';
import API_BASE_URL from '../../utils/api';

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
  const [data, setData] = useState({
    users: 0,
    animals: 0,
    tasks: [],
    pendingTasks: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch data from API
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [usersRes, animalsRes, tasksRes, pendingRes, completedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/countUsersOnly`),
        fetch(`${API_BASE_URL}/animal/count`),
        fetch(`${API_BASE_URL}/tasks/getAll`),
        fetch(`${API_BASE_URL}/tasks/count/pending`),
        fetch(`${API_BASE_URL}/tasks/count/completed`)
      ]);

      if (!usersRes.ok || !animalsRes.ok || !tasksRes.ok || !pendingRes.ok || !completedRes.ok) {
        throw new Error('Failed to fetch data from one or more APIs');
      }

      const usersData = await usersRes.json();
      const animalsData = await animalsRes.json();
      const tasksData = await tasksRes.json();
      const pendingData = await pendingRes.json();
      const completedData = await completedRes.json();

      setData({
        users: usersData.count,
        animals: animalsData.count,
        tasks: tasksData,
        pendingTasks: pendingData.count,
        completedTasks: completedData.count
      });
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

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

  const handleRefresh = () => {
    fetchData(true);
  };

  const handleExportReport = () => {
    Alert.alert(
      'Export Report',
      'Export functionality will be implemented soon.',
      [{ text: 'OK' }]
    );
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

  // Render functions
  const renderStatsCard = (title, value, icon, color, trend, loading) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <View style={styles.statsInfo}>
          <Text style={styles.statsTitle}>{title}</Text>
          {loading ? (
            <ActivityIndicator size="small" color={color} />
          ) : (
            <View>
              <Text style={[styles.statsValue, { color }]}>{value}</Text>
              {trend && <Text style={styles.statsTrend}>↗ {trend}</Text>}
            </View>
          )}
        </View>
        <View style={[styles.statsIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
      </View>
    </View>
  );

  const renderDashboard = () => (
    <View style={styles.dashboardContainer}>
      {/* Header Actions */}
      <View style={styles.pageHeader}>
        <Text style={styles.sectionTitle}>Dashboard Overview</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={handleRefresh}
            disabled={loading || refreshing}
          >
            <Text style={styles.btnSecondaryText}>
              {loading || refreshing ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={handleExportReport}
          >
            <Ionicons name="download-outline" size={16} color="white" />
            <Text style={styles.btnPrimaryText}>Export</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {renderStatsCard('Total Users', data.users, 'people-outline', '#3182ce', '+12%', loading)}
        {renderStatsCard('Total Animals', data.animals, 'paw-outline', '#38a169', '+8%', loading)}
        {renderStatsCard('Pending Tasks', data.pendingTasks, 'time-outline', '#e53e3e', null, loading)}
        {renderStatsCard('Completed Tasks', data.completedTasks, 'checkmark-circle-outline', '#805ad5', '+24%', loading)}
      </View>

      {/* Recent Tasks */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Recent Tasks</Text>
        </View>
        <View style={styles.cardContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3182ce" />
              <Text style={styles.loadingText}>Loading tasks...</Text>
            </View>
          ) : data.tasks.length === 0 ? (
            <Text style={styles.noData}>No tasks available</Text>
          ) : (
            <View style={styles.taskList}>
              {data.tasks.slice(0, 5).map((task, index) => (
                <View key={task.id || index} style={styles.taskItem}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>
                      {task.type ? task.type.replace('_', ' ') : 'Task'}
                    </Text>
                    <Text style={styles.taskDescription}>
                      {(task.animalId && task.animalId.name) || 'Unknown Animal'} -{' '}
                      {(task.assignedTo && task.assignedTo.name) || 'Unassigned'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      task.status === 'completed' ? styles.badgeGreen : styles.badgeOrange
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        task.status === 'completed' ? styles.badgeTextGreen : styles.badgeTextOrange
                      ]}
                    >
                      {task.status || 'pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* System Activity */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>System Activity</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIndicator, styles.activityIndicatorGreen]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Data refreshed successfully</Text>
                <Text style={styles.activityTime}>
                  {loading || refreshing ? 'Refreshing...' : 'Just now'}
                </Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIndicator, styles.activityIndicatorBlue]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Dashboard loaded</Text>
                <Text style={styles.activityTime}>Connected to API</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIndicator, styles.activityIndicatorOrange]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Auto-refresh enabled</Text>
                <Text style={styles.activityTime}>Every 30 seconds</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#315342" />
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={48} color="#e53e3e" />
            <Text style={styles.errorTitle}>Unable to load dashboard</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
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

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#315342']}
          />
        }
      >
        {renderDashboard()}
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 10,
    marginBottom: 5,
  },
  errorMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#315342',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    paddingBottom: 30,
       paddingTop: getStatusBarHeight(),
       borderBottomLeftRadius: 30,
       borderBottomRightRadius: 30,
       backgroundColor: '#315342',
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a4d9ab',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  btnPrimary: {
    backgroundColor: '#315342',
  },
  btnSecondary: {
    backgroundColor: '#e2e8f0',
  },
  btnPrimaryText: {
    color: 'white',
    fontWeight: '600',
  },
  btnSecondaryText: {
    color: '#475569',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: '45%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#64748b',
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsTrend: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  statsIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardContent: {
    padding: 20,
  },
  taskList: {
    gap: 15,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  taskDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
  },
  badgeOrange: {
    backgroundColor: '#fed7aa',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  badgeTextGreen: {
    color: '#166534',
  },
  badgeTextOrange: {
    color: '#ea580c',
  },
  noData: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    paddingVertical: 20,
  },
  activityList: {
    gap: 15,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityIndicatorGreen: {
    backgroundColor: '#10b981',
  },
  activityIndicatorBlue: {
    backgroundColor: '#3b82f6',
  },
  activityIndicatorOrange: {
    backgroundColor: '#f97316',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#64748b',
  },
  modalContainer: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
  },
});

export default AdminDashboard;