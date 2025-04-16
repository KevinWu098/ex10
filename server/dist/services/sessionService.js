"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionById = exports.createUserSession = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const crypto_1 = require("crypto");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
// In-memory store for session data
const sessions = {};
// Port range for Xpra servers
const MIN_PORT = 9000;
const MAX_PORT = 9100;
const usedPorts = new Set();
/**
 * Generate a random username with the specified prefix
 */
const generateUsername = (prefix = 'ex10_user_') => {
    const randomSuffix = (0, crypto_1.randomBytes)(4).toString('hex');
    return `${prefix}${randomSuffix}`;
};
/**
 * Allocate a free port for Xpra
 */
const allocatePort = () => {
    let port = MIN_PORT;
    while (usedPorts.has(port) && port <= MAX_PORT) {
        port++;
    }
    if (port > MAX_PORT) {
        throw new Error('No available ports for Xpra server');
    }
    usedPorts.add(port);
    return port;
};
/**
 * Create a new Linux user with restrictions
 */
const createLinuxUser = async (username) => {
    try {
        // Create user with no password and no home directory data
        await execAsync(`sudo adduser ${username} --disabled-password --gecos ""`);
        // Restrict login shell
        await execAsync(`sudo usermod -s /usr/sbin/nologin ${username}`);
        // Set proper permissions on home directory
        await execAsync(`sudo chmod 700 /home/${username}`);
        console.log(`Created new Linux user: ${username}`);
    }
    catch (error) {
        console.error(`Failed to create Linux user ${username}:`, error);
        throw error;
    }
};
/**
 * Start an Xpra server for a user session
 */
const startXpraServer = async (username, port) => {
    try {
        // Command to start Xpra server with browser
        const cmd = `sudo -u ${username} xpra start :100 --bind-tcp=0.0.0.0:${port} --start=chromium-browser --html=on`;
        await execAsync(cmd);
        console.log(`Started Xpra server for ${username} on port ${port}`);
    }
    catch (error) {
        console.error(`Failed to start Xpra server for ${username}:`, error);
        throw error;
    }
};
/**
 * Create a new user session
 */
const createUserSession = async () => {
    // Generate a unique session ID
    const sessionId = (0, crypto_1.randomBytes)(16).toString('hex');
    // Check if session already exists
    if (sessions[sessionId]) {
        return {
            ...sessions[sessionId],
            isNew: false
        };
    }
    // Generate username and allocate port
    const username = generateUsername();
    const xpraPort = allocatePort();
    // Create Linux user
    await createLinuxUser(username);
    // Start Xpra server
    await startXpraServer(username, xpraPort);
    // Create and store session
    const session = {
        id: sessionId,
        username,
        xpraPort,
        isNew: true,
        createdAt: new Date()
    };
    sessions[sessionId] = session;
    return session;
};
exports.createUserSession = createUserSession;
/**
 * Get a session by ID
 */
const getSessionById = (id) => {
    return sessions[id];
};
exports.getSessionById = getSessionById;
//# sourceMappingURL=sessionService.js.map