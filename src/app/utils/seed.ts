import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { envVars } from '../config/env';

const defaultCategories = [
    { name: 'Residential', description: 'Apartments, houses, and multi-family homes', icon: 'home' },
    { name: 'Commercial', description: 'Office spaces, retail shops, and warehouses', icon: 'building' },
    { name: 'Industrial', description: 'Manufacturing plants and logistics centers', icon: 'factory' },
    { name: 'Land', description: 'Undeveloped plots and agricultural land', icon: 'map' },
    { name: 'Vacation Homes', description: 'Short-term rentals and holiday properties', icon: 'palmtree' },
];

export const seedSuperAdmin = async () => {
    try {
        // Seed admin user
        const existingAdmin = await prisma.user.findUnique({
            where: { email: envVars.ADMIN_EMAIL },
        });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(envVars.ADMIN_PASSWORD, 12);
            await prisma.user.create({
                data: {
                    name: envVars.ADMIN_NAME,
                    email: envVars.ADMIN_EMAIL,
                    password: hashedPassword,
                    role: 'ADMIN',
                    isActive: true,
                },
            });
            console.log(`Admin user seeded: ${envVars.ADMIN_EMAIL}`);
        }

        // Seed default categories
        for (const cat of defaultCategories) {
            await prisma.category.upsert({
                where: { name: cat.name },
                create: cat,
                update: {},
            });
        }
        console.log('PropShare Categories seeded');
    } catch (error) {
        console.error('Seed error:', error);
    }
};
