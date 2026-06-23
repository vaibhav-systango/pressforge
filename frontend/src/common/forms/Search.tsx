// src/common/forms/Search.tsx
import React, { useState, KeyboardEvent } from 'react';
import { TextInput, ActionIcon } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export type SearchProps = {
  placeholder?: string;
  onSearch?: (value: string) => void;
  /** Optional initial value */
  defaultValue?: string;
};

export const Search: React.FC<SearchProps> = ({ placeholder = 'Search…', onSearch, defaultValue = '' }) => {
  const [value, setValue] = useState(defaultValue);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  };

  const handleIconClick = () => {
    if (onSearch) onSearch(value);
  };

  return (
    <TextInput
      value={value}
      onChange={(e) => setValue(e.currentTarget.value)}
      placeholder={placeholder}
      rightSection={
        <ActionIcon onClick={handleIconClick} variant="transparent">
          <IconSearch size={16} />
        </ActionIcon>
      }
      onKeyDown={handleKeyDown}
      classNames={{ input: 'bg-white/5 dark:bg-black/5' }}
    />
  );
};

export default Search;
