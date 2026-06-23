// src/common/feedback/Modal.tsx
import React from 'react';
import { Modal as MantineModal, ModalProps as MantineModalProps } from '@mantine/core';

export type ModalProps = MantineModalProps & {
  /** Children content of the modal */
  children: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({ children, ...props }) => {
  return (
    <MantineModal {...props}>
      {children}
    </MantineModal>
  );
};

export default Modal;
