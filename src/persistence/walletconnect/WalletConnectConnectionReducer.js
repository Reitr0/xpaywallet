const initialState = {
    connections: [],
    activeConnections: {},
    loading: false,
    error: null,
};

export const WalletConnectConnectionReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SET_CONNECTION_SUCCESS':
            return {
                ...state,
                connections: [...state.connections.filter(conn => conn.id !== action.payload.id), action.payload],
                activeConnections: {
                    ...state.activeConnections,
                    [action.payload.chain]: action.payload,
                },
                loading: false,
                error: null,
            };

        case 'REMOVE_CONNECTION_SUCCESS':
            const updatedConnections = state.connections.filter(conn => conn.id !== action.payload);
            const updatedActiveConnections = { ...state.activeConnections };
            
            // Remove from active connections if it was active
            Object.keys(updatedActiveConnections).forEach(chain => {
                if (updatedActiveConnections[chain]?.id === action.payload) {
                    delete updatedActiveConnections[chain];
                }
            });

            return {
                ...state,
                connections: updatedConnections,
                activeConnections: updatedActiveConnections,
                loading: false,
                error: null,
            };

        case 'UPDATE_CONNECTION_SUCCESS':
            const updatedConnectionsList = state.connections.map(conn =>
                conn.id === action.payload.id ? action.payload : conn
            );

            return {
                ...state,
                connections: updatedConnectionsList,
                activeConnections: {
                    ...state.activeConnections,
                    [action.payload.chain]: action.payload,
                },
                loading: false,
                error: null,
            };

        case 'GET_CONNECTIONS_SUCCESS':
            const activeConnectionsMap = {};
            action.payload.forEach(conn => {
                if (conn.isActive) {
                    activeConnectionsMap[conn.chain] = conn;
                }
            });

            return {
                ...state,
                connections: action.payload,
                activeConnections: activeConnectionsMap,
                loading: false,
                error: null,
            };

        case 'SET_CONNECTION_LOADING':
            return {
                ...state,
                loading: true,
                error: null,
            };

        case 'SET_CONNECTION_ERROR':
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        case 'CLEAR_CONNECTIONS':
            return {
                ...state,
                connections: [],
                activeConnections: {},
                loading: false,
                error: null,
            };

        default:
            return state;
    }
};

// Action creators
export const setConnectionSuccess = (connection) => ({
    type: 'SET_CONNECTION_SUCCESS',
    payload: connection,
});

export const removeConnectionSuccess = (connectionId) => ({
    type: 'REMOVE_CONNECTION_SUCCESS',
    payload: connectionId,
});

export const updateConnectionSuccess = (connection) => ({
    type: 'UPDATE_CONNECTION_SUCCESS',
    payload: connection,
});

export const getConnectionsSuccess = (connections) => ({
    type: 'GET_CONNECTIONS_SUCCESS',
    payload: connections,
});

export const setConnectionLoading = () => ({
    type: 'SET_CONNECTION_LOADING',
});

export const setConnectionError = (error) => ({
    type: 'SET_CONNECTION_ERROR',
    payload: error,
});

export const clearConnections = () => ({
    type: 'CLEAR_CONNECTIONS',
});
