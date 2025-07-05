import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Modal,
  Animated,
  StatusBar,
  Platform,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import CustomDrawer from './CustomDrawer';

const { width, height } = Dimensions.get('window');

const getStatusBarHeight = () => {
  return Platform.OS === 'ios' ? (height >= 812 ? 44 : 20) : StatusBar.currentHeight || 24;
};

const Home = ({ navigation }) => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Sample data
  const featuredItems = [
    { id: '1', title: 'Premium Course', description: 'Learn advanced techniques', price: '$49.99', image: require('../assets/default-profile.png'), rating: 4.8 },
    { id: '2', title: 'Beginner Workshop', description: 'Perfect for getting started', price: '$29.99', image: require('../assets/default-profile.png'), rating: 4.5 },
    { id: '3', title: 'Master Class', description: 'Become a pro in 30 days', price: '$79.99', image: require('../assets/default-profile.png'), rating: 4.9 }
  ];

  const categories = [
    { id: '1', name: 'Development', icon: 'code' },
    { id: '2', name: 'Design', icon: 'brush' },
    { id: '3', name: 'Business', icon: 'briefcase' },
    { id: '4', name: 'Marketing', icon: 'megaphone' },
    { id: '5', name: 'Photography', icon: 'camera' },
    { id: '6', name: 'Music', icon: 'musical-notes' }
  ];

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

  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.featuredItem}
      onPress={() => navigation.navigate('CourseDetail', { item })}
      activeOpacity={0.8}
    >
      <Image source={item.image} style={styles.featuredImage} />
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredTitle}>{item.title}</Text>
        <Text style={styles.featuredDescription}>{item.description}</Text>
        <View style={styles.featuredFooter}>
          <Text style={styles.featuredPrice}>{item.price}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => navigation.navigate('Category', { category: item.name })}
      activeOpacity={0.8}
    >
      <View style={styles.categoryIconContainer}>
        <Ionicons name={item.icon} size={24} color="#a4d9ab" />
      </View>
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#315342" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={['#315342', '#1e3a2a']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
                <Ionicons name="menu" size={28} color="#a4d9ab" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.headerButton}>
                <Ionicons name="search" size={28} color="#a4d9ab" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Welcome back, User!</Text>
            <Text style={styles.headerSubtitle}>What would you like to learn today?</Text>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Featured Courses */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Courses</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Featured')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={featuredItems}
              renderItem={renderFeaturedItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={item => item.id}
              numColumns={3}
              columnWrapperStyle={styles.categoryRow}
              scrollEnabled={false}
            />
          </View>

          {/* Popular Instructors */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Instructors</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Instructors')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.instructorsContainer}>
              {[1, 2, 3].map((item) => (
                <TouchableOpacity 
                  key={item} 
                  style={styles.instructorCard}
                  onPress={() => navigation.navigate('Instructor')}
                  activeOpacity={0.8}
                >
                  <Image 
                    source={require('../assets/default-profile.png')} 
                    style={styles.instructorImage} 
                  />
                  <Text style={styles.instructorName}>Dr. Sarah Johnson</Text>
                  <Text style={styles.instructorField}>Computer Science</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>4.9</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Special Offer */}
          <TouchableOpacity 
            style={styles.specialOffer}
            onPress={() => navigation.navigate('SpecialOffer')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#315342', '#1e3a2a']}
              style={styles.specialOfferGradient}
            >
              <View style={styles.specialOfferContent}>
                <View>
                  <Text style={styles.specialOfferTitle}>Special Offer!</Text>
                  <Text style={styles.specialOfferText}>Get 50% off on all courses</Text>
                </View>
                <Ionicons name="gift" size={40} color="#a4d9ab" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingBottom: 30,
    paddingTop: getStatusBarHeight(),
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(164, 217, 171, 0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#315342',
  },
  seeAll: {
    color: '#315342',
    fontWeight: '600',
  },
  featuredList: {
    paddingBottom: 10,
  },
  featuredItem: {
    width: width * 0.7,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  featuredInfo: {
    padding: 15,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#315342',
  },
  featuredDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#315342',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 5,
    color: '#666',
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(49, 83, 66, 0.1)',
    borderWidth: 1,
    borderColor: '#a4d9ab',
  },
  categoryText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#315342',
  },
  instructorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  instructorCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  instructorName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  instructorField: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  specialOffer: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 10,
  },
  specialOfferGradient: {
    padding: 20,
  },
  specialOfferContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specialOfferTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  specialOfferText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerContainer: {
    width: width * 0.8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default Home;