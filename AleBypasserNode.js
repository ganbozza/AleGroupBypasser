// your_group_node.js
import { app } from "../../../scripts/app.js";
import { ALEBYPASSER_GROUP_SERVICE } from "./alebypasser_groupservice.js";

app.registerExtension({
    name: "Ale.AleGroupBypasser",
    
    init() {
        ALEBYPASSER_GROUP_SERVICE.init();
    },

    registerCustomNodes() {
        class AleBypassControllerNode {
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
                ALEBYPASSER_GROUP_SERVICE.registerController(this);
            }

            onStateChanged(newValue) {
                // Refresh the engine immediately when user changes the dropdown
                ALEBYPASSER_GROUP_SERVICE.updateAllGroupsState();
            }

            onRemoved() {
                // Clean up service references safely when deleted from canvas
                ALEBYPASSER_GROUP_SERVICE  .unregisterController(this);
            }
        }

        LiteGraph.registerNodeType("AleBypassControllerNode", AleBypassControllerNode);
    }
});
