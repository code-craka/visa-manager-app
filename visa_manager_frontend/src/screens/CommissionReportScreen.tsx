import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

interface Task {
  id: number;
  commission: number;
  payment_status: string;
}

const CommissionReportScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Replace with your actual API endpoint
    fetch('http://localhost:3000/api/tasks')
      .then((response) => response.json())
      .then((data) => setTasks(data))
      .catch((error) => console.error(error));
  }, []);

  const renderItem = ({ item }: { item: Task }) => (
    <View style={styles.listItem}>
      <Text style={styles.title}>Task ID: {item.id}</Text>
      <Text style={styles.subtitle}>Commission: ${item.commission}</Text>
      <Text style={styles.subtitle}>Status: {item.payment_status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
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
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
});

export default CommissionReportScreen;