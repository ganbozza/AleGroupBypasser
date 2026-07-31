// your_group_service.js
import { app } from "../../../scripts/app.js";

class FastGroupToggleService {
    constructor() {
        this.initialized = false;
        this.controllers = new Set();
    }

    init() {
        if (this.initialized) return;
        this.initialized = true;

        // Intercept LiteGraph drawing loop to sync toggle states in real-time
        const origDraw = LGraphCanvas.prototype.draw;
        const self = this;
        LGraphCanvas.prototype.draw = function(...args) {
            self.updateAllGroupsState();
            return origDraw.apply(this, args);
        };
    }

    registerController(node) {
        this.controllers.add(node);
    }

    unregisterController(node) {
        this.controllers.delete(node);
    }

    // Helper: Find which canvas group contains a node's position coordinates
    getGroupContainingNode(node) {
        const groups = app.graph?._groups || [];
        const [nX, nY] = node.pos;

        for (let i = groups.length - 1; i >= 0; i--) {
            const group = groups[i];
            const [gX, gY] = group.pos;
            const [gW, gH] = group.size;

            if (nX >= gX && nX <= gX + gW && nY >= gY && nY <= gY + gH) {
                return group;
            }
        }
        return null;
    }

    // Main Engine: Scan controllers, find their groups, and toggle nested nodes
    updateAllGroupsState() {
        if (!app.graph) return;

        this.controllers.forEach(controller => {
            const targetGroup = this.getGroupContainingNode(controller);
            if (!targetGroup) return;

            // Get target operational state from the controller's widget value
            // Custom state logic: "Active" (0), "Mute" (2), "Bypass" (4)
            const targetMode = controller.widgets[0].value; 
            
            const [gX, gY] = targetGroup.pos;
            const [gW, gH] = targetGroup.size;
            const allNodes = app.graph._nodes || [];

            allNodes.forEach(node => {
                // Ignore the controller itself to prevent infinite logic loops
                if (node === controller) return;

                const [nX, nY] = node.pos;
                const isInside = nX >= gX && nX <= gX + gW && nY >= gY && nY <= gY + gH;

                if (isInside) {
                    const currentMode = node.mode ?? 0;
                    if (currentMode !== targetMode) {
                        node.mode = targetMode;
                        node.setDirtyCanvas(true, true);
                    }
                }
            });
        });
    }
}

export const FAST_GROUP_SERVICE = new FastGroupToggleService();
