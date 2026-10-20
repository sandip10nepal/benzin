import React from 'react';
import { View, Text, TouchableOpacity, Modal, Image, StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
}

export const DakuUpgradeModal: React.FC<Props> = ({ visible, onAccept, onDecline, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Image
            source={require('../../assets/images/daku_poster.jpg')}
            style={styles.posterImage}
            resizeMode="cover"
          />
          <View style={styles.content}>
            <Text style={styles.title}>UPGRADE TO DAKU?</Text>
            <Text style={styles.subtitle}>Includes Unlimited Head Refill for 2 Hours!</Text>
            <Text style={styles.details}>
              For $65, get unlimited head refills, plus Ice Base and Ice Hose included for FREE!
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
                <Text style={styles.declineText}>No Thanks</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
                <Text style={styles.acceptText}>MAKE IT DAKU ($65)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  posterImage: {
    width: '100%',
    height: 350,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#F59E0B',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  subtitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  details: {
    color: '#A1A1AA',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#3F3F46',
    borderRadius: 12,
    alignItems: 'center',
  },
  declineText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
  },
});
