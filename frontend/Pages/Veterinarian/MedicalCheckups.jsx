import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  DrawerLayoutAndroid
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../../utils/api';
import { showToast } from '../../utils/toast';
import CustomDrawer from '../CustomDrawer';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatStatus = (status) => {
  if (!status) return '';
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const ViewCheckup = ({ record, animals, statusOptions, onClose, onEdit }) => {
  const getAnimalName = () => {
    if (!record.animal) return 'Unknown Animal';
    if (typeof record.animal === 'object' && record.animal.name) {
      return record.animal.name;
    }
    const animal = animals.find(a => a._id === record.animal);
    return animal ? animal.name : 'Unknown Animal';
  };

  return (
    <ScrollView contentContainerStyle={styles.recordModalContainer}>
      <View style={styles.recordModalHeader}>
        <Text style={styles.recordModalTitle}>Checkup Details</Text>
        <View style={styles.viewModeActions}>
          <TouchableOpacity onPress={onEdit} style={styles.editButton}>
            <Ionicons name="create-outline" size={24} color="#315342" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#315342" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Animal</Text>
        <View style={styles.viewField}>
          <Text>{getAnimalName()}</Text>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Checkup Date</Text>
        <View style={styles.viewField}>
          <Text>{formatDate(record.date)}</Text>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Description</Text>
        <View style={[styles.viewField, styles.viewFieldMultiline]}>
          <Text>{record.description}</Text>
        </View>
      </View>

      {record.diagnosis && (
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Diagnosis</Text>
          <View style={[styles.viewField, styles.viewFieldMultiline]}>
            <Text>{record.diagnosis}</Text>
          </View>
        </View>
      )}

      {record.treatment && (
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Treatment</Text>
          <View style={[styles.viewField, styles.viewFieldMultiline]}>
            <Text>{record.treatment}</Text>
          </View>
        </View>
      )}

      {record.weight && (
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Weight</Text>
          <View style={styles.viewField}>
            <Text>{record.weight} kg</Text>
          </View>
        </View>
      )}

      {record.temperature && (
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Temperature</Text>
          <View style={styles.viewField}>
            <Text>{record.temperature} °C</Text>
          </View>
        </View>
      )}

      {record.followUpDate && (
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Follow-up Date</Text>
          <View style={styles.viewField}>
            <Text>{formatDate(record.followUpDate)}</Text>
          </View>
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Status</Text>
        <View style={styles.viewField}>
          <Text>{formatStatus(record.status)}</Text>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Critical Case</Text>
        <View style={styles.viewField}>
          <Text>{record.isCritical ? 'Yes' : 'No'}</Text>
        </View>
      </View>

      {record.notes && (
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Additional Notes</Text>
          <View style={[styles.viewField, styles.viewFieldMultiline]}>
            <Text>{record.notes}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const MedicalCheckups = ({ navigation }) => {
  const drawerRef = React.useRef(null);

  // Main state
  const [checkups, setCheckups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [animals, setAnimals] = useState([]);
  const [vetId, setVetId] = useState(null);

  // Modal states
  const [showAnimalPicker, setShowAnimalPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Data states
  const [currentRecord, setCurrentRecord] = useState(null);
  const [datePickerMode, setDatePickerMode] = useState('from');
  const [selectedAnimalId, setSelectedAnimalId] = useState('');

  // Filter states
  const [filter, setFilter] = useState({
    animal: '',
    status: '',
    dateFrom: null,
    dateTo: null
  });

  // Form states
  const [formData, setFormData] = useState({
    animal: '',
    recordType: 'checkup',
    date: new Date(),
    description: '',
    diagnosis: '',
    treatment: '',
    weight: '',
    temperature: '',
    notes: '',
    followUpDate: null,
    isCritical: false,
    status: 'active'
  });

  // Status options
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'follow_up', label: 'Follow Up' }
  ];

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return '#FFA500';
      case 'resolved': return '#4CAF50';
      case 'follow_up': return '#2196F3';
      default: return '#666';
    }
  };

  // Open drawer function
  const openDrawer = () => {
    drawerRef.current?.openDrawer();
  };

  // Fetch vet ID
  const fetchVetId = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await axios.get(`${API_BASE_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const fetchedVetId = response.data.user?.id || response.data.user?._id;
    
    if (fetchedVetId && fetchedVetId !== 'null' && fetchedVetId !== null) {
      console.log('Setting vetId:', fetchedVetId);
      setVetId(fetchedVetId);
    } else {
      console.error('Invalid vetId received:', fetchedVetId);
      setVetId(null);
    }
  } catch (error) {
    console.error('Error fetching vet ID:', error);
    setVetId(null);
  }
};

  // Fetch animals assigned to the vet with needs_attention status
// Fix the fetchAssignedAnimals function to handle null vetId
const fetchAssignedAnimals = async () => {
  try {
    // Don't make the request if vetId is null or undefined
    if (!vetId) {
      console.log('No vetId available, skipping assigned animals fetch');
      return [];
    }

    const token = await AsyncStorage.getItem('userToken');
    const response = await axios.get(`${API_BASE_URL}/user/vet/${vetId}/assigned-animals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Filter animals that need medical attention (status: needs_attention)
    const animalsNeedingAttention = response.data.animals.filter(animal => 
      animal.status === 'needs_attention'
    );
    
    // Process the data similar to processedPatients in the dashboard
    const processedAnimals = animalsNeedingAttention.map(animal => ({
      ...animal,
      checkupReason: animal.assignmentReason || 'Medical attention required',
      lastCheckup: animal.lastCheckup || null,
      urgencyLevel: 'high', // Since they need attention
      assignedDate: animal.assignedAt
    }));
    
    return processedAnimals;
  } catch (error) {
    console.error('Error fetching assigned animals:', error);
    return [];
  }
};

// Fix the fetchCheckups function to wait for vetId
const fetchCheckups = async () => {
  try {
    setLoading(true);
    
    // Don't proceed if vetId is not available
    if (!vetId) {
      console.log('No vetId available, cannot fetch checkups');
      setCheckups([]);
      return;
    }

    const token = await AsyncStorage.getItem('userToken');
    
    // First get the assigned animals that need attention (processed like in dashboard)
    const assignedAnimals = await fetchAssignedAnimals();
    
    if (assignedAnimals.length === 0) {
      console.log('No assigned animals found');
      setCheckups([]);
      return;
    }
    
    // Then get checkups for these animals
    const checkupPromises = assignedAnimals.map(animal => 
      axios.get(`${API_BASE_URL}/medical-records?recordType=checkup&animal=${animal._id}&populate=animal,veterinarian`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    );
    
    const checkupResponses = await Promise.all(checkupPromises);
    
    // Combine all checkups and add the processed animal data
    const allCheckups = checkupResponses.flatMap((response, index) => {
      return response.data.map(checkup => ({
        ...checkup,
        animal: assignedAnimals[index], // Use the processed animal data
        checkupReason: assignedAnimals[index].checkupReason,
        urgencyLevel: assignedAnimals[index].urgencyLevel,
        assignedDate: assignedAnimals[index].assignedDate,
        lastCheckup: assignedAnimals[index].lastCheckup
      }));
    });
    
    setCheckups(allCheckups);
  } catch (error) {
    console.error('Error fetching checkups:', error);
    showToast('error', 'Error', 'Failed to fetch medical checkups');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

// Fix the useEffect to properly wait for vetId before fetching
useEffect(() => {
  const loadData = async () => {
    try {
      // First fetch vetId
      await fetchVetId();
      // Then fetch animals (this doesn't depend on vetId)
      await fetchAnimals();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const unsubscribe = navigation.addListener('focus', loadData);
  return unsubscribe;
}, [navigation]);

// Add a separate useEffect that runs when vetId changes
useEffect(() => {
  if (vetId) {
    fetchCheckups();
  }
}, [vetId]);

// Also fix the fetchVetId function to ensure it properly sets the vetId


  // Fetch checkups for animals with assignmentReason
 

  // Fetch all animals (for the animal picker)
  const fetchAnimals = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_BASE_URL}/animal/getAll`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && response.data.success) {
        setAnimals(response.data.animals || []);
      } else {
        console.error('Unexpected response structure:', response.data);
        showToast('error', 'Error', 'Failed to load animals');
      }
    } catch (error) {
      console.error('Error fetching animals:', error);
      showToast('error', 'Error', 'Failed to fetch animals');
    }
  };

  // Handle animal selection
  const handleSelectAnimal = (animalId) => {
    if (showFilterModal) {
      setFilter({...filter, animal: animalId});
    } else {
      setFormData({...formData, animal: animalId});
    }
    setShowAnimalPicker(false);
  };

  // Handle status selection
  const handleSelectStatus = (status) => {
    if (showFilterModal) {
      setFilter({...filter, status});
    } else {
      setFormData({...formData, status});
    }
    setShowStatusPicker(false);
  };

  // Handle date selection
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === 'from') {
        setFilter({...filter, dateFrom: selectedDate});
      } else if (datePickerMode === 'to') {
        setFilter({...filter, dateTo: selectedDate});
      } else if (datePickerMode === 'checkup') {
        setFormData({...formData, date: selectedDate});
      } else {
        setFormData({...formData, followUpDate: selectedDate});
      }
    }
  };

  // Open view modal
  const openViewModal = (record) => {
    setCurrentRecord(record);
    setShowViewModal(true);
  };

  // Open edit modal
  const openEditModal = (record) => {
    setCurrentRecord(record);
    setFormData({
      animal: record.animal._id || record.animal,
      recordType: record.recordType,
      date: new Date(record.date),
      description: record.description,
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      weight: record.weight ? record.weight.toString() : '',
      temperature: record.temperature ? record.temperature.toString() : '',
      notes: record.notes || '',
      followUpDate: record.followUpDate ? new Date(record.followUpDate) : null,
      isCritical: record.isCritical || false,
      status: record.status || 'active'
    });
    setShowViewModal(false);
    setShowRecordModal(true);
  };

  // Open create modal
  const openCreateModal = () => {
    setCurrentRecord(null);
    setFormData({
      animal: '',
      recordType: 'checkup',
      date: new Date(),
      description: '',
      diagnosis: '',
      treatment: '',
      weight: '',
      temperature: '',
      notes: '',
      followUpDate: null,
      isCritical: false,
      status: 'active'
    });
    setShowRecordModal(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.animal || !formData.description) {
      showToast('error', 'Error', 'Animal and description are required');
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      
      const dataToSend = {
        ...formData,
        animal: formData.animal,
        date: formData.date.toISOString(),
        followUpDate: formData.followUpDate ? formData.followUpDate.toISOString() : null
      };

      if (currentRecord) {
        await axios.put(`${API_BASE_URL}/medical-records/${currentRecord._id}`, dataToSend, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        showToast('success', 'Success', 'Checkup updated');
      } else {
        await axios.post(`${API_BASE_URL}/medical-records`, dataToSend, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        showToast('success', 'Success', 'Checkup created');
      }
      
      setShowRecordModal(false);
      fetchCheckups();
    } catch (error) {
      console.error('Error saving checkup:', error);
      showToast('error', 'Error', `Failed to ${currentRecord ? 'update' : 'create'} checkup`);
    } finally {
      setLoading(false);
    }
  };

  // Delete checkup
  const deleteCheckup = async (id) => {
    Alert.alert(
      'Delete Checkup',
      'Are you sure you want to delete this record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await axios.delete(`${API_BASE_URL}/medical-records/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              showToast('success', 'Success', 'Checkup deleted');
              fetchCheckups();
            } catch (error) {
              console.error('Error deleting checkup:', error);
              showToast('error', 'Error', 'Failed to delete checkup');
            }
          }
        }
      ]
    );
  };

  // Apply filters
  const applyFilters = () => {
    setShowFilterModal(false);
    fetchCheckups();
  };

  // Reset filters
  const resetFilters = () => {
    setFilter({
      animal: '',
      status: '',
      dateFrom: null,
      dateTo: null
    });
    setShowFilterModal(false);
    fetchCheckups();
  };

  // Refresh data
  const onRefresh = () => {
    setRefreshing(true);
    fetchCheckups();
  };

  // Load data on focus
  useEffect(() => {
    const loadData = async () => {
      await fetchVetId();
      await fetchAnimals();
      await fetchCheckups();
    };

    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, vetId]);

  // Render checkup item
  const renderCheckupItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.checkupItem}
        onPress={() => openViewModal(item)}
      >
        <View style={styles.checkupHeader}>
          <Text style={styles.animalName}>{item.animal?.name || 'Unknown Animal'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.checkupDate}>{formatDate(item.date)}</Text>
        {item.checkupReason && (
          <Text style={styles.checkupReason}>Reason: {item.checkupReason}</Text>
        )}
        {item.lastCheckup && (
          <Text style={styles.lastCheckup}>Last checkup: {formatDate(item.lastCheckup)}</Text>
        )}
        <Text style={styles.checkupDescription} numberOfLines={2}>{item.description}</Text>
        
        <View style={styles.checkupFooter}>
          <Text style={styles.vetName}>By: {item.veterinarian?.name || 'Unknown Vet'}</Text>
          {item.assignedDate && (
            <Text style={styles.assignedDate}>Assigned: {formatDate(item.assignedDate)}</Text>
          )}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              onPress={() => openViewModal(item)}
              style={styles.editButton}
            >
              <Ionicons name="eye-outline" size={20} color="#315342" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => deleteCheckup(item._id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render header with menu button
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
        <Ionicons name="menu" size={28} color="#315342" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Medical Checkups</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={24} color="#315342" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={openCreateModal}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
      </View>
    );
  }

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={300}
      drawerPosition="left"
      renderNavigationView={() => (
        <CustomDrawer 
          navigation={navigation} 
          onClose={() => drawerRef.current?.closeDrawer()}
        />
      )}
    >
      <View style={styles.container}>
        {renderHeader()}

        <FlatList
          data={checkups}
          renderItem={renderCheckupItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="medkit-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No checkup records found</Text>
              <TouchableOpacity 
                style={styles.addNewButton}
                onPress={openCreateModal}
              >
                <Text style={styles.addNewButtonText}>Add New Checkup</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#315342']}
              tintColor="#315342"
            />
          }
        />

        {/* Animal Picker Modal */}
        <Modal
          visible={showAnimalPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAnimalPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Animal</Text>
                <TouchableOpacity onPress={() => setShowAnimalPicker(false)}>
                  <Ionicons name="close" size={24} color="#315342" />
                </TouchableOpacity>
              </View>

              {animals.length === 0 ? (
                <View style={styles.pickerEmpty}>
                  <ActivityIndicator size="large" color="#315342" />
                  <Text style={styles.pickerEmptyText}>Loading animals...</Text>
                </View>
              ) : (
                <FlatList
                  data={animals}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        (showFilterModal ? filter.animal : formData.animal) === item._id && styles.pickerItemSelected
                      ]}
                      onPress={() => handleSelectAnimal(item._id)}
                    >
                      {item.photo && (
                        <Image source={{ uri: item.photo }} style={styles.animalImage} />
                      )}
                      <Text style={styles.animalName}>{item.name}</Text>
                      {(showFilterModal ? filter.animal : formData.animal) === item._id && (
                        <Ionicons name="checkmark" size={20} color="#315342" />
                      )}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>

        {/* Status Picker Modal */}
        <Modal
          visible={showStatusPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowStatusPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Status</Text>
                <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
                  <Ionicons name="close" size={24} color="#315342" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={statusOptions}
                keyExtractor={item => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      (showFilterModal ? filter.status : formData.status) === item.value && styles.pickerItemSelected
                    ]}
                    onPress={() => handleSelectStatus(item.value)}
                  >
                    <Text>{item.label}</Text>
                    {(showFilterModal ? filter.status : formData.status) === item.value && (
                      <Ionicons name="checkmark" size={20} color="#315342" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <Text style={styles.modalTitle}>Filter Checkups</Text>
              
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Animal</Text>
                <TouchableOpacity 
                  style={styles.filterInput}
                  onPress={() => setShowAnimalPicker(true)}
                >
                  <Text>
                    {filter.animal ? 
                      animals.find(a => a._id === filter.animal)?.name || 'Unknown' : 
                      'All Animals'
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#315342" />
                </TouchableOpacity>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status</Text>
                <TouchableOpacity 
                  style={styles.filterInput}
                  onPress={() => setShowStatusPicker(true)}
                >
                  <Text>
                    {filter.status ? 
                      statusOptions.find(s => s.value === filter.status)?.label || 'Unknown' : 
                      'All Statuses'
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#315342" />
                </TouchableOpacity>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.dateRangeContainer}>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      setDatePickerMode('from');
                      setShowDatePicker(true);
                    }}
                  >
                    <Text>{filter.dateFrom ? formatDate(filter.dateFrom) : 'From Date'}</Text>
                    <Ionicons name="calendar" size={20} color="#315342" />
                  </TouchableOpacity>
                  <Text style={styles.dateRangeSeparator}>to</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => {
                      setDatePickerMode('to');
                      setShowDatePicker(true);
                    }}
                  >
                    <Text>{filter.dateTo ? formatDate(filter.dateTo) : 'To Date'}</Text>
                    <Ionicons name="calendar" size={20} color="#315342" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.resetButton]}
                  onPress={resetFilters}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.applyButton]}
                  onPress={applyFilters}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* View Record Modal */}
        <Modal
          visible={showViewModal}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowViewModal(false)}
        >
          <ViewCheckup 
            record={currentRecord}
            animals={animals}
            statusOptions={statusOptions}
            onClose={() => setShowViewModal(false)}
            onEdit={() => openEditModal(currentRecord)}
          />
        </Modal>

        {/* Edit/Create Record Modal */}
        <Modal
          visible={showRecordModal}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowRecordModal(false)}
        >
          <ScrollView contentContainerStyle={styles.recordModalContainer}>
            <View style={styles.recordModalHeader}>
              <Text style={styles.recordModalTitle}>
                {currentRecord ? 'Edit Checkup' : 'Add New Checkup'}
              </Text>
              <TouchableOpacity onPress={() => setShowRecordModal(false)}>
                <Ionicons name="close" size={24} color="#315342" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Animal *</Text>
              <TouchableOpacity 
                style={styles.formInput}
                onPress={() => setShowAnimalPicker(true)}
              >
                <Text>
                  {formData.animal ? 
                    animals.find(a => a._id === formData.animal)?.name || 'Select animal' : 
                    'Select animal'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color="#315342" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Checkup Date *</Text>
              <TouchableOpacity 
                style={styles.formInput}
                onPress={() => {
                  setDatePickerMode('checkup');
                  setShowDatePicker(true);
                }}
              >
                <Text>{formatDate(formData.date)}</Text>
                <Ionicons name="calendar" size={20} color="#315342" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description *</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                multiline
                numberOfLines={4}
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Enter description of the checkup"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Diagnosis</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                multiline
                numberOfLines={4}
                value={formData.diagnosis}
                onChangeText={(text) => setFormData({...formData, diagnosis: text})}
                placeholder="Enter diagnosis if applicable"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Treatment</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                multiline
                numberOfLines={4}
                value={formData.treatment}
                onChangeText={(text) => setFormData({...formData, treatment: text})}
                placeholder="Enter treatment details if applicable"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.formInput}
                keyboardType="numeric"
                value={formData.weight}
                onChangeText={(text) => setFormData({...formData, weight: text})}
                placeholder="Enter weight in kg"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Temperature (°C)</Text>
              <TextInput
                style={styles.formInput}
                keyboardType="numeric"
                value={formData.temperature}
                onChangeText={(text) => setFormData({...formData, temperature: text})}
                placeholder="Enter temperature in °C"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Follow-up Date</Text>
              <TouchableOpacity 
                style={styles.formInput}
                onPress={() => {
                  setDatePickerMode('followup');
                  setShowDatePicker(true);
                }}
              >
                <Text>
                  {formData.followUpDate ? 
                    formatDate(formData.followUpDate) : 
                    'Select follow-up date'
                  }
                </Text>
                <Ionicons name="calendar" size={20} color="#315342" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Status</Text>
              <TouchableOpacity 
                style={styles.formInput}
                onPress={() => setShowStatusPicker(true)}
              >
                <Text>
                  {formData.status ? 
                    statusOptions.find(s => s.value === formData.status)?.label || 'Unknown' : 
                    'Select status'
                  }
                </Text>
                <Ionicons name="chevron-down" size={20} color="#315342" />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Critical Case</Text>
              <TouchableOpacity
                style={[styles.switch, formData.isCritical ? styles.switchOn : styles.switchOff]}
                onPress={() => setFormData({...formData, isCritical: !formData.isCritical})}
              >
                <View style={styles.switchToggle} />
                <Text style={styles.switchText}>
                  {formData.isCritical ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Additional Notes</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                multiline
                numberOfLines={4}
                value={formData.notes}
                onChangeText={(text) => setFormData({...formData, notes: text})}
                placeholder="Enter any additional notes"
              />
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {currentRecord ? 'Update Checkup' : 'Save Checkup'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Modal>

        {showDatePicker && (
          <DateTimePicker
            value={
              datePickerMode === 'from' ? 
                (filter.dateFrom || new Date()) : 
                datePickerMode === 'to' ? 
                  (filter.dateTo || new Date()) :
                  datePickerMode === 'checkup' ?
                    (formData.date || new Date()) :
                    (formData.followUpDate || new Date())
            }
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
    </DrawerLayoutAndroid>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 35,
    backgroundColor: '#fff',
    borderBottomWidth: 3,
    borderBottomColor: '#a4d9ab',
    elevation: 8,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuButton: {
    padding: 12,
    marginRight: 10,
    backgroundColor: 'rgba(164, 217, 171, 0.1)',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#315342',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(164, 217, 171, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
    marginRight: 10,
    elevation: 3,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(164, 217, 171, 0.3)',
  },
  addButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#315342',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: '#a4d9ab',
  },
  listContent: {
    padding: 15,
    paddingBottom: 80,
  },
  checkupItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#a4d9ab',
    borderTopWidth: 1,
    borderTopColor: 'rgba(164, 217, 171, 0.3)',
  },
  checkupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    alignItems: 'center',
  },
  animalName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#315342',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(164, 217, 171, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    alignSelf: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  checkupDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
    backgroundColor: 'rgba(164, 217, 171, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  checkupReason: {
    fontSize: 14,
    color: '#FF6347',
    fontWeight: '500',
    marginBottom: 4,
    backgroundColor: 'rgba(255, 99, 71, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  lastCheckup: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  checkupDescription: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(164, 217, 171, 0.5)',
  },
  checkupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: 'rgba(164, 217, 171, 0.3)',
    paddingTop: 12,
    marginTop: 8,
  },
  vetName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    backgroundColor: 'rgba(164, 217, 171, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  assignedDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 8,
    marginRight: 12,
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'rgba(164, 217, 171, 0.05)',
    borderRadius: 20,
    marginTop: 50,
    borderWidth: 2,
    borderColor: 'rgba(164, 217, 171, 0.2)',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  addNewButton: {
    marginTop: 25,
    paddingVertical: 12,
    paddingHorizontal: 25,
    backgroundColor: '#315342',
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: '#a4d9ab',
  },
  addNewButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(49, 83, 66, 0.7)',
  },
  pickerContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 3,
    borderColor: '#a4d9ab',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 3,
    borderBottomColor: '#a4d9ab',
    backgroundColor: 'rgba(164, 217, 171, 0.1)',
  },
  pickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#315342',
    letterSpacing: 0.5,
  },
  pickerEmpty: {
    padding: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 217, 171, 0.05)',
  },
  pickerEmptyText: {
    marginTop: 15,
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(164, 217, 171, 0.2)',
    backgroundColor: '#fff',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
    borderLeftWidth: 5,
    borderLeftColor: '#315342',
  },
  animalImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    borderWidth: 3,
    borderColor: '#a4d9ab',
    elevation: 2,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterModal: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    elevation: 10,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderWidth: 3,
    borderColor: '#a4d9ab',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#315342',
    marginBottom: 25,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(164, 217, 171, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#315342',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  filterInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 217, 171, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(164, 217, 171, 0.3)',
    elevation: 2,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(164, 217, 171, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(164, 217, 171, 0.3)',
    elevation: 2,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dateRangeSeparator: {
    marginHorizontal: 12,
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resetButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  applyButton: {
    backgroundColor: '#315342',
    borderWidth: 2,
    borderColor: '#a4d9ab',
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  recordModalContainer: {
    padding: 25,
    paddingBottom: 50,
    backgroundColor: 'rgba(164, 217, 171, 0.02)',
  },
  recordModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: '#a4d9ab',
  },
  viewModeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#315342',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(164, 217, 171, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  formGroup: {
    marginBottom: 22,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#315342',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  formInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    borderWidth: 2,
    borderColor: 'rgba(164, 217, 171, 0.3)',
    fontSize: 16,
    elevation: 2,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  viewField: {
    backgroundColor: 'rgba(164, 217, 171, 0.08)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 2,
    borderColor: 'rgba(164, 217, 171, 0.3)',
    fontSize: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#315342',
  },
  viewFieldMultiline: {
    minHeight: 70,
  },
  textArea: {
    height: 110,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(164, 217, 171, 0.05)',
  },
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
    height: 35,
    borderRadius: 17.5,
    paddingHorizontal: 5,
    elevation: 2,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  switchOn: {
    backgroundColor: '#a4d9ab',
    justifyContent: 'flex-end',
    borderWidth: 2,
    borderColor: '#315342',
  },
  switchOff: {
    backgroundColor: '#ddd',
    justifyContent: 'flex-start',
    borderWidth: 2,
    borderColor: '#999',
  },
  switchToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  switchText: {
    marginLeft: 12,
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#315342',
    borderRadius: 15,
    padding: 18,
    alignItems: 'center',
    marginTop: 25,
    elevation: 6,
    shadowColor: '#315342',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: '#a4d9ab',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default MedicalCheckups;