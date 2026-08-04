import { app } from "../../scripts/app.js";

import { ALEGROUPBYPASSER_SERVICE } from "./alegroupbypasser_service.js";
const MODE_BYPASS = 4;

function findNodeInAllGraphs(currentGraph, nodeId) {
    // 1. Check the current graph level
    let node = currentGraph.getNodeById(nodeId);
    if (node) return node;

    // 2. Iterate through all nodes on this level to find subgraphs
    for (const topNode of currentGraph._nodes) {
        // Check if the node acts as a subgraph container
        if (topNode.subgraph) {
            // Recursively search inside the subgraph
            node = findNodeInAllGraphs(topNode.subgraph, nodeId);
            if (node) return node;
        }
    }

    // 3. Return null if not found anywhere in this branch
    return null;
}

function addBooleanWidgetToNode(node, title, cvalue, key) {
  const boolNode = node.addWidget(
        "toggle",
        title,
        (cvalue===MODE_BYPASS) ? true : false,
          function(value) { booleanWidgetCallback(value, key); },
      /*
        (value) => {
          // Optional: callback when toggle changes
          const mode_val = (value===true) ? MODE_BYPASS : LiteGraph.ALWAYS;
          const gc = ALEGROUPBYPASSER_SERVICE.group_collections.get(key);
          gc.value = mode_val;
          ALEGROUPBYPASSER_SERVICE.updateNodeInsideGroupByTitle(gc.title, mode_val);
        },
        */
        { serialize: true }
      );
    boolNode._ref_hash = [...Array(12)].map(() => Math.random().toString(36)[2]).join('');
    return boolNode;
}

function booleanWidgetCallback(value, key)
{
    const mode_val = (value===true) ? MODE_BYPASS : LiteGraph.ALWAYS;
    const gc = ALEGROUPBYPASSER_SERVICE.group_collections.get(key);
    if(gc) {
        gc.value = mode_val;
        ALEGROUPBYPASSER_SERVICE.updateNodeInsideGroupByTitle(gc.title, mode_val);
    }
}

