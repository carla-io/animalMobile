import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Modal,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ViewAssignedTasks = () => {
  const [userName, setUserName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const confettiRef = useRef(null);
  const navigation = useNavigation();

  const timeZone = 'Asia/Manila';

  const getPhilippineToday = () => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });

    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    return new Date(`${year}-${month}-${day}T00:00:00`);
  };

  const today = getPhilippineToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekIndex, setWeekIndex] = useState(0);

  const generateWeek = (startDate) => {
    const week = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() + weekIndex * 7);
  const weekDates = generateWeek(currentWeekStart);

  const updateTaskStatus = async (newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/status/${selectedTaskId}`, {
        status: newStatus,
      });

      setTasks((prev) =>
        prev.map((task) =>
          task._id === selectedTaskId ? { ...task, status: newStatus } : task
        )
      );

      setShowSuccess(true);
      confettiRef.current && confettiRef.current.start();

      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setShowStatusModal(false);
      setSelectedTaskId(null);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name || 'Farmer');
      }
    };

    const fetchTasks = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const res = await axios.get(`${API_BASE_URL}/tasks/user/${userId}`);
        setTasks(res.data);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const selectedDateISO = selectedDate.toISOString().slice(0, 10);
    const taskDateISO = new Date(task.scheduleDate).toISOString().slice(0, 10);
    const isSameDay = taskDateISO === selectedDateISO;
    const isRecurring = task.isRecurring;
    const isRecurringAndValid = isRecurring && new Date(selectedDate) >= new Date(task.scheduleDate);
    return isSameDay || isRecurringAndValid;
  });

  const formattedMonth = selectedDate.toLocaleString('default', { month: 'long' });
  const formattedYear = selectedDate.getFullYear();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={{
        margin: 12,
        paddingVertical: 18,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity style={{ backgroundColor: '#d8f5dc', padding: 8, borderRadius: 12 }}>
            <Ionicons name="menu" size={20} color="#3e6652" />
          </TouchableOpacity>

          <Text style={{ fontSize: 18, fontWeight: '600', color: '#3e6652' }}>
            {formattedMonth}, {formattedYear}
          </Text>

          <TouchableOpacity>
            <Ionicons name="search" size={20} color="#3e6652" style={{ backgroundColor: '#d8f5dc', padding: 8, borderRadius: 12 }} />
          </TouchableOpacity>
        </View>

        {/* Days */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
            <View key={idx} style={{ width: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#3e6652' }}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 }}>
          {weekDates.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity key={index} onPress={() => setSelectedDate(date)}>
                <View style={{ backgroundColor: isSelected ? '#112e20ff' : '#eee', borderRadius: 18, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: isSelected ? '#fff' : '#333', fontWeight: isSelected ? 'bold' : 'normal' }}>{date.getDate()}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <TouchableOpacity onPress={() => setWeekIndex(prev => prev - 1)}>
            <Ionicons name="chevron-back" size={24} color="#3e6652" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setWeekIndex(prev => prev + 1)}>
            <Ionicons name="chevron-forward" size={24} color="#3e6652" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#3e6652', marginLeft: 12, marginTop: 12 }}>My Tasks</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3e6652" style={{ marginTop: 20 }} />
      ) : filteredTasks.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No tasks assigned for selected date.</Text>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('ViewDetailedTask', { task: item })}>
              <View style={{
                backgroundColor: item.status === 'Completed' ? '#A4D9AB' : '#e0e0e0',
                margin: 10,
                padding: 10,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center'
              }}>
                <Image source={{ uri: item.animalId?.photo || 'https://via.placeholder.com/50' }}
                  style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 'bold' }}>{item.type}</Text>
                  <Text>{new Date(item.scheduleDate).toLocaleDateString()} – {item.scheduleTimes?.join(', ') || 'No time set'}</Text>
                  <Text>Animal: {item.animalId?.name || 'N/A'}</Text>
                  <Text>Status: {item.status}</Text>
                </View>
                <TouchableOpacity onPress={() => {
                  setSelectedTaskId(item._id);
                  setShowStatusModal(true);
                }}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#2f4f4f" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <Modal transparent animationType="fade" visible={showStatusModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Set Task Status</Text>
              <TouchableOpacity
              style={[
                styles.statusButton,
                tasks.find((t) => t._id === selectedTaskId)?.status === 'Completed' && { backgroundColor: '#ccc' },
              ]}
              onPress={() => {
                const task = tasks.find((t) => t._id === selectedTaskId);
                if (task?.status !== 'Completed') {
                  updateTaskStatus('Completed');
                }
              }}
              disabled={tasks.find((t) => t._id === selectedTaskId)?.status === 'Completed'}
            >
              <Text style={[
                styles.statusButtonText,
                tasks.find((t) => t._id === selectedTaskId)?.status === 'Completed' && { color: '#888' }
              ]}>
                Mark as Completed
              </Text>
            </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Text style={{ color: '#2f4f4f', marginTop: 10 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Confetti and Success */}
      {showSuccess && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ Task status updated!</Text>
        </View>
      )}
      <ConfettiCannon count={100} origin={{ x: 200, y: 0 }} fadeOut autoStart={false} ref={confettiRef} />
    </View>
  );
};





const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9f7',
  },
   headerWrapper: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerIcon: {
    backgroundColor: '#d8f5dc',
    padding: 8,
    borderRadius: 12,
  },
  headerTextWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3e6652',
    marginBottom: 6,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 5,
  },
  dayItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  dayLabel: {
    color: '#3e6652',
    fontSize: 13,
    marginBottom: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  activeDayCircle: {
    backgroundColor: '#3e6652',
  },
  dayNumber: {
    color: '#3e6652',
    fontSize: 14,
  },
  activeDayNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 20,
    color: '#2f4f4f',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f4f4f',
  },
  taskTime: {
    fontSize: 13,
    color: '#555',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f4f4f',
    marginBottom: 15,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  statusButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  successContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  successText: {
    backgroundColor: '#a4d9ab',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    color: '#2f4f4f',
    fontWeight: 'bold',
  },
  calendarButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#2f4f4f',
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000088',
  },
  drawerContainer: {
    width: width * 0.8,
    height: '100%',
    backgroundColor: '#fff',
    paddingTop: 40,
    elevation: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalImage: {
  width: 50,
  height: 50,
  borderRadius: 25,
  marginRight: 10,
  backgroundColor: '#ccc',
},

});


export default ViewAssignedTasks;