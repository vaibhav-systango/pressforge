export const AUTH = {
  SESSION_COOKIE_KEY: 'pressforge-session',
  BRAND_NAME: 'PressForge',
  ROLE_OPTIONS: [
    { value: 'admin', label: 'Administrator (Full Edit/Create)' },
    { value: 'editor', label: 'Editor (Modify simulation only)' },
    { value: 'viewer', label: 'Viewer (Read-only)' },
  ],
  LOGIN: {
    DEFAULT_VALUES: {
      email: '',
      password: '',
      role: 'admin' as const,
    },
    CARD_TITLE: 'Log in to your account',
    NO_ACCOUNT_PROMPT: "Don't have an account? ",
    SIGNUP_LINK: 'Sign up',
    SHORTCUTS_LABEL: 'Quick Role Shortcuts',
    DIVIDER_LABEL: 'Or enter credentials',
    SUBMIT_BTN: 'Sign In',
  },
  SIGNUP: {
    DEFAULT_VALUES: {
      name: '',
      email: '',
      password: '',
      role: 'admin' as const,
    },
    CARD_TITLE: 'Create a new account',
    ALREADY_ACCOUNT_PROMPT: 'Already have an account? ',
    LOGIN_LINK: 'Log in',
    SUBMIT_BTN: 'Sign Up',
  },
  UNAUTHORIZED: {
    TITLE: 'Access Denied (403)',
    DESC: 'You do not have the required permissions to access this screen. Please contact your system administrator if you believe this is an error.',
  },
  LOGOUT_BTN_TEXT: 'Log Out',
  DASHBOARD_ROLE_SUFFIX: ' Account',
} as const;
