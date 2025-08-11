import React from 'react';
import { Platform } from 'react-native';
import { Modal as PaperModal, Portal } from 'react-native-paper';

interface ModalProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  contentContainerStyle?: any;
  dismissable?: boolean;
}

const Modal: React.FC<ModalProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebModal {...props} />;
  }
  return <NativeModal {...props} />;
};

const WebModal: React.FC<ModalProps> = ({
  visible,
  onDismiss,
  children,
  contentContainerStyle,
  dismissable = true
}) => (
  <Portal>
    <PaperModal
      visible={visible}
      onDismiss={dismissable ? onDismiss : undefined}
      contentContainerStyle={[
        {
          backgroundColor: 'white',
          padding: 20,
          margin: 20,
          borderRadius: 8,
          maxHeight: '90vh',
          overflow: 'auto',
          animation: visible ? 'fadeIn 0.3s ease' : 'fadeOut 0.3s ease',
        },
        contentContainerStyle
      ]}
    >
      {children}
    </PaperModal>
  </Portal>
);

const NativeModal: React.FC<ModalProps> = ({
  visible,
  onDismiss,
  children,
  contentContainerStyle,
  dismissable = true
}) => (
  <Portal>
    <PaperModal
      visible={visible}
      onDismiss={dismissable ? onDismiss : undefined}
      contentContainerStyle={[
        {
          backgroundColor: 'white',
          padding: 20,
          margin: 20,
          borderRadius: 8,
        },
        contentContainerStyle
      ]}
    >
      {children}
    </PaperModal>
  </Portal>
);

export default Modal;