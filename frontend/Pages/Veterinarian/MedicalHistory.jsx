import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MedicalHistory = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={48} color="#315342" />
      <Text style={styles.title}>Medical History</Text>
      <Text style={styles.subtitle}>View comprehensive medical history of animals</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#315342',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default MedicalHistory;