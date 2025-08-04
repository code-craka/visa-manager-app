import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { ListItem, useTheme } from 'react-native-elements';

const CommissionReportScreen = () => {
  const [tasks, setTasks] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    // Replace with your actual API endpoint
    fetch('http://localhost:3000/api/tasks')
      .then((response) => response.json())
      .then((data) => setTasks(data))
      .catch((error) => console.error(error));
  }, []);

  const renderItem = ({ item }) => (
    <ListItem bottomDivider containerStyle={{ backgroundColor: theme.colors.background }}>
      <ListItem.Content>
        <ListItem.Title style={{ color: theme.colors.text }}>Task ID: {item.id}</ListItem.Title>
        <ListItem.Subtitle style={{ color: theme.colors.text }}>Commission: ${item.commission}</ListItem.Subtitle>
        <ListItem.Subtitle style={{ color: theme.colors.text }}>Status: {item.payment_status}</ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );

  return (
    <View style={{ flex: 1, padding: theme.spacing.medium }}>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

export default CommissionReportScreen;