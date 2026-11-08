/**
 * CampusFind – Application Configuration
 * Tagline: CampusFind – Find. Report. Reclaim.
 */

export const CONFIG = {
  APP_NAME: 'CampusFind',
  TAGLINE: 'Find. Report. Reclaim.',
  VERSION: '1.0.0',

  // Prototype toggle: set to false when connecting to production REST API
  USE_MOCK: true,
  API_BASE_URL: 'http://localhost:5000/api/v1',

  // Validation rules
  VALIDATION: {
    // Basic email format validator (not claiming full RFC 5322 compliance)
    BASIC_EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_MIN_LENGTH: 8,
    // Institution-specific domain restriction is configurable and disabled by default
    ENFORCE_INSTITUTION_DOMAIN: false,
    ALLOWED_DOMAINS: [] // e.g. ['@university.edu'] once institution confirms
  },

  // Available Categories
  CATEGORIES: [
    { id: 'cat_electronics', name: 'Electronics & Gadgets', icon: 'smartphone' },
    { id: 'cat_bags', name: 'Bags, Wallets & Purses', icon: 'briefcase' },
    { id: 'cat_stationery', name: 'Books & Stationery', icon: 'book' },
    { id: 'cat_clothing', name: 'Clothing & Accessories', icon: 'tag' },
    { id: 'cat_ids', name: 'Student IDs & Bank Cards', icon: 'credit-card' },
    { id: 'cat_keys', name: 'Keys & Keychains', icon: 'key' },
    { id: 'cat_bottles', name: 'Bottles & Flasks', icon: 'coffee' },
    { id: 'cat_other', name: 'Other Belongings', icon: 'package' }
  ],

  // Common Campus Locations
  LOCATIONS: [
    'Main University Library',
    'Student Center / Union',
    'Science Complex (Block A)',
    'Engineering Building (Block B)',
    'Campus Dining Hall / Cafeteria',
    'Sports Complex & Gym',
    'Central Lecture Theatres',
    'Main Gate & Bus Stop',
    'Hostel / Residence Quad'
  ],

  // Report & Claim Status Constants
  STATUS: {
    REPORT: {
      LOST: 'lost',
      FOUND: 'found',
      RESOLVED: 'resolved',
      ARCHIVED: 'archived'
    },
    CLAIM: {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected'
    }
  },

  // User Roles
  ROLES: {
    STUDENT: 'student',
    ADMIN: 'admin'
  },

  // Fictional Demo Accounts for Testing & Review
  DEMO_ACCOUNTS: {
    STUDENT: {
      id: 'usr_student_01',
      name: 'Alex Morgan',
      email: 'alex.morgan@example.edu',
      role: 'student',
      studentId: 'STU-88219',
      avatarText: 'AM'
    },
    STUDENT_SECONDARY: {
      id: 'usr_student_02',
      name: 'Jordan Taylor',
      email: 'jordan.taylor@example.edu',
      role: 'student',
      studentId: 'STU-94032',
      avatarText: 'JT'
    },
    ADMIN: {
      id: 'usr_admin_01',
      name: 'Campus Safety Officer',
      email: 'admin@campusfind.org',
      role: 'admin',
      staffId: 'ADM-1004',
      avatarText: 'AD'
    }
  }
};
