import { app } from "../../scripts/app.js";
import { ALEGROUPBYPASSER_SERVICE } from "./alegroupbypasser_service.js";

function bindNode(node) {
  if (node.__groupBypasserBound) {
    return;
  }
  node.__groupBypasserBound = true;

  const originalOnRemoved = node.onRemoved;
  node.onRemoved = function () {
    // Clean up service references safely when deleted from canvas
    ALEGROUPBYPASSER_SERVICE.unregisterNode(this);
    return originalOnRemoved?.apply(this, arguments);
  };
}

app.registerExtension({
    name: "ale.group.bypasser",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (String(nodeData?.name || "") !== "AleGroupBypasser") {
          console.log("OK: "+String(nodeData?.name || ""));
          return;
        }
        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
          const result = originalOnNodeCreated?.apply(this, arguments);
          bindNode(this);
          ALEGROUPBYPASSER_SERVICE.init();
          ALEGROUPBYPASSER_SERVICE.registerNode(this);
          return result;
        }

      /*
    init() {
        ALEGROUPBYPASSER_SERVICE.init();
    },

    registerCustomNodes() {
        class AleGroupBypasserControllerNode {
            constructor() {
                this.title = "Group Toggle Node";
                this.size =;
                this.shape = LiteGraph.BOX_SHAPE;

                // Add a dropdown widget matching LiteGraph mode constants:
                // LiteGraph.ALWAYS = 0 (Active)
                // LiteGraph.NEVER = 2  (Muted)
                // LiteGraph.BYPASS = 4 (Bypassed)
                this.modeWidget = this.addWidget(
                    "combo", 
                    "Group State", 
                    0, 
                    (value) => { this.onStateChanged(value); }, 
                    { values:, labels: ["Active", "Mute", "Bypass"] }
                );

                // Instantly register with our global manager
                ALEGROUPBYPASSER_SERVICE.registerController(this);
            }

            onStateChanged(newValue) {
                // Refresh the engine immediately when user changes the dropdown
                ALEGROUPBYPASSER_SERVICE.updateAllGroupsState();
            }

            onRemoved() {
                // Clean up service references safely when deleted from canvas
                ALEGROUPBYPASSER_SERVICE.unregisterController(this);
            }
        }

        LiteGraph.registerNodeType("AleGroupBypasserControllerNode", AleGroupBypasserControllerNode);
    }
    */
    },
  loadedGraphNode(node) {
    console.log("AAAAA");
  },
    
});
