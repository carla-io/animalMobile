import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { showToast } from '../../utils/toast';
import API_BASE_URL from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Simplified InputField component with no focus styling changes
const InputField = React.memo(({
  name,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  isPassword = false,
  showPassword = false,
  onTogglePassword
}) => {
  return (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color="#a4d9ab" style={styles.inputIcon} />
      <TextInput
        style={[styles.input, isPassword && styles.passwordInput]}
        placeholder={placeholder}
        placeholderTextColor="#a0a0a0"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {isPassword && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={onTogglePassword}
        >
          <Ionicons 
            name={showPassword ? "eye-off-outline" : "eye-outline"} 
            size={20} 
            color="#a4d9ab" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
});

const Register = ({ navigation }) => {
  // User Information
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // vet Information

  const [isVet, setIsVet] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('error', 'Permission Denied', 'Sorry, we need camera roll permissions to select an image');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const manipulatedImage = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 500, height: 500 } }],
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      setProfilePhoto(manipulatedImage);
    }
  };

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      showToast('error', 'Error', 'Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      showToast('error', 'Error', "Passwords don't match!");
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      showToast('error', 'Error', 'Please enter a valid email address');
      return false;
    }

    

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const formData = new FormData();
      
      formData.append('name', name);
      formData.append('email', email.toLowerCase());
      formData.append('password', password);
      
      if (isVet) {
        formData.append('userType', 'vet');
        formData.append('licenseNumber', licenseNumber);
      } else {
        formData.append('userType', 'user');
      }
      
      if (profilePhoto) {
        formData.append('profilePhoto', {
          uri: profilePhoto.uri,
          type: 'image/jpeg',
          name: 'profile.jpg'
        });
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      await AsyncStorage.multiSet([
        ['userToken', data.token],
        ['userData', JSON.stringify(data.user)]
      ]);

      showToast('success', 'Success', 'Account created successfully!');
      navigation.replace('Home');

    } catch (error) {
      console.error('Registration error:', error);
      showToast('error', 'Registration Failed', error.message || 'Could not register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Memoized toggle functions
  const toggleShowPassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#315342', '#1e3a2a']}
        style={styles.gradientContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
              <Image 
                source={profilePhoto ? { uri: profilePhoto.uri } : require('../../assets/default-profile.png')}
                style={styles.profileImage}
              />
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            
            <Text style={styles.welcomeText}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and start your journey</Text>
          </View>
          
          {/* Form Section */}
          <View style={styles.formContainer}>
            {/* Personal Information */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={18} color="#a4d9ab" /> Personal Information
              </Text>
              
              <InputField
                name="name"
                icon="person-outline"
                placeholder="Full Name *"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              
              <InputField
                name="email"
                icon="mail-outline"
                placeholder="Email Address *"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <InputField
                name="password"
                icon="lock-closed-outline"
                placeholder="Password *"
                value={password}
                onChangeText={setPassword}
                isPassword={true}
                secureTextEntry={!showPassword}
                showPassword={showPassword}
                onTogglePassword={toggleShowPassword}
              />
              
              <InputField
                name="confirmPassword"
                icon="lock-closed-outline"
                placeholder="Confirm Password *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword={true}
                secureTextEntry={!showConfirmPassword}
                showPassword={showConfirmPassword}
                onTogglePassword={toggleShowConfirmPassword}
              />
            </View>

            <View style={styles.checkboxContainer}>
          <TouchableOpacity onPress={() => setIsVet(!isVet)} style={styles.checkbox}>
            <Ionicons
              name={isVet ? 'checkbox-outline' : 'square-outline'}
              size={24}
              color="#315342"
            />
            <Text style={styles.checkboxLabel}>I'm a licensed veterinarian</Text>
          </TouchableOpacity>

          {isVet && (
            <InputField
              name="licenseNumber"
              icon="document-text-outline"
              placeholder="Veterinarian License ID *"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />
          )}
        </View>


            <TouchableOpacity
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#315342', '#1e3a2a']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>Create Account</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#315342',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 30,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minHeight: 55,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 45,
    color: '#333',
    fontSize: 16,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  registerButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    height: 56,
    shadowColor: '#315342',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#666',
    fontSize: 15,
  },
  loginText: {
    color: '#315342',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default Register;