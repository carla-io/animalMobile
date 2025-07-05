import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import API_BASE_URL from '../../utils/api';
import CustomDrawer from '../CustomDrawer'; // Import your CustomDrawer component

const { width, height } = Dimensions.get('window');

const AnimalProfiles = ({ setShowAnimalModal }) => {
  const navigation = useNavigation();
  
  const [animals, setAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [modals, setModals] = useState({
    detail: false,
    edit: false,
    add: false,
    delete: false
  });
  const [editAnimal, setEditAnimal] = useState({});
  const [newAnimal, setNewAnimal] = useState({
    name: '', species: '', breed: '', age: '', status: 'healthy', owner: ''
  });
  const [photos, setPhotos] = useState({
    editFile: null, newFile: null, editPreview: '', newPreview: ''
  });

  useEffect(() => {
    fetchAnimals();
  }, []);

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

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/animal/getAll`);
      if (response.data.success) {
        setAnimals(response.data.animals);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load animals');
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (isEdit = false) => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setPhotos(prev => ({
          ...prev,
          [isEdit ? 'editFile' : 'newFile']: asset,
          [isEdit ? 'editPreview' : 'newPreview']: asset.uri
        }));
      }
    });
  };

  const removePhoto = (isEdit = false) => {
    setPhotos(prev => ({
      ...prev,
      [isEdit ? 'editFile' : 'newFile']: null,
      [isEdit ? 'editPreview' : 'newPreview']: ''
    }));
  };

  const openModal = (type, animal = null) => {
    setModals({ detail: false, edit: false, add: false, delete: false, [type]: true });
    if (animal) {
      setSelectedAnimal(animal);
      if (type === 'edit') {
        setEditAnimal({ ...animal });
        setPhotos(prev => ({ ...prev, editPreview: animal.photo || '' }));
      }
    }
  };

  const closeModal = () => {
    setModals({ detail: false, edit: false, add: false, delete: false });
    setSelectedAnimal(null);
    setEditAnimal({});
    setNewAnimal({ name: '', species: '', breed: '', age: '', status: 'healthy', owner: '' });
    setPhotos({ editFile: null, newFile: null, editPreview: '', newPreview: '' });
  };

  const handleDelete = async () => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/animal/delete/${selectedAnimal._id}`);
      if (response.data.success) {
        setAnimals(prev => prev.filter(animal => animal._id !== selectedAnimal._id));
        Alert.alert('Success', `${selectedAnimal.name} deleted successfully!`);
        closeModal();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete animal');
      console.error('Error:', error);
    }
  };

  const submitForm = async (isEdit = false) => {
    try {
      const formData = new FormData();
      const data = isEdit ? editAnimal : newAnimal;
      
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value || '');
      });

      const photoFile = isEdit ? photos.editFile : photos.newFile;
      if (photoFile) {
        formData.append('photo', {
          uri: photoFile.uri,
          type: photoFile.type,
          name: photoFile.fileName || 'photo.jpg',
        });
      }

      const url = isEdit 
        ? `${API_BASE_URL}/animal/update/${editAnimal._id}`
        : `${API_BASE_URL}/animal/add`;
      
      const response = await axios[isEdit ? 'put' : 'post'](url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        if (isEdit) {
          setAnimals(prev => prev.map(animal => 
            animal._id === editAnimal._id ? response.data.animal : animal
          ));
          Alert.alert('Success', `${editAnimal.name} updated successfully!`);
        } else {
          setAnimals(prev => [...prev, response.data.animal]);
          Alert.alert('Success', `${newAnimal.name} added successfully!`);
        }
        closeModal();
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'add'} animal`);
      console.error('Error:', error);
    }
  };

  const renderPhotoSection = (isEdit = false) => {
    const preview = isEdit ? photos.editPreview : photos.newPreview;
    
    return (
      <View style={styles.photoSection}>
        <Text style={styles.photoLabel}>Animal Photo</Text>
        {preview ? (
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: preview }} style={styles.photoPreview} />
            <TouchableOpacity 
              style={styles.removePhotoBtn}
              onPress={() => removePhoto(isEdit)}
            >
              <Icon name="x" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.photoUploadArea}
            onPress={() => handlePhotoChange(isEdit)}
          >
            <Icon name="upload" size={24} color="#718096" />
            <Text style={styles.photoUploadText}>Upload Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFormFields = (data, setData) => (
    <>
      {renderPhotoSection(data === editAnimal)}
      {['name', 'species', 'breed', 'age', 'owner'].map(field => (
        <View key={field} style={styles.formField}>
          <Text style={styles.formLabel}>
            {field.charAt(0).toUpperCase() + field.slice(1)}
          </Text>
          <TextInput
            style={styles.formInput}
            placeholder={`Enter ${field}${field === 'age' ? ' in years' : ''}`}
            value={data[field] || ''}
            onChangeText={(text) => setData(prev => ({ ...prev, [field]: text }))}
            keyboardType={field === 'age' ? 'numeric' : 'default'}
          />
        </View>
      ))}
      <View style={styles.formField}>
        <Text style={styles.formLabel}>Status</Text>
        <View style={styles.statusContainer}>
          <TouchableOpacity
            style={[
              styles.statusOption,
              data.status === 'healthy' && styles.statusOptionActive
            ]}
            onPress={() => setData(prev => ({ ...prev, status: 'healthy' }))}
          >
            <Text style={[
              styles.statusOptionText,
              data.status === 'healthy' && styles.statusOptionTextActive
            ]}>
              Healthy
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusOption,
              data.status === 'needs_attention' && styles.statusOptionActive
            ]}
            onPress={() => setData(prev => ({ ...prev, status: 'needs_attention' }))}
          >
            <Text style={[
              styles.statusOptionText,
              data.status === 'needs_attention' && styles.statusOptionTextActive
            ]}>
              Needs Attention
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#315342" />
        <Text style={styles.loadingText}>Loading animals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#315342" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
              <Icon name="menu" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Animal Profiles</Text>
              <Text style={styles.headerSubtitle}>
                Manage your animal records
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openModal('add')}
            >
              <Icon name="plus" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Animals List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {animals.map(animal => (
          <View key={animal._id} style={styles.animalCard}>
            <View style={styles.animalPhotoContainer}>
              {animal.photo ? (
                <Image source={{ uri: animal.photo }} style={styles.animalPhoto} />
              ) : (
                <View style={styles.animalPhotoPlaceholder}>
                  <Icon name="camera" size={32} color="#a0aec0" />
                  <Text style={styles.photoPlaceholderText}>No Photo</Text>
                </View>
              )}
            </View>

            <View style={styles.animalInfo}>
              <View style={styles.animalHeader}>
                <Text style={styles.animalName}>{animal.name}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: animal.status === 'healthy' ? '#48bb78' : '#ed8936' }
                ]}>
                  <Text style={styles.statusText}>
                    {animal.status?.replace('_', ' ') || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.animalDetails}>
                {['species', 'breed', 'age', 'owner'].map(field => (
                  <View key={field} style={styles.animalDetail}>
                    <Text style={styles.animalDetailLabel}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}:
                    </Text>
                    <Text style={styles.animalDetailValue}>
                      {animal[field] || 'N/A'}{field === 'age' ? ' years' : ''}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.animalActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openModal('detail', animal)}
                >
                  <Icon name="eye" size={16} color="#315342" />
                  <Text style={styles.actionButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openModal('edit', animal)}
                >
                  <Icon name="edit-3" size={16} color="#315342" />
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => openModal('delete', animal)}
                >
                  <Icon name="trash-2" size={16} color="#e53e3e" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={modals.detail} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedAnimal?.name}'s Details
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="x" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {selectedAnimal?.photo && (
                <Image 
                  source={{ uri: selectedAnimal.photo }} 
                  style={styles.detailPhoto} 
                />
              )}
              
              {['species', 'breed', 'age', 'owner'].map(field => (
                <View key={field} style={styles.detailItem}>
                  <Text style={styles.detailLabel}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}:
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedAnimal?.[field] || 'N/A'}{field === 'age' ? ' years' : ''}
                  </Text>
                </View>
              ))}
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: selectedAnimal?.status === 'healthy' ? '#48bb78' : '#ed8936' }
                ]}>
                  <Text style={styles.statusText}>
                    {selectedAnimal?.status?.replace('_', ' ') || 'N/A'}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={closeModal}>
                <Text style={styles.btnSecondaryText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={modals.edit} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {selectedAnimal?.name}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="x" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {renderFormFields(editAnimal, setEditAnimal)}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={closeModal}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnPrimary} 
                onPress={() => submitForm(true)}
              >
                <Icon name="save" size={16} color="#fff" />
                <Text style={styles.btnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Modal */}
      <Modal visible={modals.add} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Animal</Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="x" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {renderFormFields(newAnimal, setNewAnimal)}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={closeModal}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnPrimary} 
                onPress={() => submitForm(false)}
              >
                <Icon name="save" size={16} color="#fff" />
                <Text style={styles.btnPrimaryText}>Add Animal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Modal */}
      <Modal visible={modals.delete} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Animal</Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="x" size={24} color="#4a5568" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.deleteWarning}>
                <Icon name="trash-2" size={48} color="#e53e3e" />
                <Text style={styles.deleteWarningText}>
                  Are you sure you want to delete{' '}
                  <Text style={styles.deleteWarningName}>
                    {selectedAnimal?.name}
                  </Text>
                  ? This action cannot be undone.
                </Text>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnSecondary} onPress={closeModal}>
                <Text style={styles.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnDanger} onPress={handleDelete}>
                <Icon name="trash-2" size={16} color="#fff" />
                <Text style={styles.btnDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#f7fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#315342',
  },
  header: {
    backgroundColor: '#315342',
    paddingBottom: 20,
    paddingTop: 50,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a4d9ab',
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6741',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  animalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animalPhotoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  animalPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  animalPhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#a0aec0',
    marginTop: 4,
  },
  animalInfo: {
    flex: 1,
  },
  animalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  animalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  animalDetails: {
    marginBottom: 16,
  },
  animalDetail: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  animalDetailLabel: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
    minWidth: 80,
  },
  animalDetailValue: {
    fontSize: 14,
    color: '#2d3748',
    flex: 1,
  },
  animalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#315342',
    marginLeft: 4,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fed7d7',
  },
  deleteButtonText: {
    color: '#e53e3e',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  modalBody: {
    padding: 20,
    maxHeight: height * 0.5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  btnSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 12,
  },
  btnSecondaryText: {
    color: '#4a5568',
    fontSize: 14,
    fontWeight: '600',
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#315342',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  btnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#e53e3e',
  },
  btnDangerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  photoSection: {
    marginBottom: 16,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  photoPreviewContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#e53e3e',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoUploadArea: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: '#f7fafc',
  },
  photoUploadText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 8,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  statusOptionSelected: {
    backgroundColor: '#315342',
    borderColor: '#315342',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusOptionTextSelected: {
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#e53e3e',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#315342',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2d3748',
  },
  searchIcon: {
    marginRight: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterButtonActive: {
    backgroundColor: '#315342',
    borderColor: '#315342',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#315342',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    color: '#fff',
  },
  // Detail Modal Styles
  detailPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2d3748',
    flex: 2,
    textAlign: 'right',
  },
  // Delete Modal Styles
  deleteWarning: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  deleteWarningText: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  deleteWarningName: {
    fontWeight: 'bold',
    color: '#e53e3e',
  },
  // Custom Drawer Styles
  modalContainer: {
    flex: 1,
    flexDirection: 'row-reverse',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: width * 0.8,
    backgroundColor: '#fff',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  // Status Option Active State
  statusOptionActive: {
    backgroundColor: '#315342',
    borderColor: '#315342',
  },
  statusOptionTextActive: {
    color: '#fff',
  },
  // Form Input Focus State
  formInputFocused: {
    borderColor: '#315342',
    borderWidth: 2,
  },
  // Loading States
  cardLoadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  // Responsive Design
  responsiveContainer: {
    paddingHorizontal: width > 768 ? 40 : 20,
  },
  responsiveModal: {
    width: width > 768 ? width * 0.7 : width * 0.9,
    maxWidth: 600,
  },
  // Animation Styles
  slideInContainer: {
    transform: [{ translateX: width }],
  },
  slideInContainerVisible: {
    transform: [{ translateX: 0 }],
  },
  fadeInContainer: {
    opacity: 0,
  },
  fadeInContainerVisible: {
    opacity: 1,
  },
  // Additional Status Colors
  statusHealthy: {
    backgroundColor: '#48bb78',
  },
  statusNeedsAttention: {
    backgroundColor: '#ed8936',
  },
  statusCritical: {
    backgroundColor: '#e53e3e',
  },
  statusRecovering: {
    backgroundColor: '#3182ce',
  },
  // Photo Upload Improvements
  photoUploadAreaActive: {
    borderColor: '#315342',
    backgroundColor: '#f0f9f0',
  },
  photoUploadIcon: {
    marginBottom: 8,
  },
  // Button Hover States (for web compatibility)
  buttonHover: {
    opacity: 0.8,
  },
  // Accessibility Improvements
  accessibilityFocus: {
    borderWidth: 2,
    borderColor: '#315342',
  },
  // Card Variations
  animalCardSelected: {
    borderColor: '#315342',
    borderWidth: 2,
  },
  animalCardDisabled: {
    opacity: 0.6,
  },
  // Text Variations
  textMuted: {
    color: '#718096',
  },
  textBold: {
    fontWeight: 'bold',
  },
  textCenter: {
    textAlign: 'center',
  },
  // Spacing Utilities
  marginTop8: {
    marginTop: 8,
  },
  marginTop16: {
    marginTop: 16,
  },
  marginBottom8: {
    marginBottom: 8,
  },
  marginBottom16: {
    marginBottom: 16,
  },
  paddingHorizontal16: {
    paddingHorizontal: 16,
  },
  paddingVertical8: {
    paddingVertical: 8,
  },
});

export default AnimalProfiles;