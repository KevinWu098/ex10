"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const sessionController_1 = require("./controllers/sessionController");
const sessionService_1 = require("./services/sessionService");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Middleware
app.use(express_1.default.json());
// Routes
app.get('/createSession', sessionController_1.createSession);
app.get('/session/:id', sessionController_1.getSession);
app.post('/updateCode', (req, res) => {
    // Placeholder for future implementation
    res.status(200).json({ message: 'updateCode endpoint placeholder' });
});
// Direct redirect to xpra port instead of proxying
app.get('/session/:id/xpra', async (req, res) => {
    try {
        const { id } = req.params;
        const session = await (0, sessionService_1.getSessionById)(id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        // Redirect to the actual xpra port
        return res.redirect(`http://localhost:${session.xpraPort}`);
    }
    catch (error) {
        console.error('Redirect error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to redirect to xpra session',
            error: error.message
        });
    }
});
// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map