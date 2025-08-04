import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  TextInput,
  Button,
  Chip,
  Avatar,
  List,
  Portal,
  Modal,
  Surface,
  SegmentedButtons,
  Snackbar,
  Badge,
} from 'react-native-paper';
import { useApiService, Client, Task, User } from '../services/ApiService';
import { useRealtime } from '../context/RealtimeContext';
import { theme } from '../styles/theme';

interface Partner extends User {
  specialization?: string;
  rating?: number;
}

interface TaskAssignmentScreenProps {
  route?: {
    params?: {
      clientId?: number;
      taskId?: number;
    };
  };
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  notificationBanner: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationText: {
    color: '#fff',
    flex: 1,
  },
  notificationBadge: {
    backgroundColor: '#fff',
    color: theme.colors.primary,
  },
  modeSelector: {
    marginBottom: 24,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  priorityChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  priorityChipText: {
    fontSize: 12,
  },
  priorityChipTextSelected: {
    color: '#fff',
  },
  selectorCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  selectorButton: {
    marginBottom: 8,
  },
  selectedItemContainer: {
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginTop: 8,
  },
  selectedItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  selectedItemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  selectedTaskType: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  selectedTaskDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  taskMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  commissionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actionCard: {
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  assignButton: {
    backgroundColor: theme.colors.primary,
    marginBottom: 8,
  },
  resetButton: {
    borderColor: '#666',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  modalSurface: {
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.primary,
  },
  modalList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskItemRight: {
    alignItems: 'flex-end',
  },
  taskCommission: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginTop: 4,
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: 8,
  },
});

export default function TaskAssignmentScreen({ route, navigation }: TaskAssignmentScreenProps) {
  const { callApi, apiService } = useApiService();
  const { unreadCount } = useRealtime();

  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Form state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskType, setTaskType] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [commissionAmount, setCommissionAmount] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [deadline, setDeadline] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [partnerModalVisible, setPartnerModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [assignmentMode, setAssignmentMode] = useState<'new' | 'existing'>('new');

  const loadClients = useCallback(async () => {
    try {
      const clientsData = await callApi((token) =>
        apiService.getClients(token, 1, 50)
      );
      setClients(clientsData.clients || []);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  }, [callApi, apiService]);

  const loadPartners = useCallback(async () => {
    try {
      const partnersData = await callApi((token) =>
        apiService.getUsers(token, { role: 'partner' })
      );
      setPartners((partnersData as any).users || []);
    } catch (error) {
      console.error('Failed to load partners:', error);
    }
  }, [callApi, apiService]);

  const loadTasks = useCallback(async () => {
    try {
      const tasksData = await callApi((token) =>
        apiService.getTasks(token, { status: 'pending' })
      );
      setTasks(tasksData.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [callApi, apiService]);

  const loadSpecificClient = useCallback(async (clientId: string) => {
    try {
      const client = await callApi((token) =>
        apiService.getClient(parseInt(clientId, 10), token)
      );
      setSelectedClient(client);
    } catch (error) {
      console.error('Failed to load client:', error);
    }
  }, [callApi, apiService]);

  const loadSpecificTask = useCallback(async (taskId: string) => {
    try {
      const task = await callApi((token) =>
        apiService.getTask(parseInt(taskId, 10), token)
      );
      setSelectedTask(task);
    } catch (error) {
      console.error('Failed to load task:', error);
    }
  }, [callApi, apiService]);

  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([
        loadClients(),
        loadPartners(),
        loadTasks()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, [loadClients, loadPartners, loadTasks]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    
    // Handle route params
    if (route?.params) {
      if (route.params.clientId) {
        loadSpecificClient(route.params.clientId.toString());
      }
      if (route.params.taskId) {
        loadSpecificTask(route.params.taskId.toString());
        setAssignmentMode('existing');
      }
    }
  }, [route?.params, loadInitialData, loadSpecificClient, loadSpecificTask]);

  const resetForm = useCallback(() => {
    if (!route?.params?.clientId) {
      setSelectedClient(null);
    }
    if (!route?.params?.taskId) {
      setSelectedTask(null);
    }
    setSelectedPartner(null);
    setTaskType('');
    setTaskDescription('');
    setCommissionAmount('');
    setPriority('medium');
    setDeadline('');
  }, [route?.params]);

  const handleAssignment = useCallback(async () => {
    if (!selectedClient || !selectedPartner) {
      setSnackbarMessage('Please select both client and partner');
      setSnackbarVisible(true);
      return;
    }

    if (assignmentMode === 'existing' && !selectedTask) {
      setSnackbarMessage('Please select a task to assign');
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      if (assignmentMode === 'new') {
        // Create new task
        const taskData = {
          client_id: selectedClient.id,
          assigned_to: selectedPartner.id,
          task_type: taskType,
          description: taskDescription,
          commission: commissionAmount ? parseFloat(commissionAmount) : 0,
          due_date: deadline || undefined,
        };

        await callApi((token) => 
          apiService.createTask(taskData, token)
        );

        setSnackbarMessage('Task created and assigned successfully!');
      } else {
        // Assign existing task
        const assignmentData = {
          task_id: selectedTask!.id,
          assigned_to: selectedPartner.id,
          notes: `Assigned to ${selectedPartner.name} for client ${selectedClient.name}`,
        };

        await callApi((token) => 
          apiService.assignTask(token, assignmentData)
        );

        setSnackbarMessage('Task assigned successfully!');
      }
      
      setSnackbarVisible(true);
      
      // Reset form
      resetForm();
      
      // Navigate back after short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);

    } catch (error) {
      console.error('Failed to assign task:', error);
      setSnackbarMessage('Failed to assign task');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClient, selectedPartner, selectedTask, taskType, taskDescription, deadline, commissionAmount, assignmentMode, callApi, apiService, navigation, resetForm]);

  const getPriorityColors = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'urgent': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getVisaTypeIcon = (visaType: string) => {
    switch (visaType.toLowerCase()) {
      case 'tourist': return 'airplane';
      case 'business': return 'briefcase';
      case 'student': return 'school';
      case 'work': return 'office-building';
      default: return 'passport';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'in_progress': return '#2196f3';
      case 'completed': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Real-time notifications banner */}
      {unreadCount > 0 && (
        <Surface style={styles.notificationBanner}>
          <Text style={styles.notificationText}>
            You have new notifications
          </Text>
          <Badge style={styles.notificationBadge}>
            {unreadCount}
          </Badge>
        </Surface>
      )}

      <Title style={styles.screenTitle}>Task Assignment</Title>
      <Paragraph style={styles.screenSubtitle}>
        {assignmentMode === 'new' ? 'Create and assign a new task' : 'Assign existing task to partner'}
      </Paragraph>

      {/* Assignment Mode Selector */}
      <SegmentedButtons
        value={assignmentMode}
        onValueChange={(value) => setAssignmentMode(value as 'new' | 'existing')}
        buttons={[
          { value: 'new', label: 'New Task' },
          { value: 'existing', label: 'Existing Task' },
        ]}
        style={styles.modeSelector}
      />

      {/* Client Selection */}
      <Card style={styles.selectorCard}>
        <Card.Content>
          <Title>Client</Title>
          <Button
            mode="outlined"
            onPress={() => setClientModalVisible(true)}
            style={styles.selectorButton}
          >
            {selectedClient ? `Selected: ${selectedClient.name}` : 'Select Client'}
          </Button>
          {selectedClient && (
            <View style={styles.selectedItemContainer}>
              <Text style={styles.selectedItemTitle}>{selectedClient.name}</Text>
              <Text style={styles.selectedItemDescription}>
                {selectedClient.visa_type} • {selectedClient.passport}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Partner Selection */}
      <Card style={styles.selectorCard}>
        <Card.Content>
          <Title>Partner</Title>
          <Button
            mode="outlined"
            onPress={() => setPartnerModalVisible(true)}
            style={styles.selectorButton}
          >
            {selectedPartner ? `Selected: ${selectedPartner.name}` : 'Select Partner'}
          </Button>
          {selectedPartner && (
            <View style={styles.selectedItemContainer}>
              <Text style={styles.selectedItemTitle}>{selectedPartner.name}</Text>
              <Text style={styles.selectedItemDescription}>
                {selectedPartner.email}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Task Details (for new tasks) */}
      {assignmentMode === 'new' && (
        <Card style={styles.selectorCard}>
          <Card.Content>
            <Title>Task Details</Title>
            <View style={styles.formContainer}>
              <TextInput
                label="Task Type"
                value={taskType}
                onChangeText={setTaskType}
                style={styles.input}
                placeholder="e.g., Visa Application, Document Review"
              />
              
              <TextInput
                label="Description"
                value={taskDescription}
                onChangeText={setTaskDescription}
                style={styles.input}
                multiline
                numberOfLines={3}
                placeholder="Task description and requirements"
              />

              <View style={styles.priorityContainer}>
                <Text>Priority Level</Text>
                <View style={styles.priorityRow}>
                  {(['low', 'medium', 'high', 'urgent'] as const).map((level) => (
                    <Chip
                      key={level}
                      selected={priority === level}
                      onPress={() => setPriority(level)}
                      style={[
                        styles.priorityChip,
                        priority === level && { backgroundColor: getPriorityColors(level) }
                      ]}
                      textStyle={[
                        styles.priorityChipText,
                        priority === level 
                          ? styles.priorityChipTextSelected
                          : { color: getPriorityColors(level) }
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>

              <TextInput
                label="Commission Amount"
                value={commissionAmount}
                onChangeText={setCommissionAmount}
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.00"
                left={<TextInput.Affix text="$" />}
              />

              <TextInput
                label="Deadline (Optional)"
                value={deadline}
                onChangeText={setDeadline}
                style={styles.input}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Task Selection (for existing tasks) */}
      {assignmentMode === 'existing' && (
        <Card style={styles.selectorCard}>
          <Card.Content>
            <Title>Task</Title>
            <Button
              mode="outlined"
              onPress={() => setTaskModalVisible(true)}
              style={styles.selectorButton}
            >
              {selectedTask ? `Selected: ${selectedTask.task_type}` : 'Select Task'}
            </Button>
            {selectedTask && (
              <View style={styles.selectedItemContainer}>
                <Text style={styles.selectedTaskType}>{selectedTask.task_type}</Text>
                <Text style={styles.selectedTaskDescription}>{selectedTask.description || 'No description'}</Text>
                <View style={styles.taskMetaContainer}>
                  <Chip 
                    mode="outlined" 
                    style={{
                      borderColor: getStatusColor(selectedTask.status)
                    }}
                  >
                    {selectedTask.status}
                  </Chip>
                  {selectedTask.commission && (
                    <Text style={styles.commissionText}>
                      Commission: ${selectedTask.commission}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <Card style={styles.actionCard}>
        <Card.Content>
          <Button
            mode="contained"
            onPress={handleAssignment}
            loading={isLoading}
            disabled={!selectedClient || !selectedPartner || (assignmentMode === 'existing' && !selectedTask)}
            style={styles.assignButton}
          >
            {assignmentMode === 'new' ? 'Create & Assign Task' : 'Assign Task'}
          </Button>
          <Button
            mode="outlined"
            onPress={resetForm}
            style={styles.resetButton}
          >
            Reset Form
          </Button>
        </Card.Content>
      </Card>

      {/* Client Selection Modal */}
      <Portal>
        <Modal
          visible={clientModalVisible}
          onDismiss={() => setClientModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <Title style={styles.modalTitle}>Select Client</Title>
            <ScrollView style={styles.modalList}>
              {clients.map((client) => (
                <List.Item
                  key={client.id}
                  title={client.name}
                  description={`${client.visa_type} • ${client.passport}`}
                  left={(props) => (
                    <Avatar.Icon 
                      {...props} 
                      icon={getVisaTypeIcon(client.visa_type)}
                      size={40}
                    />
                  )}
                  onPress={() => {
                    setSelectedClient(client);
                    setClientModalVisible(false);
                  }}
                  style={styles.listItem}
                />
              ))}
            </ScrollView>
            <Button 
              mode="outlined" 
              onPress={() => setClientModalVisible(false)}
              style={styles.closeButton}
            >
              Close
            </Button>
          </Surface>
        </Modal>
      </Portal>

      {/* Partner Selection Modal */}
      <Portal>
        <Modal
          visible={partnerModalVisible}
          onDismiss={() => setPartnerModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <Title style={styles.modalTitle}>Select Partner</Title>
            <ScrollView style={styles.modalList}>
              {partners.map((partner) => (
                <List.Item
                  key={partner.id}
                  title={partner.name}
                  description={partner.email}
                  left={(props) => (
                    <Avatar.Text 
                      {...props} 
                      label={partner.name.charAt(0)}
                      size={40}
                    />
                  )}
                  onPress={() => {
                    setSelectedPartner(partner);
                    setPartnerModalVisible(false);
                  }}
                  style={styles.listItem}
                />
              ))}
            </ScrollView>
            <Button 
              mode="outlined" 
              onPress={() => setPartnerModalVisible(false)}
              style={styles.closeButton}
            >
              Close
            </Button>
          </Surface>
        </Modal>
      </Portal>

      {/* Task Selection Modal */}
      <Portal>
        <Modal
          visible={taskModalVisible}
          onDismiss={() => setTaskModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <Title style={styles.modalTitle}>Select Task</Title>
            <ScrollView style={styles.modalList}>
              {tasks.map((task) => (
                <List.Item
                  key={task.id}
                  title={task.task_type}
                  description={task.description || 'No description'}
                  right={(_props) => (
                    <View style={styles.taskItemRight}>
                      <Chip
                        mode="outlined"
                        compact
                        style={{
                          borderColor: getStatusColor(task.status)
                        }}
                      >
                        {task.status}
                      </Chip>
                      {task.commission && (
                        <Text style={styles.taskCommission}>
                          ${task.commission}
                        </Text>
                      )}
                    </View>
                  )}
                  onPress={() => {
                    setSelectedTask(task);
                    setTaskModalVisible(false);
                  }}
                  style={styles.listItem}
                />
              ))}
            </ScrollView>
            <Button 
              mode="outlined" 
              onPress={() => setTaskModalVisible(false)}
              style={styles.closeButton}
            >
              Close
            </Button>
          </Surface>
        </Modal>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}
