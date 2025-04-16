"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionRoutes = exports.getSession = exports.createSession = void 0;
const sessionService_1 = require("../services/sessionService");
/**
 * Create a new user session
 */
const createSession = async (req, res) => {
    try {
        const session = await (0, sessionService_1.createUserSession)();
        return res.status(201).json({
            success: true,
            data: {
                sessionId: session.id,
                isNew: session.isNew,
            }
        });
    }
    catch (error) {
        console.error('Error creating session:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create session',
            error: error.message
        });
    }
};
exports.createSession = createSession;
/**
 * Get session by ID - redirects to the session's xpra endpoint
 */
const getSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await (0, sessionService_1.getSessionById)(id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        // Redirect to the session's xpra endpoint
        return res.redirect(`/session/${id}/xpra`);
    }
    catch (error) {
        console.error('Error getting session:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get session',
            error: error.message
        });
    }
};
exports.getSession = getSession;
/**
 * Register session routes
 */
const getSessionRoutes = () => {
    // Placeholder for future routing extensions
    return [];
};
exports.getSessionRoutes = getSessionRoutes;
//# sourceMappingURL=sessionController.js.map