function refreshWidgets(node) {
  var updated = false;
  if(node._refreshInProgress) return;
  node._refreshInProgress = true;
  

  for(const [key, val] of ALEGROUPBYPASSER_SERVICE.group_collections) {
    if(!node.widgets || !node.widgets.find((w) => w.name === val.title)) {
      node.addInput(val.title, "BOOLEAN");
      const boolWidget = addBooleanWidgetToNode(node, val.title, val.value, key);
      /*
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
      */
      //node.inputs[node.inputs.length - 1].widget = boolWidget;
      //node.inputs[node.inputs.length - 1].widget = JSON.parse(JSON.stringify(boolWidget, (key, value) => key === '_node' ? undefined : value));
      node.inputs[node.inputs.length - 1].widget = {  name : val.title, _ref_hash : boolWidget._ref_hash };
               
      updated = true;
    } 
  }
  if(node.widgets) {
    for(const widget of node.widgets) {
      if(widget._inputslot_origin_id) {
         //var upstreamNode;
         //var upstreamWidget;
        try {
        //upstreamNode = app.graph.getNodeById(widget._inputslot_origin_id);
        let upstreamNode = findNodeInAllGraphs(app.graph, widget._inputslot_origin_id);
        const upstreamWidget = upstreamNode.widgets?.[0] || upstreamNode.widgets?.find(w => w.type === "toggle" || w.name === "value");
         if (upstreamWidget && typeof upstreamWidget.value !== undefined) {
           const upstreamValue = upstreamWidget.value;
           if(widget.value!=upstreamValue) {
             widget.value=upstreamValue;
             updated = true;
            if (typeof widget.callback === "function") {
                widget.callback(upstreamValue);
            }
           }
         }
        }catch(e) {
          console.log('a');
        }
      }
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
/*
function widgetCallback(value) {
    console.log("Widget callback explicitly executed with value:", value);
    // Put your frontend UI update properties logic here!
}
*/
/*
// Hook directly into the global websocket stream
api.addEventListener("my_custom_node_finished", (event) => {
    const data = event.detail;
    console.log("[FRONTEND WEB EVENT RECEIVED]", data);
    
    if (!data || !data.node_id) return;

    const targetNode = app.graph.getNodeById(data.node_id);
    if (targetNode) {
        const widget = targetNode.widgets.find(w => w.name === "dynamic_bool_input");
        if (widget) {
            // Force synchronize the state values
            widget.value = data.resolved_value;
            
            // Execute your custom widget properties trigger logic manually
            if (typeof widget.callback === "function") {
                widget.callback(data.resolved_value);
            }
            targetNode.setDirtyCanvas(true, true);
        }
    }
});
*/
function slotConnectionChange(connected, origin_id, target_widget) {
  if(connected)
  {
    
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
          /*
          const inputSlotName = "dynamic_bool_input";
          const inputSlot = this.addInput(inputSlotName, "BOOLEAN");
          
          const widgetCallback = function(value) {
              console.log("Widget Callback Executed! State:", value);
              // Add visual modifications here (e.g., node.color)
          };
          const boolWidget = this.addWidget("toggle", inputSlotName, false, widgetCallback);
          inputSlot.widget = boolWidget;
          */        
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

        const origOnAdded = nodeType.prototype.onAdded;
        nodeType.prototype.onAdded = function(graph) {
            const result = origOnAdded?.apply(this, arguments);
            
            // Allow ComfyUI subgraph mappings a tiny calculation window to establish links
            const count = this.properties?.boolCount || 0;
            setTimeout(() => {
                const localWidget = this.widgets?.find(w => w.name === "Group");
                if (!localWidget) return;
                }
            }, 100);

            return result;
        };
        const originalOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (info) {
          const result = originalOnConfigure?.apply(this, arguments);
          
          for(let i=0;i<info.inputs.length;i++) {

            if (!this.widgets || this.widgets.find((w) => { return w._ref_hash===info.inputs[i].widget._ref_hash; })) continue;
              
            //this.addInput(info.inputs[i].name, info.inputs[i].type);
            const boolWidget = addBooleanWidgetToNode(this, info.inputs[i].name, info.widgets_values[i], info.inputs[i].name.trim().toLowerCase());
            /*
              const boolWidget = this.addWidget(
                "toggle",
                info.inputs[i].name,
                info.widgets_values[i],
                (value) => {
                  // Optional: callback when toggle changes
                  const mode_val = (value===true) ? MODE_BYPASS : LiteGraph.ALWAYS;
                  const gc = ALEGROUPBYPASSER_SERVICE.group_collections.get(info.inputs[i].name.trim().toLowerCase());
                  gc.value = mode_val;
                  ALEGROUPBYPASSER_SERVICE.updateNodeInsideGroupByTitle(gc.title, mode_val);
                },
                { serialize: true }
              );
            */
            if(info.inputs[i].link) {
              boolWidget._inputslot_origin_id = app.graph.links[info.inputs[i].link].origin_id;
            }
            //this.inputs[i].widget = boolWidget;
            //this.inputs[i].widget = JSON.parse(JSON.stringify(boolWidget, (key, value) => key === '_node' ? undefined : value));
            this.inputs[i].widget = { name : info.inputs[i].name, _ref_hash : boolWidget._ref_hash };
            //this.inputs[i].widget.callback = function(value) { booleanWidgetCallback(value, info.inputs[i].name.trim().toLowerCase()); };
          }
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
      
      const origOnConnectionsChange = nodeType.prototype.onConnectionsChange;
      // 2. Override the prototype method for all nodes of this type
      nodeType.prototype.onConnectionsChange = function (side, slot, connect, link_info, output) {
          
          // 3. Always run the original LiteGraph/Comfy logic first to prevent UI breaking
          const result = origOnConnectionsChange?.apply(this, arguments);

          // --- Put your custom UI logic below this line ---
          
          // 'side' or 'type': 1 = Input (Left side), 2 = Output (Right side)
          // 'connect': true if a wire was plugged in, false if a wire was removed
          if (side === 1 && output.node && output.node.widgets && output.widget) { 
              //this.slotConnectionChange(connect, link_info.origin_id, output_widget);
              const realWidget = output.node.widgets.find((w) => { return w._ref_hash===output.widget._ref_hash; });
              if (realWidget) {
                  if (connect) {
                    if(link_info) {
                        const graphContext = this.graph || app.graph;
                        const link = graphContext.links[link_info.id];
                        if(link) {
                            realWidget._inputslot_origin_id = link_info.origin_id;
                            if(typeof realWidget.callback === "function") {
                                setTimeout(() => {
                                    const upstreamNode = graphContext.getNodeById(link.origin_id);
                                    if (upstreamNode) {
                                      realWidget.callback(upstreamNode.widgets?.[0].value);
                                    }
                                }, 1000);
                            }
                        }
                    }
                    console.log(`Wire plugged into input slot index: ${slot}`);
                  } else {
                      //const realWidget = output.node.widgets.find((w) => { return w.name===output.widget.name; });
                      delete realWidget._inputslot_origin_id;
                      console.log(`Wire removed from input slot index: ${slot}`);
                  }
              }
          }

          // Always return the original execution result
          return result;
      };      
    },
    /*
   // Use init() to attach the socket listener early in the boot lifecycle
    async init() {
        console.log("Custom extension initialized. Listening for WebSocket events...");

        api.addEventListener("my_custom_node_finished", (event) => {
            // ComfyUI pushes payloads into event.detail
            const data = event.detail; 
            console.log(">>> WebSocket custom event received! Data:", data);
            
            if (!data || !data.node_id) return;

            const targetNode = app.graph.getNodeById(data.node_id);
            if (targetNode) {
                const widget = targetNode.widgets.find(w => w.name === "dynamic_bool_input");
                if (widget) {
                    // Update frontend state
                    widget.value = data.resolved_value;
                    
                    // Manually fire the callback that ComfyUI naturally silences
                    if (typeof widget.callback === "function") {
                        widget.callback(data.resolved_value); 
                    }
                    
                    targetNode.setDirtyCanvas(true, true);
                }
            }
        });
    },
    */
  loadedGraphNode(node) {
    console.log("AAAAA");
  },
});


