import { StorageService } from '@modules/core/storage/StorageService';
import {
    setConnectionSuccess,
    removeConnectionSuccess,
    updateConnectionSuccess,
    getConnectionsSuccess,
} from './WalletConnectConnectionReducer';

export const WalletConnectConnectionAction = {
    saveConnection,
    removeConnection,
    updateConnection,
    getConnections,
    clearAllConnections,
};

const CONNECTION_STORAGE_KEY = 'wallet_connect_connections';

// Save a new connection
function saveConnection(connectionData) {
    return async dispatch => {
        try {
            const { success, data } = await WalletConnectConnectionService.saveConnection(connectionData);
            if (success) {
                dispatch(setConnectionSuccess(data));
            }
            return { success, data };
        } catch (error) {
            console.error('Error saving connection:', error);
            return { success: false, error: error.message };
        }
    };
}

// Remove a connection
function removeConnection(connectionId) {
    return async dispatch => {
        try {
            const { success, data } = await WalletConnectConnectionService.removeConnection(connectionId);
            if (success) {
                dispatch(removeConnectionSuccess(connectionId));
            }
            return { success, data };
        } catch (error) {
            console.error('Error removing connection:', error);
            return { success: false, error: error.message };
        }
    };
}

// Update an existing connection
function updateConnection(connectionId, updates) {
    return async dispatch => {
        try {
            const { success, data } = await WalletConnectConnectionService.updateConnection(connectionId, updates);
            if (success) {
                dispatch(updateConnectionSuccess(data));
            }
            return { success, data };
        } catch (error) {
            console.error('Error updating connection:', error);
            return { success: false, error: error.message };
        }
    };
}

// Get all connections
function getConnections() {
    return async dispatch => {
        try {
            const { success, data } = await WalletConnectConnectionService.getConnections();
            if (success) {
                dispatch(getConnectionsSuccess(data));
            }
            return { success, data };
        } catch (error) {
            console.error('Error getting connections:', error);
            return { success: false, error: error.message };
        }
    };
}

// Clear all connections
function clearAllConnections() {
    return async dispatch => {
        try {
            const { success, data } = await WalletConnectConnectionService.clearAllConnections();
            if (success) {
                dispatch(getConnectionsSuccess([]));
            }
            return { success, data };
        } catch (error) {
            console.error('Error clearing connections:', error);
            return { success: false, error: error.message };
        }
    };
}

// Service class for handling connection persistence
class WalletConnectConnectionService {
    static async saveConnection(connectionData) {
        try {
            const connections = await this.getConnections();
            const newConnection = {
                id: connectionData.id || this.generateConnectionId(),
                chain: connectionData.chain,
                address: connectionData.address,
                walletId: connectionData.walletId,
                connectedAt: connectionData.connectedAt || Date.now(),
                lastUsed: Date.now(),
                isActive: true,
                metadata: connectionData.metadata || {},
            };

            // Check if connection already exists for this chain and address
            const existingIndex = connections.findIndex(
                conn => conn.chain === newConnection.chain && 
                        conn.address === newConnection.address
            );

            if (existingIndex >= 0) {
                // Update existing connection
                connections[existingIndex] = { ...connections[existingIndex], ...newConnection };
            } else {
                // Add new connection
                connections.push(newConnection);
            }

            await StorageService.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(connections));
            return { success: true, data: newConnection };
        } catch (error) {
            console.error('Error saving connection:', error);
            return { success: false, error: error.message };
        }
    }

    static async removeConnection(connectionId) {
        try {
            const connections = await this.getConnections();
            const filteredConnections = connections.filter(conn => conn.id !== connectionId);
            await StorageService.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(filteredConnections));
            return { success: true, data: connectionId };
        } catch (error) {
            console.error('Error removing connection:', error);
            return { success: false, error: error.message };
        }
    }

    static async updateConnection(connectionId, updates) {
        try {
            const connections = await this.getConnections();
            const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
            
            if (connectionIndex >= 0) {
                connections[connectionIndex] = {
                    ...connections[connectionIndex],
                    ...updates,
                    lastUsed: Date.now(),
                };
                await StorageService.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(connections));
                return { success: true, data: connections[connectionIndex] };
            } else {
                return { success: false, error: 'Connection not found' };
            }
        } catch (error) {
            console.error('Error updating connection:', error);
            return { success: false, error: error.message };
        }
    }

    static async getConnections() {
        try {
            const connectionsData = await StorageService.getItem(CONNECTION_STORAGE_KEY);
            if (connectionsData) {
                const connections = JSON.parse(connectionsData);
                // Filter out expired connections (older than 30 days)
                const validConnections = connections.filter(conn => {
                    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                    return conn.lastUsed > thirtyDaysAgo;
                });
                
                // Update storage if any connections were filtered out
                if (validConnections.length !== connections.length) {
                    await StorageService.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(validConnections));
                }
                
                return { success: true, data: validConnections };
            }
            return { success: true, data: [] };
        } catch (error) {
            console.error('Error getting connections:', error);
            return { success: false, error: error.message };
        }
    }

    static async clearAllConnections() {
        try {
            await StorageService.removeItem(CONNECTION_STORAGE_KEY);
            return { success: true, data: [] };
        } catch (error) {
            console.error('Error clearing connections:', error);
            return { success: false, error: error.message };
        }
    }

    static generateConnectionId() {
        return 'conn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Get active connection for a specific chain
    static async getActiveConnection(chain) {
        try {
            const connections = await this.getConnections();
            const activeConnection = connections.find(conn => 
                conn.chain === chain && conn.isActive
            );
            return { success: true, data: activeConnection || null };
        } catch (error) {
            console.error('Error getting active connection:', error);
            return { success: false, error: error.message };
        }
    }

    // Set connection as active for a chain
    static async setActiveConnection(chain, connectionId) {
        try {
            const connections = await this.getConnections();
            
            // Deactivate all connections for this chain
            connections.forEach(conn => {
                if (conn.chain === chain) {
                    conn.isActive = false;
                }
            });

            // Activate the specified connection
            const connectionIndex = connections.findIndex(conn => conn.id === connectionId);
            if (connectionIndex >= 0) {
                connections[connectionIndex].isActive = true;
                connections[connectionIndex].lastUsed = Date.now();
            }

            await StorageService.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(connections));
            return { success: true, data: connections[connectionIndex] };
        } catch (error) {
            console.error('Error setting active connection:', error);
            return { success: false, error: error.message };
        }
    }
}
