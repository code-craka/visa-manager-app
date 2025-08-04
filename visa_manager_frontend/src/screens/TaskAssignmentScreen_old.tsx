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
  IconButton,
  ActivityIndicator,
  Snackbar,
  Badge,
  Provider as PaperProvider,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
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

const TaskAssignmentScreen: React.FC<TaskAssignmentScreenProps> = ({ route, navigation }) => {
  const { user } = useAuth();
  const { callApi, apiService } = useApiService();
  const { notifications } = useRealtime();
  
  // State management
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
  const [assignmentMode, setAssignmentMode] = useState('new');

  // Load data on mount
  useEffect(() => {
    loadInitialData();
    
    // Pre-select client if provided via route params
    if (route?.params?.clientId) {
      loadSpecificClient(route.params.clientId);
    }
    
    if (route?.params?.taskId) {
      loadSpecificTask(route.params.taskId);
      setAssignmentMode('existing');
    }
  }, [route?.params]);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadClients(),
        loadPartners(),
        loadTasks()
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setSnackbarMessage('Failed to load data');
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      const clientsData = await callApi((token) => 
        apiService.getClients(token)
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
      setPartners(partnersData.users || []);
    } catch (error) {
      console.error('Failed to load partners:', error);
    }
  }, [callApi, apiService]);

  const loadTasks = useCallback(async () => {
    try {
      const tasksData = await callApi((token) => 
        apiService.getTasks(token, { status: 'unassigned' })
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

  const loadSpecificTask = useCallback(async (taskId: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
      } else {
        // Load from API if not in current list
        const taskData = await callApi((token) => 
          apiService.getTask(token, taskId)
        );
        setSelectedTask(taskData);
      }
    } catch (error) {
      console.error('Failed to load specific task:', error);
    }
  }, [tasks, callApi, apiService]);

  const handleAssignment = useCallback(async () => {
    if (!selectedClient || !selectedPartner) {
      setSnackbarMessage('Please select both client and partner');
      setSnackbarVisible(true);
      return;
    }

    if (assignmentMode === 'new' && (!taskType || !taskDescription)) {
      setSnackbarMessage('Please fill in task type and description');
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
  }, [selectedClient, selectedPartner, selectedTask, taskType, taskDescription, priority, deadline, commissionAmount, assignmentMode, callApi, apiService, navigation]);

  const resetForm = () => {
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
  };

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
      case 'work': return 'briefcase-variant';
      case 'family': return 'account-group';
      default: return 'passport';
    }
  };

  const renderClientSelector = () => (
    <Card style={styles.selectorCard}>
      <Card.Content>
        <Title style={styles.selectorTitle}>Client</Title>
        {selectedClient ? (
          <Surface style={styles.selectedItem}>
            <View style={styles.selectedItemContent}>
              <Avatar.Icon 
                size={40} 
                icon={getVisaTypeIcon(selectedClient.visa_type)}
                style={styles.selectedItemAvatar}
              />
              <View style={styles.selectedItemDetails}>
                <Text style={styles.selectedItemName}>{selectedClient.name}</Text>
                <Text style={styles.selectedItemInfo}>
                                  <Text style={styles.selectedClientDescription}>
                  {selectedClient.visa_type} • {selectedClient.passport}
                </Text>
                </Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setSelectedClient(null)}
              />
            </View>
          </Surface>
        ) : (
          <Button
            mode="outlined"
            onPress={() => setClientModalVisible(true)}
            icon="account-plus"
            style={styles.selectorButton}
          >
            Select Client
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  const renderPartnerSelector = () => (
    <Card style={styles.selectorCard}>
      <Card.Content>
        <Title style={styles.selectorTitle}>Partner</Title>
        {selectedPartner ? (
          <Surface style={styles.selectedItem}>
            <View style={styles.selectedItemContent}>
              <Avatar.Text 
                size={40} 
                label={selectedPartner.name.charAt(0)}
                style={styles.selectedItemAvatar}
              />
              <View style={styles.selectedItemDetails}>
                <Text style={styles.selectedItemName}>{selectedPartner.name}</Text>
                <Text style={styles.selectedItemInfo}>
                  {selectedPartner.specialization} • ⭐ {selectedPartner.rating || 'N/A'}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setSelectedPartner(null)}
              />
            </View>
          </Surface>
        ) : (
          <Button
            mode="outlined"
            onPress={() => setPartnerModalVisible(true)}
            icon="account-group"
            style={styles.selectorButton}
          >
            Select Partner
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  const renderTaskModeSelector = () => (
    <Card style={styles.selectorCard}>
      <Card.Content>
        <Title style={styles.selectorTitle}>Assignment Mode</Title>
        <SegmentedButtons
          value={assignmentMode}
          onValueChange={setAssignmentMode}
          buttons={[
            {
              value: 'new',
              label: 'Create New Task',
              icon: 'plus-circle-outline',
            },
            {
              value: 'existing',
              label: 'Assign Existing',
              icon: 'clipboard-text-outline',
            },
          ]}
          style={styles.segmentedButtons}
        />
      </Card.Content>
    </Card>
  );

  const renderNewTaskForm = () => (
    <Card style={styles.formCard}>
      <Card.Content>
        <Title style={styles.formTitle}>New Task Details</Title>
        
        <TextInput
          label="Task Type"
          value={taskType}
          onChangeText={setTaskType}
          style={styles.input}
          mode="outlined"
          placeholder="e.g., Document Review, Interview Preparation"
        />
        
        <TextInput
          label="Task Description"
          value={taskDescription}
          onChangeText={setTaskDescription}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
          placeholder="Describe the task requirements..."
        />
        
        <View style={styles.priorityContainer}>
          <Text style={styles.priorityLabel}>Priority Level</Text>
          <View style={styles.priorityChips}>
            {['low', 'medium', 'high', 'urgent'].map((level) => (
              <Chip
                key={level}
                mode={priority === level ? 'flat' : 'outlined'}
                selected={priority === level}
                onPress={() => setPriority(level as any)}
                style={[
                  styles.priorityChip,
                  priority === level && { backgroundColor: getPriorityColors(level) }
                ]}
                textStyle={[
                  styles.priorityChipText,
                  { color: priority === level ? '#fff' : getPriorityColors(level) }
                ]}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Chip>
            ))}
          </View>
        </View>
        
        <TextInput
          label="Commission Amount (Optional)"
          value={commissionAmount}
          onChangeText={setCommissionAmount}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
          placeholder="0.00"
          left={<TextInput.Icon icon="currency-usd" />}
        />
        
        <TextInput
          label="Deadline (Optional)"
          value={deadline}
          onChangeText={setDeadline}
          style={styles.input}
          mode="outlined"
          placeholder="YYYY-MM-DD"
          left={<TextInput.Icon icon="calendar" />}
        />
      </Card.Content>
    </Card>
  );

  const renderExistingTaskSelector = () => (
    <Card style={styles.selectorCard}>
      <Card.Content>
        <Title style={styles.selectorTitle}>Select Task</Title>
        {selectedTask ? (
          <Surface style={styles.selectedTask}>
            <View style={styles.selectedTaskContent}>
              <View style={styles.selectedTaskDetails}>
                <Text style={styles.selectedTaskType}>{selectedTask.type}</Text>
                <Text style={styles.selectedTaskDescription}>
                  {selectedTask.description}
                </Text>
                <View style={styles.selectedTaskMeta}>
                  <Chip
                    mode="outlined"
                    compact
                    style={{
                      borderColor: getPriorityColor(selectedTask.priority)
                    }}
                  >
                    {selectedTask.priority}
                  </Chip>
                  {selectedTask.commission_amount && (
                    <Text style={styles.commissionText}>
                      ${selectedTask.commission_amount}
                    </Text>
                  )}
                </View>
              </View>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setSelectedTask(null)}
              />
            </View>
          </Surface>
        ) : (
          <Button
            mode="outlined"
            onPress={() => setTaskModalVisible(true)}
            icon="clipboard-text"
            style={styles.selectorButton}
          >
            Select Task
          </Button>
        )}
      </Card.Content>
    </Card>
  );

  if (isLoading && clients.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading assignment data...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        
        {/* Real-time notifications indicator */}
        {notifications.length > 0 && (
          <Surface style={styles.notificationBanner}>
            <Text style={styles.notificationText}>
              {notifications.length} new notification(s)
            </Text>
            <Badge style={styles.notificationBadge}>
              {notifications.length}
            </Badge>
          </Surface>
        )}

        <Title style={styles.screenTitle}>Task Assignment</Title>
        <Paragraph style={styles.screenSubtitle}>
          Assign tasks to partners for efficient visa processing
        </Paragraph>

        {renderClientSelector()}
        {renderPartnerSelector()}
        {renderTaskModeSelector()}

        {assignmentMode === 'new' ? renderNewTaskForm() : renderExistingTaskSelector()}

        <Card style={styles.actionCard}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleAssignment}
              loading={isLoading}
              disabled={!selectedClient || !selectedPartner || (assignmentMode === 'new' && (!taskType || !taskDescription)) || (assignmentMode === 'existing' && !selectedTask)}
              style={styles.assignButton}
              icon="check-circle"
            >
              {assignmentMode === 'new' ? 'Create & Assign Task' : 'Assign Task'}
            </Button>
            
            <Button
              mode="outlined"
              onPress={resetForm}
              style={styles.resetButton}
              icon="refresh"
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
                    description={`${client.visa_type} • ${client.email}`}
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
              <Button onPress={() => setClientModalVisible(false)}>
                Cancel
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
                    description={`${partner.specialization} • ⭐ ${partner.rating || 'N/A'}`}
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
              <Button onPress={() => setPartnerModalVisible(false)}>
                Cancel
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
                    title={task.type}
                    description={task.description}
                    right={(props) => (
                      <View style={styles.taskItemRight}>
                        <Chip
                          mode="outlined"
                          compact
                          style={{
                            borderColor: getPriorityColor(task.priority)
                          }}
                        >
                          {task.priority}
                        </Chip>
                        {task.commission_amount && (
                          <Text style={styles.taskCommission}>
                            ${task.commission_amount}
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
              <Button onPress={() => setTaskModalVisible(false)}>
                Cancel
              </Button>
            </Surface>
          </Modal>
        </Portal>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </ScrollView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  notificationBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    elevation: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  notificationBadge: {
    backgroundColor: '#1976D2',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  screenSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  selectorCard: {
    marginBottom: 16,
    elevation: 2,
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  selectorButton: {
    marginTop: 8,
  },
  selectedItem: {
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  selectedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedItemAvatar: {
    marginRight: 12,
  },
  selectedItemDetails: {
    flex: 1,
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  selectedItemInfo: {
    fontSize: 14,
    color: '#666',
  },
  segmentedButtons: {
    marginTop: 8,
  },
  formCard: {
    marginBottom: 16,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    marginBottom: 12,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  priorityChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  priorityChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTask: {
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  selectedTaskContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selectedTaskDetails: {
    flex: 1,
  },
  selectedTaskType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  selectedTaskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  selectedTaskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commissionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  actionCard: {
    marginTop: 8,
    elevation: 2,
  },
  assignButton: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  resetButton: {
    marginTop: 8,
  },
  modalContainer: {
    margin: 20,
  },
  modalSurface: {
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
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
});

export default TaskAssignmentScreen;