import { app } from "../../scripts/app.js";
import { ALEGROUPBYPASSER_SERVICE } from "./alegroupbypasser_service.js";
const MODE_BYPASS = 4;

function refreshWidgets(node) {
  var updated = false;
  if(node._refreshInProgress) return;
  node._refreshInProgress = true;
  
  for(const [key, val] of ALEGROUPBYPASSER_SERVICE.group_collections) {
    if(!node.widgets || !node.widgets.find((w) => w.name === val.title)) {
      node.addInput(val.title, "BOOLEAN");
      /*
      const boolWidget = node.addWidget(
                "toggle", 
                inputName, 
                false, 
                function(value) {
                    console.log("Toggle changed to:", value);
                }
            );
      */
      const boolWidget = node.addWidget(
        "toggle",
        val.title,
        (val.value===MODE_BYPASS) ? true : false,
        (value) => {
          // Optional: callback when toggle changes
          const mode_val = (value===true) ? MODE_BYPASS : LiteGraph.ALWAYS;
          const gc = ALEGROUPBYPASSER_SERVICE.group_collections.get(key);
          gc.value = mode_val;
          ALEGROUPBYPASSER_SERVICE.updateNodeInsideGroupByTitle(gc.title, mode_val);
        },
        { serialize: true }
      );
      // This hides the checkbox/toggle UI when a link wire is attached.
      node.inputs[node.inputs.length - 1].widget = boolWidget;
               
      updated = true;
    }
  }
  if(updated) {
    node.setSize([node.size[0], node.computeSize()[1]]);
    app.graph?.setDirtyCanvas?.(true, true);
  }
  node._refreshInProgress = false;
  setTimeout(() => {
    refreshWidgets(node);
  }, 400);
}

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

  const originalOnStateChanged = node.onStateChanged;
  node.onStateChanged = function() {
    console.log("State changed...");
  }
}

app.registerExtension({
    name: "ale.group.bypasser",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (String(nodeData?.name || "") !== "AleGroupBypasser") {
          //console.log("OK: "+String(nodeData?.name || ""));
          return;
        }
        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
          const result = originalOnNodeCreated?.apply(this, arguments);
          
          bindNode(this);
          ALEGROUPBYPASSER_SERVICE.init();
          ALEGROUPBYPASSER_SERVICE.registerNode(this);
          refreshWidgets(this);
          /*
          // Initialize counter on the node instance
          this.booleanCount = this.booleanCount || 0;
          const node = this;
          // Function to handle slot generation cleanly
          this.addDynamicBooleanInput = function(slotIndex) {
              const inputName = `boolean_${slotIndex}`;
              
              // 1. Create the link connection point on the left side
            node.addInput(inputName, "BOOLEAN");

            // 2. Create the toggle switch widget inside the node body
            // Arguments: (Widget Type, Name, Default Value, Callback)
            const boolWidget = node.addWidget(
                "toggle", 
                inputName, 
                false, 
                function(value) {
                    console.log("Toggle changed to:", value);
                }
            );

            // 3. Link the input slot to the widget.
            // This hides the checkbox/toggle UI when a link wire is attached.
            node.inputs[node.inputs.length - 1].widget = boolWidget;
            
          };

          // Add the trigger button widget
          this.addWidget(
              "button", 
              "Add Boolean Input", 
              null, 
              () => {
                  this.booleanCount++;
                  this.addDynamicBooleanInput(this.booleanCount);
                
                  // Redraw and scale bounding boxes safely
                  this.setSize(this.computeSize());
                  this.setDirtyCanvas(true, true);
              },
              { serialize: false } // Do not serialize the button configuration itself
          );
          */
          return result;
        }
        const originalOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (info) {
          const result = originalOnConfigure?.apply(this, arguments);
          /*
          // Read how many inputs existed when the workflow was saved
          if (info.inputs && info.inputs.length > 0) {
              // Reset the node slot memory to clear any defaults
              this.inputs = []; 
              this.booleanCount = 0;

              // Rebuild the programmatic inputs matching the exact count saved in JSON
              for (const inputInfo of info.inputs) {
                  if (inputInfo.name.startsWith("boolean_")) {
                      this.booleanCount++;
                      this.addDynamicBooleanInput(this.booleanCount);
                  }
              }
              
              // Ensure size updates after slots are generated
              this.setSize(this.computeSize());
          }
          */
          return result;
        }
    },
  loadedGraphNode(node) {
    console.log("AAAAA");
  },
});
