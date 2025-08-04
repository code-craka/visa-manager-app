import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { ListItem, useTheme } from 'react-native-elements';

const ClientListScreen = () => {
  const [clients, setClients] = useState([]);
  const { theme } = useTheme();

  useEffect(() => {
    // Replace with your actual API endpoint
    fetch('http://localhost:3000/api/clients')
      .then((response) => response.json())
      .then((data) => setClients(data))
      .catch((error) => console.error(error));
  }, []);

  const renderItem = ({ item }) => (
    <ListItem bottomDivider containerStyle={{ backgroundColor: theme.colors.background }}>
      <ListItem.Content>
        <ListItem.Title style={{ color: theme.colors.text }}>{item.name}</ListItem.Title>
        <ListItem.Subtitle style={{ color: theme.colors.text }}>{item.visaType}</ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );

  return (
    <View style={{ flex: 1, padding: theme.spacing.medium }}>
      <FlatList
        data={clients}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

export default ClientListScreen;