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
        if (this.initialized) return;
        this.initialized = true;        

        // Intercept LiteGraph drawing loop to sync toggle states in real-time
        const origDraw = LGraphCanvas.prototype.draw;
        const self = this;
        LGraphCanvas.prototype.draw = function(...args) {
            self.updateAllGroupsState();
            return origDraw.apply(this, args);
        };
        console.log("AleGroupBypasser_Service initialized...");
        run();
    }

    function run() {
        for (const graph of collectNestedGraphs()) {
              for (const group of graph.groups) {
                  const title = String(group.title || "").trim();
                  if(!title) { 
                      continue; 
                  }
                  const key = title.toLowerCase();
                  if(!group_collections.has(key))
                  {
                      group_collections.set(key, {
                      key,
                      title,
                      state = MODE_BYPASS; 
                    }); 
                  }
                  if (group_collections.get(key).state==MODE_BYPASS) { // ignore if group already in active state
                      group_collections.get(key).state = Array.from(group._children).filter((c) => c instanceof LGraphNode).some((n) => n.mode === MODE_ACTIVE) ? MODE_ACTIVE : MODE_BYPASS;
                  }
              }
        }
        //setTimeout(function(){ this.run(); }, 500);
    }
    
    function collectNestedGraphs() {
    
      const collected = [];
      const stack = [app.graph];
      const seen = new Set();
    
      while (stack.length) {
        const graph = stack.pop();
        if (!graph || seen.has(graph)) {
          continue;
        }
        seen.add(graph);
        collected.push(graph);
    
        for (const graphNode of graph._nodes || []) {
          const childGraph = graphNode?.subgraph;
          if (childGraph && !seen.has(childGraph)) {
            stack.push(childGraph);
          }
        }
      }
    
      return collected;
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
