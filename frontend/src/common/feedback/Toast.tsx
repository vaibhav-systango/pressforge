import { notifications, NotificationData } from '@mantine/notifications';

/**
 * Helper object to show toast notifications.
 * Wraps Mantine's notifications API for quick and consistent usage.
 */
export const toast = {
  show: (data: NotificationData) => {
    notifications.show({
      color: 'violet',
      ...data,
    });
  },
  success: (message: string, title: string = 'Success') => {
    notifications.show({
      title,
      message,
      color: 'teal',
    });
  },
  error: (message: string, title: string = 'Error') => {
    notifications.show({
      title,
      message,
      color: 'red',
    });
  },
};

export default toast;
