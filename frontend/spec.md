# PressForge Design System & Common Components Specification

This specification documents the PressForge design system (color system, typography, animations, dark/light theme support) and the API specifications for the common components created under `src/common`.

---

## 1. Design Tokens & Styling System

The styling is dark-first, editorial, and electric. It uses modern HSL/OKLCH color coordinates defined in CSS variables and loaded by Tailwind CSS v4.

### Colors (OKLCH Coordinates)
- **Light Theme**:
  - `background`: `oklch(0.99 0.005 280)` (Ink off-white)
  - `foreground`: `oklch(0.18 0.03 280)` (Ink dark)
  - `primary`: `oklch(0.55 0.18 285)` (Violet brand)
  - `brand`: `oklch(0.55 0.18 285)`
  - `brand-2`: `oklch(0.62 0.19 330)`
  - `brand-3`: `oklch(0.68 0.13 215)`
  - `gold`: `oklch(0.72 0.14 80)` (Accent gold)
  
- **Dark Theme**:
  - `background`: `oklch(0.16 0.025 280)` (Deep ink)
  - `foreground`: `oklch(0.97 0.01 280)` (White-silver)
  - `primary`: `oklch(0.66 0.24 300)` (Electric purple)
  - `brand`: `oklch(0.66 0.24 300)`
  - `brand-2`: `oklch(0.66 0.25 340)`
  - `brand-3`: `oklch(0.78 0.16 210)`

### Typography
- **Headings Font**: Space Grotesk (`var(--font-display)`)
- **Body Font**: Inter (`var(--font-sans)`)

### CSS Utility Classes
- `text-gradient`: Applies the multi-color brand gradient clip-text.
- `bg-gradient-brand`: Applies the brand gradient background.
- `glass`: Creates a backdrop-blur card background with subtle borders.
- `glow`: Applies a premium soft drop-shadow matching the primary theme.
- `shimmer-border`: Adds an animated glowing border shimmer effect to containers.

---

## 2. Common Layout Components

### Header (`src/common/layout/Header.tsx`)
A sticky navigation header with the brand logo, link list, theme toggle, and CTA buttons.
```tsx
import Header from '@/common/layout/Header';

// Usage:
<Header />
```

### Footer (`src/common/layout/Footer.tsx`)
A clean, informative footer containing copyrights, global status indicators, and compliance notes.
```tsx
import Footer from '@/common/layout/Footer';

// Usage:
<Footer />
```

### ThemeToggle (`src/common/layout/ThemeToggle.tsx`)
A theme switcher utilizing Mantine’s scheme provider and keeping Tailwind's `.dark` class in sync.
```tsx
import ThemeToggle from '@/common/layout/ThemeToggle';

// Usage:
<ThemeToggle />
```

---

## 3. Common Marketing Components

### Hero (`src/common/marketing/Hero.tsx`)
The top-level landing page banner containing the main pitch, Call-to-Action buttons, and a live product dashboard mock layout with inline analytics mock graphs.
```tsx
import Hero from '@/common/marketing/Hero';

// Usage:
<Hero />
```

### FeatureCard (`src/common/marketing/FeatureCard.tsx`)
Individual card blocks displaying features with custom background color-fade backdrops.
```tsx
import FeatureCard from '@/common/marketing/FeatureCard';
import { Wand2 } from 'lucide-react';

// Props:
type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  gradientClass: string;
  index: number;
};

// Usage:
<FeatureCard
  icon={Wand2}
  title="AI drafts"
  description="Brand-voice aware captions..."
  gradientClass="from-violet-500/30 to-fuchsia-500/10"
  index={0}
/>
```

### PricingCard (`src/common/marketing/PricingCard.tsx`)
Displays product pricing tiers, allowing one to highlights the most popular option.
```tsx
import PricingCard from '@/common/marketing/PricingCard';

// Props:
type PricingCardProps = {
  name: string;
  price: string;
  tag: string;
  feats: string[];
  highlight?: boolean;
};

// Usage:
<PricingCard
  name="Starter"
  price="$49"
  tag="For solo operators"
  feats={['1 workspace', '100 AI drafts / mo']}
/>
```

### StatCard (`src/common/marketing/StatCard.tsx`)
Renders high-impact metric statistics values.
```tsx
import StatCard from '@/common/marketing/StatCard';

// Props:
type StatCardProps = {
  value: string;
  label: string;
};

// Usage:
<StatCard value="10×" label="Faster content turnaround" />
```

### CTA (`src/common/marketing/CTA.tsx`)
A call-to-action block with shimmer-border styling, ready to direct visitors to login/signup.
```tsx
import CTA from '@/common/marketing/CTA';

// Usage:
<CTA />
```

---

## 4. Common Interactive components

### Button (`src/common/buttons/Button.tsx`)
A Mantine wrapper styled with the brand gradient default options.
```tsx
import Button from '@/common/buttons/Button';

// Props:
type ButtonProps = MantineButtonProps & {
  gradientBrand?: boolean;
};

// Usage:
<Button gradientBrand>Click Me</Button>
```

### Search (`src/common/forms/Search.tsx`)
A search field with an integrated action button.
```tsx
import Search from '@/common/forms/Search';

// Props:
type SearchProps = {
  placeholder?: string;
  onSearch?: (value: string) => void;
  defaultValue?: string;
};

// Usage:
<Search onSearch={(val) => console.log(val)} />
```

### Table (`src/common/tables/Table.tsx`)
A generic data table wrapping Mantine's Table subcomponents safely.
```tsx
import Table from '@/common/tables/Table';

// Props:
type Column<T> = {
  header: React.ReactNode;
  render: (row: T) => React.ReactNode;
  className?: string;
};
type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  caption?: string;
} & MantineTableProps;

// Usage:
<Table
  data={[{ id: 1, name: 'Alice' }]}
  columns={[
    { header: 'ID', render: (row) => row.id },
    { header: 'Name', render: (row) => row.name }
  ]}
/>
```

### Modal (`src/common/feedback/Modal.tsx`)
A generic overlay dialog window component wrapper.
```tsx
import Modal from '@/common/feedback/Modal';

// Props:
type ModalProps = MantineModalProps;

// Usage:
<Modal opened={opened} onClose={close} title="My Modal">
  Content goes here
</Modal>
```

### Toast (`src/common/feedback/Toast.tsx`)
A toast notification system with success and error helpers.
```tsx
import toast from '@/common/feedback/Toast';

// Usage:
toast.success('Campaign launched successfully!');
toast.error('Failed to create workspace.');
```

### Dropdown (`src/common/feedback/Dropdown.tsx`)
A trigger button with a dropdown overlay menu.
```tsx
import Dropdown from '@/common/feedback/Dropdown';

// Props:
type DropdownItem = {
  label: React.ReactNode;
  onClick?: () => void;
  props?: Partial<MenuItemProps>;
};
type DropdownProps = {
  buttonLabel: React.ReactNode;
  items: DropdownItem[];
  variant?: 'filled' | 'light' | 'outline' | 'transparent' | 'subtle';
};

// Usage:
<Dropdown
  buttonLabel="Options"
  items={[
    { label: 'Edit', onClick: () => {} },
    { label: 'Delete', onClick: () => {} }
  ]}
/>
```
