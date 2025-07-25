import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ViewDetailedTask = () => {
  const route = useRoute();
  const { task } = route.params;

  const assignedTo = task.assignedTo || {};
  const animal = task.animalId || {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>📋 Task Details</Text>

      {/* Task Info */}
      <View style={styles.card}>
        <Text style={styles.label}>Task Type:</Text>
        <Text style={styles.value}>{task.type}</Text>

        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { color: task.status === 'Completed' ? 'green' : 'orange' }]}>
          {task.status}
        </Text>

        <Text style={styles.label}>Scheduled Date:</Text>
        <Text style={styles.value}>{new Date(task.scheduleDate).toLocaleDateString()}</Text>

        <Text style={styles.label}>Scheduled Times:</Text>
        <Text style={styles.value}>{task.scheduleTimes?.join(', ') || 'None'}</Text>

        <Text style={styles.label}>Recurring:</Text>
        <Text style={styles.value}>{task.isRecurring ? `Yes (${task.recurrencePattern})` : 'No'}</Text>

        {task.isRecurring && (
          <>
            <Text style={styles.label}>End Date:</Text>
            <Text style={styles.value}>{new Date(task.endDate).toLocaleDateString()}</Text>
          </>
        )}

        {task.completedAt && (
          <>
            <Text style={styles.label}>Completed At:</Text>
            <Text style={styles.value}>{new Date(task.completedAt).toLocaleString()}</Text>
          </>
        )}
      </View>

      {/* Animal Info */}
      <Text style={styles.heading}>🐄 Animal Info</Text>
      <View style={styles.card}>
        <Image
          source={{ uri: animal.photo }}
          style={styles.image}
        />
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{animal.name}</Text>

        <Text style={styles.label}>Species:</Text>
        <Text style={styles.value}>{animal.species}</Text>

        <Text style={styles.label}>Breed:</Text>
        <Text style={styles.value}>{animal.breed || 'N/A'}</Text>

        <Text style={styles.label}>Age:</Text>
        <Text style={styles.value}>{animal.age ? `${animal.age} years` : 'N/A'}</Text>

        <Text style={styles.label}>Health Status:</Text>
        <Text style={[styles.value, {
          color: animal.status === 'needs_attention' ? 'red' : 'green'
        }]}>
          {animal.status}
        </Text>
      </View>

      {/* Worker Info */}
      <Text style={styles.heading}>👤 Assigned Worker</Text>
      <View style={styles.card}>
        <Image
          source={{ uri: assignedTo.profilePhoto }}
          style={styles.image}
        />
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{assignedTo.name || 'N/A'}</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{assignedTo.email || 'N/A'}</Text>

        <Text style={styles.label}>User Type:</Text>
        <Text style={styles.value}>{assignedTo.userType || 'N/A'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
    backgroundColor: '#f5f5f5',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#2f4f4f',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#ddd',
  },
});

export default ViewDetailedTask;
