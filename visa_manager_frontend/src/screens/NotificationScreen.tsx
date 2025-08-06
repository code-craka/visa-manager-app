import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

interface Notification {
  id: number;
  message: string;
  is_read: boolean;
}

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  const fetchNotifications = () => {
    if (!user) return;
    
    fetch(`http://localhost:3000/api/notifications/${user.id}`)
      .then((response) => response.json())
      .then((data) => setNotifications(data))
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = (notificationId: number) => {
    fetch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
      .then((response) => response.json())
      .then(() => {
        // Refresh notifications after marking as read
        fetchNotifications();
      })
      .catch((error) => console.error(error));
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={styles.listItem}>
      <Text style={styles.title}>{item.message}</Text>
      <Text style={styles.subtitle}>{item.is_read ? 'Read' : 'Unread'}</Text>
      {!item.is_read && (
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => markAsRead(item.id)}
        >
          <Text style={styles.buttonText}>Mark as Read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default NotificationScreen;