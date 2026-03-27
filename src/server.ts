import app from './app';
import { envVars } from './app/config/env';
import { prisma } from './app/lib/prisma';
import { seedSuperAdmin } from './app/utils/seed';

const bootstrap = async () => {
    try {
        // 1. Check DB Connection
        await prisma.$connect();
        console.log('Database connected successfully');

        // 2. Seed initial admin user
        await seedSuperAdmin();

        // 3. Start Server - bind to all interfaces (0.0.0.0) for proper port detection
        const port = parseInt(envVars.PORT) || 8080;
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`PropShare API listening on http://0.0.0.0:${port}`);
        });

        // Unhandled Rejection handle
        process.on('unhandledRejection', (error) => {
            console.log('Unhandled Rejection detected, closing server...', error);
            if (server) {
                server.close(() => {
                    process.exit(1);
                });
            } else {
                process.exit(1);
            }
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

bootstrap();

process.on('uncaughtException', (error) => {
    console.log('Uncaught Exception detected, exiting...', error);
    process.exit(1);
});
