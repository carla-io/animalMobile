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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import ConfettiCannon from 'react-native-confetti-cannon';

const ViewAssignedTasks = () => {
  const [userName, setUserName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const confettiRef = useRef(null);

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

    const renderTask = ({ item }) => {
      const cardStyle = [
        styles.taskCard,
        item.status === 'Completed'
          ? { backgroundColor: '#A4D9AB' } 
          : { backgroundColor: '#e0e0e0' } 
      ];

      return (
        <View style={cardStyle}>
          <Ionicons name="clipboard-outline" size={24} color="#2f4f4f" />
          <View style={styles.taskInfo}>
            <Text style={styles.taskTitle}>{item.type}</Text>
            <Text style={styles.taskTime}>
              {new Date(item.scheduleDate).toLocaleDateString()} –{' '}
              {item.scheduleTimes?.join(', ') || 'No time set'}
            </Text>
            <Text style={styles.taskTime}>Animal: {item.animalId?.name || 'N/A'}</Text>
            <Text style={styles.taskTime}>Status: {item.status}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setSelectedTaskId(item._id);
              setShowStatusModal(true);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#2f4f4f" />
          </TouchableOpacity>
        </View>
      );
    };
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2f4f4f" />
        <Text>Loading tasks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2f4f4f" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity>
            <Ionicons name="menu" size={28} color="#a4d9ab" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="search" size={28} color="#a4d9ab" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerGreeting}>Hello, Farmer {userName}!</Text>
        <Text style={styles.headerSub}>Are you going to complete all the task today?</Text>
      </View>

      {/* Task List */}
      <Text style={styles.sectionTitle}>My Tasks</Text>
      {tasks.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No tasks assigned.</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item._id}
          renderItem={renderTask}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Status Modal */}
      <Modal transparent visible={showStatusModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Set Task Status</Text>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#28a745' }]}
              onPress={() => updateTaskStatus('Completed')}
            >
              <Text style={styles.statusButtonText}>Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: '#dc3545' }]}
              onPress={() => updateTaskStatus('Pending')}
            >
              <Text style={styles.statusButtonText}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowStatusModal(false)}>
              <Text style={{ color: '#2f4f4f', marginTop: 10 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Feedback */}
      {showSuccess && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>✅ Task status updated!</Text>
        </View>
      )}
      <ConfettiCannon
        count={100}
        origin={{ x: 200, y: 0 }}
        fadeOut
        autoStart={false}
        ref={confettiRef}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight || 20 },
  header: {
    backgroundColor: '#2f4f4f',
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  headerGreeting: { fontSize: 20, color: '#fff', fontWeight: '600' },
  headerSub: { fontSize: 14, color: '#d0f0c0', marginTop: 5 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 10,
    color: '#2f4f4f',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f5e9',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 15,
    marginBottom: 10,
  },
  taskInfo: { flex: 1, marginLeft: 15 },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#2f4f4f' },
  taskTime: { fontSize: 12, color: '#666', marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#2f4f4f' },
  statusButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: 'center',
  },
  statusButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 20,
    alignItems: 'center',
    elevation: 5,
  },
  successText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default ViewAssignedTasks;
