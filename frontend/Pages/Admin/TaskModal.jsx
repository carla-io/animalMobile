
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  Switch,
  Dimensions,
  SafeAreaView,
  StatusBar,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';

const { width } = Dimensions.get('window');

const TaskModal = ({ showTaskModal, setShowTaskModal, setEditingTask, editingTask }) => {
  const [users, setUsers] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState({ show: false, field: null });
  const [showTimePicker, setShowTimePicker] = useState({ show: false, index: -1 });

  const [formData, setFormData] = useState({
    type: '',
    animal: '',
    assignedTo: '',
    scheduleDate: '',
    scheduleTimes: [''],
    status: 'Pending',
    isRecurring: false,
    recurrencePattern: 'Daily',
    endDate: ''
  });

  useEffect(() => {
    if (showTaskModal) {
      fetchInitialData();
    }
  }, [showTaskModal]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      console.log('API_BASE_URL:', API_BASE_URL);
      
      let usersData = [];
      try {
        console.log('Fetching users from:', `${API_BASE_URL}/user/getAllUsersOnly`);
        const usersResponse = await axios.get(`${API_BASE_URL}/user/getAllUsersOnly`);
        usersData = usersResponse.data.users || usersResponse.data || [];
        console.log('Users fetched successfully:', usersData.length);
      } catch (userError) {
        console.error('Error fetching users:', userError.response?.status, userError.response?.data);
        
        try {
          console.log('Trying alternative users endpoint:', `${API_BASE_URL}/user/getAll`);
          const altUsersResponse = await axios.get(`${API_BASE_URL}/user/getAll`);
          usersData = altUsersResponse.data.users || altUsersResponse.data || [];
          console.log('Users fetched from alternative endpoint:', usersData.length);
        } catch (altError) {
          console.error('Alternative users endpoint also failed:', altError.response?.status);
          Toast.show({
            type: 'error',
            text1: 'Failed to load users',
            text2: 'Users endpoint not available',
          });
        }
      }

      let animalsData = [];
      try {
        console.log('Fetching animals from:', `${API_BASE_URL}/animal/getAll`);
        const animalsResponse = await axios.get(`${API_BASE_URL}/animal/getAll`);
        animalsData = animalsResponse.data.animals || animalsResponse.data || [];
        console.log('Animals fetched successfully:', animalsData.length);
      } catch (animalError) {
        console.error('Error fetching animals:', animalError.response?.status, animalError.response?.data);
        
        try {
          console.log('Trying alternative animals endpoint:', `${API_BASE_URL}/animals/getAll`);
          const altAnimalsResponse = await axios.get(`${API_BASE_URL}/animals/getAll`);
          animalsData = altAnimalsResponse.data.animals || altAnimalsResponse.data || [];
          console.log('Animals fetched from alternative endpoint:', animalsData.length);
        } catch (altError) {
          console.error('Alternative animals endpoint also failed:', altError.response?.status);
          Toast.show({
            type: 'error',
            text1: 'Failed to load animals',
            text2: 'Animals endpoint not available',
          });
        }
      }

      setUsers(usersData);
      setAnimals(animalsData);

      if (usersData.length > 0 || animalsData.length > 0) {
        Toast.show({
          type: 'success',
          text1: 'Data loaded successfully!',
          text2: `${usersData.length} users, ${animalsData.length} animals`,
        });
      } else {
        Toast.show({
          type: 'warning',
          text1: 'No data available',
          text2: 'Please check your API endpoints',
        });
      }

    } catch (err) {
      console.error('General error fetching initial data:', err);
      Toast.show({
        type: 'error',
        text1: 'Failed to load data',
        text2: 'Please check your internet connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editingTask) {
      setFormData({
        type: editingTask.type || '',
        animal: editingTask.animalId?._id || editingTask.animalId || '',
        assignedTo: editingTask.assignedTo?._id || editingTask.assignedTo || '',
        scheduleDate: editingTask.scheduleDate ? new Date(editingTask.scheduleDate).toISOString().split('T')[0] : '',
        scheduleTimes: editingTask.scheduleTimes && editingTask.scheduleTimes.length > 0 ? editingTask.scheduleTimes : [''],
        status: editingTask.status || 'Pending',
        isRecurring: editingTask.isRecurring || false,
        recurrencePattern: editingTask.recurrencePattern || 'Daily',
        endDate: editingTask.endDate ? new Date(editingTask.endDate).toISOString().split('T')[0] : ''
      });
      Toast.show({
        type: 'info',
        text1: 'Editing task',
        text2: `${editingTask.type}`,
      });
    } else {
      setFormData({
        type: '',
        animal: '',
        assignedTo: '',
        scheduleDate: '',
        scheduleTimes: [''],
        status: 'Pending',
        isRecurring: false,
        recurrencePattern: 'Daily',
        endDate: ''
      });
    }
  }, [editingTask]);

  const taskTypes = [
    { value: 'Feeding', label: 'Feeding', icon: 'restaurant' },
    { value: 'Cleaning', label: 'Cleaning', icon: 'brush' },
    { value: 'Health Check', label: 'Health Check', icon: 'medical' },
    { value: 'Medication', label: 'Medication', icon: 'medical-outline' },
    { value: 'Observation', label: 'Observation', icon: 'eye' },
    { value: 'Weight Monitoring', label: 'Weight Monitoring', icon: 'scale' }
  ];

  const recurrenceOptions = [
    { value: 'Daily', label: 'Daily', icon: 'calendar' },
    { value: 'Weekly', label: 'Weekly', icon: 'calendar-outline' },
    { value: 'Monthly', label: 'Monthly', icon: 'calendar-clear' }
  ];

  const statusOptions = [
    { value: 'Pending', label: 'Pending', icon: 'time', color: '#ffc107' },
    { value: 'Completed', label: 'Completed', icon: 'checkmark-circle', color: '#28a745' }
  ];

  // Generate time options (15-minute intervals)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push({ value: timeString, label: timeString });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleTimeChange = (index, value) => {
    const newTimes = [...formData.scheduleTimes];
    newTimes[index] = value;
    setFormData(prev => ({ ...prev, scheduleTimes: newTimes }));
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      scheduleTimes: [...prev.scheduleTimes, '']
    }));
    Toast.show({
      type: 'info',
      text1: 'Added new time slot',
    });
  };

  const removeTimeSlot = (index) => {
    if (formData.scheduleTimes.length > 1) {
      const newTimes = formData.scheduleTimes.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, scheduleTimes: newTimes }));
      Toast.show({
        type: 'info',
        text1: 'Removed time slot',
      });
    }
  };

  const validateForm = () => {
    if (!formData.type || !formData.animal || !formData.assignedTo || !formData.scheduleDate) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all required fields',
      });
      return false;
    }

    if (formData.isRecurring && !formData.endDate) {
      Toast.show({
        type: 'error',
        text1: 'Please select an end date for recurring tasks',
      });
      return false;
    }

    const validTimes = formData.scheduleTimes.filter(time => time.trim() !== '');
    if (validTimes.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Please provide at least one schedule time',
      });
      return false;
    }

    const timeRegex = /^\d{2}:\d{2}$/;
    const invalidTimes = validTimes.filter(time => !timeRegex.test(time));
    if (invalidTimes.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Please ensure all times are in HH:MM format',
      });
      return false;
    }

    if (formData.isRecurring && formData.endDate) {
      const startDate = new Date(formData.scheduleDate);
      const endDate = new Date(formData.endDate);
      if (endDate <= startDate) {
        Toast.show({
          type: 'error',
          text1: 'End date must be after the schedule date',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    const validTimes = formData.scheduleTimes.filter(time => time.trim() !== '');

    const payload = {
      type: formData.type,
      animalId: formData.animal,
      assignedTo: formData.assignedTo,
      scheduleDate: formData.scheduleDate,
      scheduleTimes: validTimes,
      status: formData.status,
      isRecurring: formData.isRecurring
    };

    if (formData.isRecurring) {
      payload.recurrencePattern = formData.recurrencePattern;
      payload.endDate = formData.endDate;
    }

    try {
      const animalName = animals.find(animal => animal._id === formData.animal)?.name || 'Unknown';
      const userName = users.find(user => user._id === formData.assignedTo)?.name || 'Unknown';

      console.log('Submitting payload:', payload);

      if (editingTask) {
        const editUrl = `${API_BASE_URL}/tasks/edit/${editingTask._id}`;
        console.log('Updating task at:', editUrl);
        await axios.put(editUrl, payload);
        Toast.show({
          type: 'success',
          text1: 'Task updated successfully!',
          text2: `"${formData.type}" for ${animalName}`,
        });
      } else {
        const createUrl = `${API_BASE_URL}/tasks/add`;
        console.log('Creating task at:', createUrl);
        await axios.post(createUrl, payload);
        Toast.show({
          type: 'success',
          text1: 'Task assigned successfully!',
          text2: `"${formData.type}" assigned to ${userName} for ${animalName}`,
        });
      }

      handleClose();
      
    } catch (err) {
      console.error('Failed to submit task:', err);
      console.error('Error details:', err.response?.data);
      
      if (err.response?.data?.message) {
        Toast.show({
          type: 'error',
          text1: err.response.data.message,
        });
      } else if (err.response?.status === 404) {
        Toast.show({
          type: 'error',
          text1: 'Task endpoint not found',
          text2: 'Please check your API configuration',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Something went wrong',
          text2: 'Please check the input and try again.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ 
      type: '', 
      animal: '', 
      assignedTo: '', 
      scheduleDate: '', 
      scheduleTimes: [''],
      status: 'Pending',
      isRecurring: false,
      recurrencePattern: 'Daily',
      endDate: ''
    });
    setEditingTask(null);
    setShowTaskModal(false);
    setShowDropdown(null);
    setShowDatePicker({ show: false, field: null });
    setShowTimePicker({ show: false, index: -1 });
    Toast.show({
      type: 'info',
      text1: 'Task form closed',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Fixed CustomDropdown component to remove nested FlatList
  const CustomDropdown = ({ title, value, onValueChange, options, placeholder, fieldKey }) => {
    const isOpen = showDropdown === fieldKey;
    const selectedOption = options.find(opt => (opt.value || opt) === value);

    return (
      <View style={styles.formGroup}>
        <Text style={styles.label}>{title}</Text>
        <TouchableOpacity
          style={[styles.dropdownButton, isOpen && styles.dropdownButtonOpen]}
          onPress={() => setShowDropdown(isOpen ? null : fieldKey)}
        >
          <View style={styles.dropdownButtonContent}>
            {selectedOption?.icon && (
              <Ionicons 
                name={selectedOption.icon} 
                size={20} 
                color={selectedOption?.color || '#315342'} 
                style={styles.dropdownIcon}
              />
            )}
            <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
              {selectedOption?.label || value || placeholder}
            </Text>
          </View>
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {isOpen && (
          <View style={styles.dropdownList}>
            <ScrollView
              style={styles.dropdownScrollView}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {options.map((item, index) => (
                <TouchableOpacity
                  key={`${fieldKey}-${index}`}
                  style={[
                    styles.dropdownItem,
                    (item.value || item) === value && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    onValueChange(item.value || item);
                    setShowDropdown(null);
                  }}
                >
                  {item.icon && (
                    <Ionicons 
                      name={item.icon} 
                      size={18} 
                      color={item.color || '#315342'} 
                      style={styles.dropdownItemIcon}
                    />
                  )}
                  <Text style={[
                    styles.dropdownItemText,
                    (item.value || item) === value && styles.dropdownItemTextSelected
                  ]}>
                    {item.label || item}
                  </Text>
                  {(item.value || item) === value && (
                    <Ionicons name="checkmark" size={18} color="#315342" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // Fixed DatePickerInput component
  const DatePickerInput = ({ title, value, onValueChange, placeholder, fieldKey }) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{title}</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker({ show: true, field: fieldKey })}
      >
        <View style={styles.datePickerContent}>
          <Ionicons name="calendar" size={20} color="#315342" style={styles.dateIcon} />
          <Text style={[styles.dateText, !value && styles.placeholderText]}>
            {value ? formatDate(value) : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const TimePickerInput = ({ value, onValueChange, index }) => (
    <View style={styles.timePickerContainer}>
      <TouchableOpacity
        style={styles.timePickerButton}
        onPress={() => setShowTimePicker({ show: true, index })}
      >
        <View style={styles.timePickerContent}>
          <Ionicons name="time" size={18} color="#315342" style={styles.timeIcon} />
          <Text style={[styles.timeText, !value && styles.placeholderText]}>
            {value ? formatTime(value) : 'Select time'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>
    </View>
  );

  // Handle date change based on field
  const handleDateChange = (text) => {
    if (showDatePicker.field === 'scheduleDate') {
      setFormData(prev => ({ ...prev, scheduleDate: text }));
    } else if (showDatePicker.field === 'endDate') {
      setFormData(prev => ({ ...prev, endDate: text }));
    }
  };

  // Get current date value based on field
  const getCurrentDateValue = () => {
    if (showDatePicker.field === 'scheduleDate') {
      return formData.scheduleDate;
    } else if (showDatePicker.field === 'endDate') {
      return formData.endDate;
    }
    return '';
  };

  if (loading) {
    return (
      <Modal visible={showTaskModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#315342" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={showTaskModal} transparent animationType="slide">
      <SafeAreaView style={styles.modalOverlay}>
        <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'Assign Task'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Task Type */}
            <CustomDropdown
              title="Task Type *"
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              options={taskTypes}
              placeholder="Select task type"
              fieldKey="taskType"
            />

            {/* Animal */}
            <CustomDropdown
              title="Animal *"
              value={formData.animal}
              onValueChange={(value) => setFormData(prev => ({ ...prev, animal: value }))}
              options={animals.map(animal => ({ value: animal._id, label: animal.name, icon: 'paw' }))}
              placeholder={animals.length > 0 ? 'Select animal' : 'No animals available'}
              fieldKey="animal"
            />

            {/* Assigned To */}
            <CustomDropdown
              title="Assigned To *"
              value={formData.assignedTo}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
              options={users.map(user => ({ value: user._id, label: user.name, icon: 'person' }))}
              placeholder={users.length > 0 ? 'Select user' : 'No users available'}
              fieldKey="assignedTo"
            />

            {/* Show warning if no data */}
            {(users.length === 0 || animals.length === 0) && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning" size={20} color="#ffc107" />
                <Text style={styles.warningText}>
                  {users.length === 0 && animals.length === 0
                    ? 'No users or animals available. Please add some first.'
                    : users.length === 0
                    ? 'No users available. Please add users first.'
                    : 'No animals available. Please add animals first.'}
                </Text>
              </View>
            )}

            {/* Recurring Task Toggle */}
            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <Ionicons name="repeat" size={20} color="#315342" />
                <Text style={styles.switchLabel}>Make this a recurring task</Text>
                <Switch
                  value={formData.isRecurring}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, isRecurring: value }));
                    Toast.show({
                      type: 'info',
                      text1: value ? 'Recurring task enabled' : 'Single task selected',
                    });
                  }}
                  trackColor={{ false: '#767577', true: '#315342' }}
                  thumbColor={formData.isRecurring ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Schedule Date */}
            <DatePickerInput
              title="Schedule Date *"
              value={formData.scheduleDate}
              onValueChange={(value) => setFormData(prev => ({ ...prev, scheduleDate: value }))}
              placeholder="Select date"
              fieldKey="scheduleDate"
            />

            {/* Recurrence Pattern (only if recurring) */}
            {formData.isRecurring && (
              <>
                <CustomDropdown
                  title="Recurrence Pattern *"
                  value={formData.recurrencePattern}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, recurrencePattern: value }))}
                  options={recurrenceOptions}
                  placeholder="Select pattern"
                  fieldKey="recurrencePattern"
                />

                {/* End Date */}
                <DatePickerInput
                  title="End Date *"
                  value={formData.endDate}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, endDate: value }))}
                  placeholder="Select end date"
                  fieldKey="endDate"
                />
              </>
            )}

            {/* Schedule Times */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Schedule Times *</Text>
              {formData.scheduleTimes.map((time, index) => (
                <View key={index} style={styles.timeSlotContainer}>
                  <View style={styles.timeInputContainer}>
                    <TimePickerInput
                      value={time}
                      onValueChange={(value) => handleTimeChange(index, value)}
                      index={index}
                    />
                  </View>
                  {formData.scheduleTimes.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeTimeButton}
                      onPress={() => removeTimeSlot(index)}
                    >
                      <Ionicons name="remove-circle" size={24} color="#dc3545" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addTimeButton} onPress={addTimeSlot}>
                <Ionicons name="add-circle" size={20} color="#315342" />
                <Text style={styles.addTimeText}>Add Another Time</Text>
              </TouchableOpacity>
            </View>

            {/* Status */}
            <CustomDropdown
              title="Status"
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              options={statusOptions}
              placeholder="Select status"
              fieldKey="status"
            />
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={submitting || users.length === 0 || animals.length === 0}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingTask ? 'Update' : 'Assign'} Task
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker Modal */}
        <Modal visible={showDatePicker.show} transparent animationType="fade">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>
                  {showDatePicker.field === 'scheduleDate' ? 'Select Schedule Date' : 'Select End Date'}
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker({ show: false, field: null })}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.dateInput}
                placeholder="YYYY-MM-DD"
                value={getCurrentDateValue()}
                onChangeText={handleDateChange}
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                style={styles.pickerConfirmButton}
                onPress={() => setShowDatePicker({ show: false, field: null })}
              >
                <Text style={styles.pickerConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Time Picker Modal - Fixed to use ScrollView instead of FlatList */}
        <Modal visible={showTimePicker.show} transparent animationType="fade">
          <View style={styles.pickerModalOverlay}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePicker({ show: false, index: -1 })}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.timeOptionsList} showsVerticalScrollIndicator={true}>
                {timeOptions.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={styles.timeOption}
                    onPress={() => {
                      handleTimeChange(showTimePicker.index, item.value);
                      setShowTimePicker({ show: false, index: -1 });
                    }}
                  >
                    <Text style={styles.timeOptionText}>{formatTime(item.value)}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#315342',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  // Custom Dropdown Styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 48,
  },
  dropdownButtonOpen: {
    borderColor: '#315342',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#315342',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownFlatList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0f8f4',
  },
  dropdownItemIcon: {
    marginRight: 8,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#315342',
    fontWeight: '600',
  },
  
  // Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 48,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  
  // Time Picker Styles
  timeSlotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  timePickerContainer: {
    flex: 1,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    minHeight: 48,
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#333',
  },
  removeTimeButton: {
    padding: 5,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#315342',
    borderRadius: 8,
    borderStyle: 'dashed',
    backgroundColor: '#f0f8f4',
    marginTop: 5,
  },
  addTimeText: {
    marginLeft: 5,
    color: '#315342',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Switch Styles
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f0f8f4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0f2e0',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  
  // Warning Styles
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  warningText: {
    marginLeft: 10,
    color: '#856404',
    fontSize: 14,
    flex: 1,
  },
  
  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#315342',
    marginLeft: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Loading Styles
  loadingContainer: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  
  // Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: width * 0.8,
    maxHeight: '70%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#315342',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    margin: 16,
  },
  pickerConfirmButton: {
    backgroundColor: '#315342',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timeOptionsList: {
    maxHeight: 300,
  },
  timeOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default TaskModal;