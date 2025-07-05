import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';

const ViewAnimalProfile = () => {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const userName = 'Farmer';

  const fetchAnimals = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/animal/getAll`);
      setAnimals(res.data.animals || []);
    } catch (error) {
      console.error('Error fetching animals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2f4f4f" />
        <Text>Loading animals...</Text>
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
        <Text style={styles.headerGreeting}>Hello, {userName}!</Text>
        <Text style={styles.headerSub}>View all animal!</Text>
      </View>

      {/* Animal Cards */}
      <ScrollView contentContainerStyle={styles.content}>
        {animals.map((item) => (
          <View key={item._id} style={styles.card}>
            <Image source={{ uri: item.photo }} style={styles.image} resizeMode="cover" />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>Species: {item.species}</Text>
              <Text style={styles.detail}>Breed: {item.breed || 'N/A'}</Text>
              <Text style={styles.detail}>Age: {item.age || 'Unknown'}</Text>
              <Text style={styles.status}>
                Status: <Text style={{ color: '#4CAF50' }}>🟢 {item.status}</Text>
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ViewAnimalProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eaffea',
  },
  header: {
    backgroundColor: '#2f4f4f',
    paddingTop: 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerGreeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSub: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
  },
  content: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginRight: 12,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f4f4f',
    marginBottom: 2,
  },
  detail: {
    fontSize: 13,
    color: '#555',
  },
  status: {
    marginTop: 4,
    fontSize: 13,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
