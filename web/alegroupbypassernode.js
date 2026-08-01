// your_group_node.js
import { app } from "../../../scripts/app.js";
import { ALEGROUPBYPASSER_SERVICE } from "./alegroupbypasser_service.js";

app.registerExtension({
    name: "Ale.AleGroupBypasser",
    
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
});
