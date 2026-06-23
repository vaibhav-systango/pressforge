// src/common/feedback/Dropdown.tsx
import React from 'react';
import { Menu, MenuItemProps, Button } from '@mantine/core';
import { ChevronDown } from 'lucide-react';

export type DropdownItem = {
  /** Text/element label for the item */
  label: React.ReactNode;
  /** Callback when the item is clicked */
  onClick?: () => void;
  /** Props passed to the underlying Menu.Item */
  props?: Partial<MenuItemProps>;
};

export type DropdownProps = {
  /** Trigger button label */
  buttonLabel: React.ReactNode;
  /** Items to render in the dropdown */
  items: DropdownItem[];
  /** Button color/variant */
  variant?: 'filled' | 'light' | 'outline' | 'transparent' | 'subtle';
};

export const Dropdown: React.FC<DropdownProps> = ({ buttonLabel, items, variant = 'filled' }) => {
  return (
    <Menu shadow="md" width={200} trigger="click" closeOnItemClick>
      <Menu.Target>
        <Button variant={variant} color="violet" rightSection={<ChevronDown size={14} />}>
          {buttonLabel}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        {items.map((item, idx) => (
          <Menu.Item key={idx} onClick={item.onClick} {...item.props}>
            {item.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
};

export default Dropdown;
