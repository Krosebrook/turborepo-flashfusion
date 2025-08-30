const ErrorHandler = require('./errorHandler');
const logger = require('./logger');

class ServiceRegistry {
    constructor() {
        this.services = new Map();
        this.initialized = new Set();
        this.dependencies = new Map();
    }

    register(name, serviceClass, dependencies = []) {
        this.services.set(name, {
            class: serviceClass,
            instance: null,
            dependencies,
            singleton: true
        });

        if (dependencies.length > 0) {
            this.dependencies.set(name, dependencies);
        }

        logger.info(`Service registered: ${name}`);
    }

    registerInstance(name, instance) {
        this.services.set(name, {
            class: null,
            instance,
            dependencies: [],
            singleton: true
        });
        this.initialized.add(name);
        logger.info(`Service instance registered: ${name}`);
    }

    async get(name) {
        const serviceInfo = this.services.get(name);

        if (!serviceInfo) {
            throw ErrorHandler.createApiError(`Service not found: ${name}`, 404, 'SERVICE_NOT_FOUND');
        }

        if (serviceInfo.instance) {
            return serviceInfo.instance;
        }

        return await this.instantiate(name);
    }

    async instantiate(name) {
        const serviceInfo = this.services.get(name);

        if (!serviceInfo) {
            throw ErrorHandler.createApiError(`Service not found: ${name}`, 404, 'SERVICE_NOT_FOUND');
        }

        if (this.initialized.has(name)) {
            return serviceInfo.instance;
        }

        try {
            // Initialize dependencies first
            const dependencies = this.dependencies.get(name) || [];
            const resolvedDeps = [];

            for (const depName of dependencies) {
                const dep = await this.get(depName);
                resolvedDeps.push(dep);
            }

            // Create service instance
            const ServiceClass = serviceInfo.class;
            const instance = new ServiceClass(...resolvedDeps);

            // Initialize if method exists
            if (typeof instance.initialize === 'function') {
                await instance.initialize();
            }

            serviceInfo.instance = instance;
            this.initialized.add(name);

            logger.info(`Service initialized: ${name}`);
            return instance;

        } catch (error) {
            logger.error(`Failed to initialize service ${name}:`, error);
            throw ErrorHandler.createApiError(
                `Service initialization failed: ${name}`,
                500,
                'SERVICE_INIT_ERROR'
            );
        }
    }

    async shutdown() {
        const shutdownPromises = [];

        for (const [name, serviceInfo] of this.services.entries()) {
            if (serviceInfo.instance && typeof serviceInfo.instance.shutdown === 'function') {
                shutdownPromises.push(
                    serviceInfo.instance.shutdown().catch(error => {
                        logger.error(`Error shutting down service ${name}:`, error);
                    })
                );
            }
        }

        await Promise.all(shutdownPromises);
        this.services.clear();
        this.initialized.clear();
        this.dependencies.clear();

        logger.info('All services shut down');
    }

    getHealthStatus() {
        const services = {};

        for (const [name, serviceInfo] of this.services.entries()) {
            services[name] = {
                initialized: this.initialized.has(name),
                hasInstance: !!serviceInfo.instance,
                dependencies: this.dependencies.get(name) || []
            };

            // Get health info if available
            if (serviceInfo.instance && typeof serviceInfo.instance.getHealth === 'function') {
                try {
                    services[name].health = serviceInfo.instance.getHealth();
                } catch (error) {
                    services[name].health = { status: 'error', error: error.message };
                }
            }
        }

        return {
            totalServices: this.services.size,
            initializedServices: this.initialized.size,
            services
        };
    }

    listServices() {
        return Array.from(this.services.keys());
    }

    isInitialized(name) {
        return this.initialized.has(name);
    }

    async reinitialize(name) {
        const serviceInfo = this.services.get(name);

        if (!serviceInfo) {
            throw ErrorHandler.createApiError(`Service not found: ${name}`, 404, 'SERVICE_NOT_FOUND');
        }

        // Shutdown existing instance
        if (serviceInfo.instance && typeof serviceInfo.instance.shutdown === 'function') {
            await serviceInfo.instance.shutdown();
        }

        // Clear initialization status
        this.initialized.delete(name);
        serviceInfo.instance = null;

        // Reinitialize
        return await this.instantiate(name);
    }
}

// Create global registry
const serviceRegistry = new ServiceRegistry();

module.exports = {
    ServiceRegistry,
    serviceRegistry
};