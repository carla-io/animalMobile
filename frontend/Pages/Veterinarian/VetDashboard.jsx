import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Modal,
  Animated,
  StatusBar,
  Platform,
  Easing,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawer from '../CustomDrawer';
import API_BASE_URL from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showToast } from '../../utils/toast';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

const VetDashboard = ({ navigation }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState('animals');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // State for fetched data
  const [animals, setAnimals] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    animalCount: 0,
    recordCount: 0,
    taskCount: 0
  });

  const fetchAnimals = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/animal/getAll`);
      const animalsData = res.data.animals || [];
      setAnimals(animalsData);
      setStats(prev => ({...prev, animalCount: animalsData.length}));
    } catch (error) {
      console.error('Error fetching animals:', error);
      showToast('error', 'Error', 'Failed to fetch animals');
    }
  };

  const fetchMedicalRecords = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_BASE_URL}/medical-records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const recordsData = res.data || [];
      setMedicalRecords(recordsData);
      setStats(prev => ({...prev, recordCount: recordsData.length}));
    } catch (error) {
      console.error('Error fetching medical records:', error);
      showToast('error', 'Error', 'Failed to fetch medical records');
    }
  };

  const fetchTasks = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const res = await axios.get(`${API_BASE_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tasksData = res.data || [];
      setTasks(tasksData);
      setStats(prev => ({...prev, taskCount: tasksData.length}));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      showToast('error', 'Error', 'Failed to fetch tasks');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAnimals(),
        fetchMedicalRecords(),
        fetchTasks()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', 'Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

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

  const renderAnimalItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.animalItem}
      onPress={() => navigation.navigate('AnimalProfiles', { animalId: item._id })}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.photo || `${API_BASE_URL}/default-profile.png` }} 
        style={styles.animalImage}
        defaultSource={{ uri: `${API_BASE_URL}/default-profile.png` }}
      />
      <View style={styles.animalInfo}>
        <Text style={styles.animalName}>{item.name}</Text>
        <Text style={styles.animalDetails}>{item.species} • {item.breed || 'Unknown'}</Text>
        <Text style={styles.animalDetails}>{item.age || 'Unknown'} years old</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#a4d9ab" />
    </TouchableOpacity>
  );

  const renderRecordItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recordItem}
      onPress={() => navigation.navigate('RecordDetail', { recordId: item._id })}
      activeOpacity={0.8}
    >
      <View style={styles.recordIconContainer}>
        <Ionicons 
          name={getRecordIcon(item.type)} 
          size={24} 
          color="#315342" 
        />
      </View>
      <View style={styles.recordInfo}>
        <Text style={styles.recordTitle}>{item.type} for {item.animal?.name || 'Animal'}</Text>
        <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
        <Text style={styles.recordNotes} numberOfLines={1}>{item.notes}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.taskItem}
      onPress={() => navigation.navigate('TaskDetail', { taskId: item._id })}
      activeOpacity={0.8}
    >
      <View style={[styles.taskPriority, { backgroundColor: getPriorityColor(item.priority) }]} />
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle}>{item.type} for {item.animal?.name || 'Animal'}</Text>
        <Text style={styles.taskDueDate}>Due: {formatDate(item.scheduleDate)}</Text>
        <View style={styles.taskStatusContainer}>
          <Text style={styles.taskStatus}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy': return '#a4d9ab';
      case 'needs_attention': return '#FFD700';
      case 'recovering': return '#FFA07A';
      default: return '#a4d9ab';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getRecordIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'vaccination': return 'medkit-outline';
      case 'checkup': return 'medkit-outline';
      case 'treatment': return 'bandage-outline';
      case 'surgery': return 'medkit-outline';
      default: return 'document-text-outline';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high': return '#FF6347';
      case 'medium': return '#FFD700';
      case 'low': return '#a4d9ab';
      default: return '#a4d9ab';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#315342" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#315342']}
            tintColor="#315342"
          />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#315342', '#1e3a2a']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
                <Ionicons name="menu" size={28} color="#a4d9ab" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.headerButton}>
                <Ionicons name="search" size={28} color="#a4d9ab" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Veterinarian Dashboard</Text>
            <Text style={styles.headerSubtitle}>Manage animal health records</Text>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="paw" size={24} color="#315342" />
            <Text style={styles.statNumber}>{stats.animalCount}</Text>
            <Text style={styles.statLabel}>Animals</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={24} color="#315342" />
            <Text style={styles.statNumber}>{stats.recordCount}</Text>
            <Text style={styles.statLabel}>Records</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#315342" />
            <Text style={styles.statNumber}>{stats.taskCount}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'animals' && styles.activeTab]}
            onPress={() => setActiveTab('animals')}
          >
            <Text style={[styles.tabText, activeTab === 'animals' && styles.activeTabText]}>Animals</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'records' && styles.activeTab]}
            onPress={() => setActiveTab('records')}
          >
            <Text style={[styles.tabText, activeTab === 'records' && styles.activeTabText]}>Records</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'tasks' && styles.activeTab]}
            onPress={() => setActiveTab('tasks')}
          >
            <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Animals Tab */}
          {activeTab === 'animals' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Animal Profiles</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AllAnimals')}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={animals.slice(0, 5)}
                renderItem={renderAnimalItem}
                keyExtractor={item => item._id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No animals found</Text>
                }
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('AddAnimal')}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add New Animal</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Records Tab */}
          {activeTab === 'records' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Medical Records</Text>
                <View style={styles.recordActions}>
                  <TouchableOpacity onPress={() => navigation.navigate('AllRecords')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => navigation.navigate('FilterRecords')}
                  >
                    <Ionicons name="filter" size={18} color="#315342" />
                  </TouchableOpacity>
                </View>
              </View>
              <FlatList
                data={medicalRecords.slice(0, 5)}
                renderItem={renderRecordItem}
                keyExtractor={item => item._id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No medical records found</Text>
                }
              />
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => navigation.navigate('AddRecord')}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Add New Record</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Assigned Tasks</Text>
                <View style={styles.recordActions}>
                  <TouchableOpacity onPress={() => navigation.navigate('AllTasks')}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => navigation.navigate('FilterTasks')}
                  >
                    <Ionicons name="filter" size={18} color="#315342" />
                  </TouchableOpacity>
                </View>
              </View>
              <FlatList
                data={tasks.slice(0, 5)}
                renderItem={renderTaskItem}
                keyExtractor={item => item._id}
                scrollEnabled={false}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No tasks assigned</Text>
                }
              />
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('GenerateReport')}
            >
              <Ionicons name="document-text-outline" size={28} color="#315342" />
              <Text style={styles.quickActionText}>Generate Report</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('VaccinationSchedule')}
            >
              <Ionicons name="calendar-outline" size={28} color="#315342" />
              <Text style={styles.quickActionText}>Vaccination Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    color: '#315342',
    fontSize: 16,
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
  quickStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
  },
  statCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#315342',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#315342',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#315342',
  },
  seeAll: {
    color: '#315342',
    fontWeight: '600',
    marginRight: 10,
  },
  filterButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
  },
  animalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  animalImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 3,
  },
  animalDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
    marginRight: 15,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#315342',
    marginBottom: 3,
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  recordNotes: {
    fontSize: 14,
    color: '#888',
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskPriority: {
    width: 8,
  },
  taskInfo: {
    flex: 1,
    padding: 15,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#315342',
    marginBottom: 5,
  },
  taskDueDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  taskStatusContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  taskStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#315342',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#315342',
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#315342',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
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

export default VetDashboard;