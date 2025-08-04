import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Input, Button, useTheme } from 'react-native-elements';

const TaskAssignmentScreen = () => {
  const [clients, setClients] = useState([]);
  const [partners, setPartners] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [taskType, setTaskType] = useState('');
  const [commission, setCommission] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    // Fetch clients and partners for dropdowns
    // Replace with your actual API endpoints
    fetch('http://localhost:3000/api/clients')
      .then((response) => response.json())
      .then((data) => setClients(data))
      .catch((error) => console.error(error));

    fetch('http://localhost:3000/api/users') // Assuming you have a users endpoint
      .then((response) => response.json())
      .then((data) => setPartners(data))
      .catch((error) => console.error(error));
  }, []);

  const handleAssignment = () => {
    // Handle task assignment logic here
    console.log({ selectedClient, selectedPartner, taskType, commission });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.medium }}>
      {/* Replace with dropdown components */}
      <Input
        placeholder='Select Client'
        value={selectedClient}
        onChangeText={setSelectedClient}
      />
      <Input
        placeholder='Select Partner'
        value={selectedPartner}
        onChangeText={setSelectedPartner}
      />
      <Input
        placeholder='Task Type'
        value={taskType}
        onChangeText={setTaskType}
      />
      <Input
        placeholder='Commission'
        value={commission}
        onChangeText={setCommission}
        keyboardType='numeric'
      />
      <Button title='Assign Task' onPress={handleAssignment} buttonStyle={{ backgroundColor: theme.colors.primary }} />
    </View>
  );
};

export default TaskAssignmentScreen;