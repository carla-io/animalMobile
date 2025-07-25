import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  TextInput,
} from 'react-native';
import {
  X,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import API_BASE_URL from '../../utils/api';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const SeekVetModal = ({ visible, onClose, selectedAnimal, onAssignSuccess }) => {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [assigningVet, setAssigningVet] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);
  const [assignmentReason, setAssignmentReason] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch all users with userType = 'vet'
 const fetchVets = async () => {
  setLoading(true);
  try {
    const response = await axios.get(`${API_BASE_URL}/user/getAllVetsOnly`);
    console.log('Response:', response.data);
    
    if (response.data.success) {
      // Temporarily show all users to debug
      setVets(response.data.users || []);
      console.log('All users loaded:', response.data.users?.length);
    }
  } catch (error) {
    console.error('Error:', error);
    Alert.alert('Error', 'Failed to fetch users');
  } finally {
    setLoading(false);
  }
};

  // Initialize modal when it becomes visible
  useEffect(() => {
    if (visible) {
      fetchVets();
      setSearchText('');
      setSelectedVet(null);
      setAssignmentReason('');
      setDropdownOpen(false);
    }
  }, [visible]);

  // Filter vets based on search
  const filteredVets = vets.filter(vet =>
    !searchText ||
    vet.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    vet.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    vet.specialization?.toLowerCase().includes(searchText.toLowerCase()) ||
    vet.location?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Assign veterinarian to animal
  const assignVetToAnimal = async (vetId) => {
    if (!selectedAnimal || !vetId) {
      Alert.alert('Error', 'Missing animal or veterinarian information');
      return;
    }

    if (!assignmentReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the veterinary assignment');
      return;
    }

    setAssigningVet(vetId);
    try {
      const response = await fetch(`${API_BASE_URL}/animals/${selectedAnimal._id}/assign-vet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vetId: vetId,
          reason: assignmentReason.trim(),
          priority: 'high',
          assignedAt: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success',
          `Veterinarian assigned successfully to ${selectedAnimal.name}`,
          [
            {
              text: 'OK',
              onPress: () => {
                onAssignSuccess && onAssignSuccess(data.assignment);
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to assign veterinarian');
      }
    } catch (error) {
      console.error('Error assigning vet:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setAssigningVet(null);
    }
  };

  // Handle vet selection from dropdown
  const handleVetSelect = (vet) => {
    setSelectedVet(vet);
    setDropdownOpen(false);
  };

  // Render dropdown item
  const renderDropdownItem = (vet) => (
    <TouchableOpacity
      key={vet._id}
      style={styles.dropdownItem}
      onPress={() => handleVetSelect(vet)}
    >
      <View style={styles.dropdownItemContent}>
        <View style={styles.dropdownVetInfo}>
          <Text style={styles.dropdownVetName}>{vet.name}</Text>
          <Text style={styles.dropdownVetTitle}>
            {vet.specialization || 'General Veterinarian'}
          </Text>
          {vet.email && (
            <Text style={styles.dropdownVetEmail}>{vet.email}</Text>
          )}
        </View>
        <View style={styles.vetBadge}>
          <Stethoscope size={12} color="#315342" />
          <Text style={styles.vetBadgeText}>VET</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <AlertTriangle size={24} color="#e53e3e" />
              <View style={styles.headerText}>
                <Text style={styles.modalTitle}>Seek Veterinarian</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedAnimal ? `For ${selectedAnimal.name}` : 'Assign a vet'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#718096" />
            </TouchableOpacity>
          </View>

          {/* Animal Info */}
          {selectedAnimal && (
            <View style={styles.animalInfoSection}>
              <Text style={styles.sectionTitle}>Animal Information</Text>
              <View style={styles.animalInfoCard}>
                <Text style={styles.animalName}>{selectedAnimal.name}</Text>
                <Text style={styles.animalDetails}>
                  {selectedAnimal.species} • {selectedAnimal.breed}
                </Text>
                {selectedAnimal.age && (
                  <Text style={styles.animalAge}>Age: {selectedAnimal.age}</Text>
                )}
              </View>
            </View>
          )}

          {/* Veterinarian Dropdown */}
          <View style={styles.dropdownSection}>
            <Text style={styles.sectionTitle}>Select Veterinarian</Text>
            
            {loading ? (
              <View style={styles.loadingDropdown}>
                <ActivityIndicator size="small" color="#315342" />
                <Text style={styles.loadingText}>Loading veterinarians...</Text>
              </View>
            ) : (
              <View style={styles.dropdownContainer}>
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    dropdownOpen && styles.dropdownButtonOpen
                  ]}
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                >
                  <View style={styles.dropdownButtonContent}>
                    <Text style={[
                      styles.dropdownButtonText,
                      selectedVet && styles.dropdownButtonTextSelected
                    ]}>
                      {selectedVet ? selectedVet.name : 'Choose a veterinarian...'}
                    </Text>
                    {dropdownOpen ? (
                      <ChevronUp size={20} color="#718096" />
                    ) : (
                      <ChevronDown size={20} color="#718096" />
                    )}
                  </View>
                </TouchableOpacity>

                {dropdownOpen && (
                  <View style={styles.dropdownList}>
                    {/* Search Bar inside dropdown */}
                    <View style={styles.dropdownSearchContainer}>
                      <Search size={16} color="#718096" />
                      <TextInput
                        style={styles.dropdownSearchInput}
                        placeholder="Search veterinarians..."
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholderTextColor="#a0aec0"
                      />
                    </View>

                    <ScrollView 
                      style={styles.dropdownScrollView}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled={true}
                    >
                      {filteredVets.length === 0 ? (
                        <View style={styles.emptyDropdown}>
                          <Stethoscope size={32} color="#a0aec0" />
                          <Text style={styles.emptyDropdownText}>
                            {searchText ? 'No veterinarians match your search' : 'No veterinarians available'}
                          </Text>
                        </View>
                      ) : (
                        filteredVets.map(renderDropdownItem)
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Selected Vet Details */}
          {selectedVet && (
            <View style={styles.selectedVetSection}>
              <Text style={styles.sectionTitle}>Selected Veterinarian</Text>
              <View style={styles.selectedVetCard}>
                <View style={styles.selectedVetHeader}>
                  <View style={styles.selectedVetInfo}>
                    <Text style={styles.selectedVetName}>{selectedVet.name}</Text>
                    <Text style={styles.selectedVetTitle}>
                      {selectedVet.specialization || 'General Veterinarian'}
                    </Text>
                  </View>
                  <View style={styles.vetBadge}>
                    <Stethoscope size={16} color="#315342" />
                    <Text style={styles.vetBadgeText}>VET</Text>
                  </View>
                </View>

                <View style={styles.selectedVetDetails}>
                  {selectedVet.email && (
                    <View style={styles.selectedVetDetailRow}>
                      <Mail size={14} color="#718096" />
                      <Text style={styles.selectedVetDetailText}>{selectedVet.email}</Text>
                    </View>
                  )}
                  
                  {selectedVet.phone && (
                    <View style={styles.selectedVetDetailRow}>
                      <Phone size={14} color="#718096" />
                      <Text style={styles.selectedVetDetailText}>{selectedVet.phone}</Text>
                    </View>
                  )}
                  
                  {selectedVet.location && (
                    <View style={styles.selectedVetDetailRow}>
                      <MapPin size={14} color="#718096" />
                      <Text style={styles.selectedVetDetailText}>{selectedVet.location}</Text>
                    </View>
                  )}

                  {selectedVet.experience && (
                    <View style={styles.selectedVetDetailRow}>
                      <Clock size={14} color="#718096" />
                      <Text style={styles.selectedVetDetailText}>{selectedVet.experience} years experience</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Assignment Reason */}
          {selectedVet && (
            <View style={styles.reasonSection}>
              <Text style={styles.sectionTitle}>Assignment Reason</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Describe the reason for veterinary consultation..."
                value={assignmentReason}
                onChangeText={setAssignmentReason}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#a0aec0"
              />
            </View>
          )}

          {/* Action Buttons */}
          {selectedVet && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSelectedVet(null)}
              >
                <Text style={styles.cancelButtonText}>Clear Selection</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.assignButton,
                  (!assignmentReason.trim() || assigningVet) && styles.assignButtonDisabled
                ]}
                onPress={() => assignVetToAnimal(selectedVet._id)}
                disabled={!assignmentReason.trim() || assigningVet}
              >
                {assigningVet ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.assignButtonText}>Assign Veterinarian</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.95,
    maxHeight: height * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  animalInfoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
  },
  animalInfoCard: {
    backgroundColor: '#f0fff4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#315342',
  },
  animalDetails: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 4,
  },
  animalAge: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 2,
  },
  dropdownSection: {
    padding: 20,
    paddingBottom: 0,
  },
  loadingDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#315342',
    fontWeight: '500',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButtonOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: 'transparent',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 15,
    color: '#a0aec0',
  },
  dropdownButtonTextSelected: {
    color: '#2d3748',
    fontWeight: '500',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dropdownSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#2d3748',
  },
  dropdownScrollView: {
    maxHeight: 250,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownVetInfo: {
    flex: 1,
  },
  dropdownVetName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a202c',
  },
  dropdownVetTitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 2,
  },
  dropdownVetEmail: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 2,
  },
  emptyDropdown: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyDropdownText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginTop: 12,
  },
  selectedVetSection: {
    padding: 20,
    paddingBottom: 0,
  },
  selectedVetCard: {
    backgroundColor: '#f0fff4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c6f6d5',
  },
  selectedVetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedVetInfo: {
    flex: 1,
  },
  selectedVetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#315342',
  },
  selectedVetTitle: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 2,
  },
  selectedVetDetails: {},
  selectedVetDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedVetDetailText: {
    fontSize: 13,
    color: '#4a5568',
    marginLeft: 8,
  },
  vetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#315342',
  },
  vetBadgeText: {
    fontSize: 10,
    color: '#315342',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reasonSection: {
    padding: 20,
    paddingTop: 0,
  },
  reasonInput: {
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#2d3748',
    minHeight: 80,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '600',
  },
  assignButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#315342',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignButtonDisabled: {
    backgroundColor: '#a0aec0',
  },
  assignButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default SeekVetModal;