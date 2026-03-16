import app from './app';
import { envVars } from './app/config/env';
import { seedSuperAdmin } from './app/utils/seed';

const bootstrap = async () => {
    try {
        // Seed initial admin user
        await seedSuperAdmin();

        const server = app.listen(envVars.PORT, () => {
            console.log(`PropShare API listening on http://localhost:${envVars.PORT}`);
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
    }
};

bootstrap();

process.on('uncaughtException', (error) => {
    console.log('Uncaught Exception detected, exiting...', error);
    process.exit(1);
});
