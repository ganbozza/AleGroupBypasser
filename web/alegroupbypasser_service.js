import { app } from "../../scripts/app.js";

const MODE_ACTIVE = LiteGraph.ALWAYS;
const MODE_BYPASS = 4;

class AleGroupBypasserService {
    constructor() {
        this.initialized = false;
        this.nodes = new Set();
        this.group_collections = new Map();
    }

    init() {
        const self = this;
        if (self.initialized) return;
        self.initialized = true;

        if (typeof LGraphCanvas !== "undefined" && LGraphCanvas.onGroupAdd) {
            const originalOnGroupAdd = LGraphCanvas.onGroupAdd;
            LGraphCanvas.onGroupAdd = function(...args) {

                // 3. Execute the original logic so the group is actually created
                originalOnGroupAdd.apply(this, args);

                // 4. Retrieve the newly created group (it's the last one in the list)
                const newGroup = app.graph._groups[app.graph._groups.length - 1];

                if (newGroup) {
                    // add group to collection
                }
                console.log("A new group is being added to the canvas!");
            };
        }

        // Intercept LiteGraph drawing loop
        
        const origDraw = LGraphCanvas.prototype.draw;
        LGraphCanvas.prototype.draw = function(...args) {
            const available_groups = app.graph?._groups || [];
            for (const group of available_groups) {
                if(group_collections.has(group.title)) {
                    continue;
                }
                addGroupToCollection(group);
            }
            self.updateGroupCollection(available_groups);
            /*
            if(this.group_collections.size > available_groups) {
                for (const group of group_collections)
                {
                    if(!in_array(group.title, available_groups)) {
                        group_collections.delete(group.key);
                        console.log("Group removed from collection...");
                    }
                }
            }
            */
            return origDraw.apply(this, args);
        };
        
        
        console.log("AleGroupBypasser_Service initialized...");
    }

    updateGroupCollection(available_groups) {
        if(this.group_collections.size > available_groups) {
            for (const group of group_collections)
            {
                if(!in_array(group.title, available_groups)) {
                    group_collections.delete(group.key);
                    console.log("Group removed from collection...");
                }
            }
        } 
    }
    
    findWidget(node, name) {
      return (node.widgets || []).find((widget) => widget.name === name);
    }
    
    addGroupToCollection(group) {
      
    }
    
    registerNode(node) {
        this.nodes.add(node);
        console.log("Adding node...");
    }

    unregisterNode(node) {
        this.nodes.delete(node);
        console.log("Removing node...");
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

        this.nodes.forEach(node => {
            const targetGroup = this.getGroupContainingNode(node);
            if (!targetGroup) return;

            // Get target operational state from the node's widget value
            // Custom state logic: "Active" (0), "Mute" (2), "Bypass" (4)
            const targetMode = node.widgets[0].value; 
            
            const [gX, gY] = targetGroup.pos;
            const [gW, gH] = targetGroup.size;
            const allNodes = app.graph._nodes || [];

            allNodes.forEach(_node => {
                // Ignore the controller itself to prevent infinite logic loops
                if (_node === node) return;

                const [nX, nY] = _node.pos;
                const isInside = nX >= gX && nX <= gX + gW && nY >= gY && nY <= gY + gH;

                if (isInside) {
                    const currentMode = _node.mode ?? 0;
                    if (currentMode !== targetMode) {
                        _node.mode = targetMode;
                        _node.setDirtyCanvas(true, true);
                    }
                }
            });
        });
    }
}

export const ALEGROUPBYPASSER_SERVICE = new AleGroupBypasserService();
