# ClientSelectionModal Component

A reusable modal component for selecting clients during task assignment workflows.

## Features

- **Search Functionality**: Debounced search with 300ms delay
- **Status Filtering**: Filter clients by their current status
- **Visual Indicators**: Status chips and visa type icons
- **Client Information Display**: Shows name, email, phone, visa type, and status
- **Empty States**: Handles no results and loading states
- **Error Handling**: Graceful error handling with retry functionality
- **Responsive Design**: Material Design components with proper theming

## Props

```typescript
interface ClientSelectionModalProps {
  visible: boolean;                    // Controls modal visibility
  onClose: () => void;                // Called when modal is closed
  onSelect: (client: Client) => void; // Called when client is selected
  excludeIds?: number[];              // Client IDs to exclude from selection
  title?: string;                     // Custom modal title
  subtitle?: string;                  // Custom modal subtitle
}
```

## Usage

### Basic Usage

```typescript
import ClientSelectionModal from '../components/ClientSelectionModal';

const MyComponent = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleClientSelect = (client: Client) => {
    console.log('Selected client:', client);
    setModalVisible(false);
  };

  return (
    <>
      <Button onPress={() => setModalVisible(true)}>
        Select Client
      </Button>
      
      <ClientSelectionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleClientSelect}
      />
    </>
  );
};
```

### Advanced Usage with Custom Props

```typescript
<ClientSelectionModal
  visible={modalVisible}
  onClose={() => setModalVisible(false)}
  onSelect={handleClientSelect}
  excludeIds={[1, 2, 3]} // Exclude specific clients
  title="Select Client for Task Assignment"
  subtitle="Choose a client to assign this task to"
/>
```

## Integration with Task Assignment

The component is designed to integrate seamlessly with the TaskAssignmentScreen:

```typescript
// In TaskAssignmentScreen.tsx
<ClientSelectionModal
  visible={clientModalVisible}
  onClose={() => setClientModalVisible(false)}
  onSelect={(client) => {
    setSelectedClient(client);
    setClientModalVisible(false);
  }}
  title="Select Client for Task Assignment"
  subtitle="Choose a client to assign this task to"
/>
```

## Requirements Fulfilled

This component fulfills the following requirements from the spec:

- **5.1**: Visual indicators for client selection with status and visa type display
- **5.2**: Client selection highlighting and continue button enabling
- **5.3**: Client information passed to task creation workflow
- **5.4**: Visa type icons and current status for easy identification
- **5.5**: Appropriate empty state handling and client creation options

## API Integration

The component uses the `ApiService.getClients()` method to fetch client data with the following filters:

- `limit: 100` - Loads more clients for selection
- `sortBy: 'name'` - Sorts clients alphabetically
- `sortOrder: 'asc'` - Ascending order

Excluded clients are filtered out client-side after the API response.

## Testing

The component includes comprehensive tests covering:

- Rendering and visibility states
- Client loading and API integration
- Search and filtering functionality
- Client selection and confirmation
- Error handling and empty states
- Modal state management

Run tests with:
```bash
npm test -- --testPathPattern=ClientSelectionModal.test.tsx
```

## Styling

The component follows the established Material Design theme with:

- Primary color: Electric Violet (#8D05D4)
- Consistent spacing and typography
- Status-specific color coding
- Visa type icon mapping
- Responsive layout for different screen sizes

## Performance Considerations

- **Debounced Search**: 300ms delay to reduce API calls
- **Memoized Callbacks**: Optimized re-rendering with useCallback
- **Efficient Filtering**: Client-side filtering for better performance
- **Lazy Loading**: Only loads clients when modal becomes visible