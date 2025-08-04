import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { ListItem, Button, useTheme } from 'react-native-elements';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const { theme } = useTheme();

  // Dummy user ID for now, replace with actual user ID from authentication
  const userId = 1; 

  const fetchNotifications = () => {
    fetch(`http://localhost:3000/api/notifications/${userId}`)
      .then((response) => response.json())
      .then((data) => setNotifications(data))
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

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

  const renderItem = ({ item }) => (
    <ListItem bottomDivider containerStyle={{ backgroundColor: theme.colors.background }}>
      <ListItem.Content>
        <ListItem.Title style={{ color: theme.colors.text }}>{item.message}</ListItem.Title>
        <ListItem.Subtitle style={{ color: theme.colors.text }}>{item.is_read ? 'Read' : 'Unread'}</ListItem.Subtitle>
        {!item.is_read && (
          <Button title='Mark as Read' onPress={() => markAsRead(item.id)} buttonStyle={{ backgroundColor: theme.colors.primary }} />
        )}
      </ListItem.Content>
    </ListItem>
  );

  return (
    <View style={{ flex: 1, padding: theme.spacing.medium }}>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

export default NotificationScreen;