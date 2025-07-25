import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../utils/api';
import CustomDrawer from '../CustomDrawer';

const screenWidth = Dimensions.get('window').width;

const ViewAnimals = () => {
  const [animals, setAnimals] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [eating, setEating] = useState('Normal');
  const [movement, setMovement] = useState('Active');
  const [mood, setMood] = useState('Calm');
  const [notes, setNotes] = useState('');

  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -screenWidth * 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerVisible(false));
  };

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/animal/getAll`);
        if (res.data.success) {
          setAnimals(res.data.animals);
        }
      } catch (err) {
        console.error('Error fetching animals:', err);
      }
    };

    fetchAnimals();
  }, []);

  const openModal = (animal) => {
    setSelectedAnimal(animal);
    setModalVisible(true);
  };

  const submitBehavior = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        alert('User ID not found. Please log in again.');
        return;
      }

      await axios.post(`${API_BASE_URL}/behavior/add`, {
        animalId: selectedAnimal._id,
        eating,
        movement,
        mood,
        notes,
        recordedBy: userId,
      });

      alert('Behavior logged!');
      setModalVisible(false);
      setNotes('');
    } catch (err) {
      console.error('Submit error:', err.response?.data || err.message);
      alert('Error submitting behavior');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.plusIcon} onPress={() => openModal(item)}>
          <Icon name="add-circle-outline" size={18} color="#2a2a2a" />
        </TouchableOpacity>

        <Image
          source={{ uri: item.photo.replace('/upload/', '/upload/e_bgremoval/') }}
          style={styles.animalImage}
          resizeMode="contain"
        />

        <View style={styles.labelBox}>
          <Text style={styles.animalName}>{item.name}</Text>
          <Text style={styles.animalAge}>{item.age} yrs old</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2d4b37" barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={openDrawer}>
            <Icon name="menu" size={26} color="#fff" />
          </TouchableOpacity>
          <Icon name="search" size={24} color="#fff" />
        </View>
        <Text style={styles.greeting}>Hello,</Text>
        <Text style={styles.subTitle}>Input Behavior</Text>
      </View>

      <FlatList
        data={animals}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
      />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Behavior</Text>

            <Text style={styles.label}>Eating</Text>
            <Picker selectedValue={eating} onValueChange={setEating}>
              <Picker.Item label="Normal" value="Normal" />
              <Picker.Item label="Low" value="Low" />
              <Picker.Item label="None" value="None" />
            </Picker>

            <Text style={styles.label}>Movement</Text>
            <Picker selectedValue={movement} onValueChange={setMovement}>
              <Picker.Item label="Active" value="Active" />
              <Picker.Item label="Lazy" value="Lazy" />
              <Picker.Item label="Limping" value="Limping" />
            </Picker>

            <Text style={styles.label}>Mood</Text>
            <Picker selectedValue={mood} onValueChange={setMood}>
              <Picker.Item label="Calm" value="Calm" />
              <Picker.Item label="Aggressive" value="Aggressive" />
              <Picker.Item label="Anxious" value="Anxious" />
            </Picker>

            <TextInput
              placeholder="Notes (optional)"
              style={styles.inputBox}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={submitBehavior}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={drawerVisible} transparent animationType="none">
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', opacity: overlayOpacity }}>
            <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View
            style={{
              width: screenWidth * 0.8,
              backgroundColor: '#fff',
              transform: [{ translateX: slideAnim }],
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 10,
              elevation: 5,
            }}
          >
            <CustomDrawer onClose={closeDrawer} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};


export default ViewAnimals;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#2d4b37',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  greeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  subTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  listContainer: {
    padding: 15,
  },
  cardWrapper: {
    width: (screenWidth - 50) / 2,
    alignItems: 'center',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#b8e8b9',
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  plusIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 10,
  },
  animalImage: {
    width: 80,
    height: 80,
    marginVertical: 5,
  },
  labelBox: {
    backgroundColor: '#e8f7ea',
    width: '100%',
    paddingVertical: 6,
    alignItems: 'center',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  animalName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#2a2a2a',
  },
  animalAge: {
    fontSize: 12,
    color: '#555',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    marginTop: 10,
    fontWeight: '500',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#2d4b37',
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10,
  },
});
