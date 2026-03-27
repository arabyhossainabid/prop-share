import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

// Hardcoded admin credentials - no ENV required
const ADMIN_CONFIG = {
  email: 'admin@propshare.com',
  password: 'propshare123',
  name: 'PropShare Admin',
};

const defaultCategories = [
  {
    name: 'Residential',
    description: 'Apartments, houses, and multi-family homes',
    icon: 'home',
  },
  {
    name: 'Commercial',
    description: 'Office spaces, retail shops, and warehouses',
    icon: 'building',
  },
  {
    name: 'Industrial',
    description: 'Manufacturing plants and logistics centers',
    icon: 'factory',
  },
  {
    name: 'Land',
    description: 'Undeveloped plots and agricultural land',
    icon: 'map',
  },
  {
    name: 'Vacation Homes',
    description: 'Short-term rentals and holiday properties',
    icon: 'palmtree',
  },
];

/**
 * Seed default admin user and categories into the database.
 * Admin credentials are hardcoded and do not require ENV variables.
 *
 * Admin can be accessed with:
 * - Email: admin@propshare.com
 * - Password: propshare123
 */
export const seedSuperAdmin = async () => {
  try {
    // Hash admin password with bcrypt for secure storage
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 12);

    // Upsert admin user - create if not exists, update if exists
    await prisma.user.upsert({
      where: { email: ADMIN_CONFIG.email },
      update: {
        name: ADMIN_CONFIG.name,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        name: ADMIN_CONFIG.name,
        email: ADMIN_CONFIG.email,
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    // Seed default property categories
    for (const cat of defaultCategories) {
      await prisma.category.upsert({
        where: { name: cat.name },
        create: cat,
        update: {},
      });
    }
  } catch (error) {
    console.error('❌ Seed error:', error);
  }
};
