import { app } from "../../scripts/app.js";

import { ALEGROUPBYPASSER_SERVICE } from "./alegroupbypasser_service.js";
const MODE_BYPASS = 4;
const EXCLUDE_KEY = "Exclude Group";
const ALTERNATE_KEY = "Alternate Group";

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

function addBooleanWidgetToNode(node, group) {
  const boolNode = node.addWidget(
        "toggle",
        group.title,
        (group.value===MODE_BYPASS) ? true : false,
        (value) => {
            ALEGROUPBYPASSER_SERVICE._updatingWidget++;
            const mode_val = (value===true) ? MODE_BYPASS : LiteGraph.ALWAYS;
            ALEGROUPBYPASSER_SERVICE.group_collections.get(group.key).value = mode_val;
            const available_groups = ALEGROUPBYPASSER_SERVICE.getAllGroups();
            for(const _group of available_groups.filter((available_group)=>available_group.title==group.title)) {
               ALEGROUPBYPASSER_SERVICE.processNodeInsideGroup(_group, mode_val, true);
            }
            const myAltGroupNames = [...new Set(parseSets(node.properties?.[ALTERNATE_KEY]  || "").get(group.title))];
            if(myAltGroupNames.length>0) {
                myAltGroupNames.forEach((alt_group_name) => {
                   for(const _group of available_groups.filter((available_group)=>available_group.title==alt_group_name)) {
                       ALEGROUPBYPASSER_SERVICE.processNodeInsideGroup(_group, (mode_val===4) ? 0 : 4, true);
                   }
                });
            }
            
            /*
            if(gc) {
                gc.value = mode_val;
                ALEGROUPBYPASSER_SERVICE.updateNodeInsideGroupByTitle(gc.title, mode_val);
                const myAltGroupNames = [...new Set(parseSets(node.properties?.[ALTERNATE_KEY]  || "").get(title))];
                if(myAltGroupNames.length>0) {
                    const available_groups = ALEGROUPBYPASSER_SERVICE.getAllGroups();
                   myAltGroupNames.forEach((alt_group_name) => {
                       for(const group of available_groups.filter((available_group)=>available_group.title==alt_group_name)) {
                           ALEGROUPBYPASSER_SERVICE.processNodeInsideGroup(group, (mode_val===4) ? 0 : 4, true);
                       }
                   });
                }
            }
            */
            ALEGROUPBYPASSER_SERVICE._updatingWidget--;
        },
          //function(value) { booleanWidgetCallback(value, key); },
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
    boolNode._hash_ref = group.hashref;
    return boolNode;
}
/*
function booleanWidgetCallback(value, key)
{
    const mode_val = (value===true) ? MODE_BYPASS : LiteGraph.ALWAYS;
    const gc = ALEGROUPBYPASSER_SERVICE.group_collections.get(key);
    if(gc) {
        gc.value = mode_val;
        ALEGROUPBYPASSER_SERVICE.updateNodeInsideGroupByTitle(gc.title, mode_val);
        const group_alternate = parseSets(node.properties?.[ALTERNATE_KEY]  || "");
    }
}
*/

function parseSets(str) {
  const group_map = new Map();
  if (!str?.trim()) return group_map;

  for (const part of str.split(",")) {
    // Split on ":" to get every member of this set
    //const members = part.split(":").map((s) => s.trim()).filter(Boolean);
    // only get member that exists in group_collections
    const groups = part.split(":").map((s) => s.trim()).filter(Boolean).filter(num => ALEGROUPBYPASSER_SERVICE.group_collections.has(num.trim().toLowerCase()));
    if (groups.length < 2) continue; // need at least a pair
      const group = groups[0];
      const others = groups.filter((_, j) => j !== 0);
        if (group_map.has(group)) {
            const entry = group_map.get(group);
            for (const o of others) {
              if (!entry.includes(o)) entry.push(o);
            }
        } else {
            group_map.set(group, others) ;
        }
  }
  return group_map;
}

function refreshWidgets(node) {
    if(node._refreshInProgress) return;
    var updated = false;
    var reevaluate_value = false;
    var prev_inputs = [];
    node._refreshInProgress = true;

    const signature = ALEGROUPBYPASSER_SERVICE._groupSignature+"|"+node.properties?.[EXCLUDE_KEY]+"|"+node.properties?.[ALTERNATE_KEY];
    
    if (node._groupSignature !== signature) {
        prev_inputs = node.inputs;
        node.widgets = [];
        node.inputs = [];
        reevaluate_value = true;
        node._groupSignature = signature;
    }

    const group_alternate = parseSets(node.properties?.[ALTERNATE_KEY]  || "");

    for(const [gkey, gval] of ALEGROUPBYPASSER_SERVICE.group_collections) {
        // skip exclude groups
        if (node.properties?.[EXCLUDE_KEY].split(":").includes(gval.title)) {
              continue;
          }
        if(!node.widgets || !node.widgets.find((w) => w._hash_ref === gval.hashref)) {
            const boolWidget = addBooleanWidgetToNode(node, gval);
            const link_num = prev_inputs.find((p)=>p.widget.name===gval.title && p.widget._hash_ref===gval.hashref)?.link || null;
            node.addInput(gval.title, "BOOLEAN", link_num);
            const slot = node.inputs.length-1;
            if(link_num!==null) {
                node.graph.getLink(link_num).target_slot = slot;
            } else {
                node.inputs[slot].widget = {  name : gval.title, _hash_ref : gval.hashref };
            }
            updated = true;
        }
        /*
        if(!node.widgets || !node.widgets.find((w) => w.name === gval.title)) {
            //if ((!node.widgets && !node.inputs.length) || (node.widgets && node.widgets.length===node.inputs.length)){
            //  node.addInput(val.title, "BOOLEAN");
            //}
            if(prev_inputs.length===0) node.addInput(val.title, "BOOLEAN");
            const boolWidget = addBooleanWidgetToNode(node, gval);
        */
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
        /*
          node.inputs[node.inputs.length - 1].widget = {  name : gval.title, _hash_ref : boolWidget._hash_ref };
              
          updated = true;
        } 
        */
      }

    /*
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
  */
    var seen = [];
    if(node.graph) {
        for(const link of  [...node.graph.links.values()].filter(m => m.target_id===node.id)) {
            // upstreamWidget = getUpstreamWidgetById(link, this.graph);
            const input_widget = node.inputs[link.target_slot].widget;
            if(!input_widget) continue;            
            const localWidget = node.widgets?.find((w)=>w.name===input_widget.name && w._hash_ref===input_widget._hash_ref);
            const upstreamWidget = ALEGROUPBYPASSER_SERVICE.getUpstreamWidgetByLink(link, node.graph);
            if(upstreamWidget && localWidget) {
                if (localWidget.value!=upstreamWidget.value || (reevaluate_value && group_alternate.has(localWidget.title))) {
                    seen.push(localWidget.name);
                    setWidgetValue(localWidget, upstreamWidget.value);
                    updated = true;
                /*
               localWidget.value = upstreamWidget.value;
               if (typeof localWidget.callback === "function") {
                    localWidget.callback(upstreamWidget.value);
                    updated = true;
                }
                */
                }
            }
        }
        if(reevaluate_value) {
            for(const widget of node.widgets) {
                if(group_alternate.has(widget.name) && (!seen.includes(widget.name))) {                    
                    setWidgetValue(widget, widget.value);
                    updated = true;
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
  }, 100);
  
}

function setWidgetValue(widget, value=null) {
    if(value!==null)
        widget.value = value;

    if (typeof widget.callback === "function") {
        widget.callback(widget.value);
    }
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
function findParentSubgraphNode(node) {
    if (node.graph && node.graph._subgraph_node) {
        return node.graph._subgraph_node;
    }
    // Fallback: search main canvas arrays if initialization is lagging
    if (app.graph && app.graph._nodes) {
        for (const outerNode of app.graph._nodes) {
            if (outerNode.subgraph && outerNode.subgraph._nodes) {
                if (outerNode.subgraph._nodes.includes(node)) {
                    return outerNode;
                }
            }
        }
    }
    return null;
}

// --- Helper: Bind callbacks directly between inner widgets and outer promoted proxies ---
function syncPromotedWidgetCallback(node, slotName) {
  const localWidget = node.widgets?.find(w => w.name === slotName);
  if (!localWidget) return;
  
  const parentSubgraphNode = findParentSubgraphNode(node);
  if (parentSubgraphNode) {
      // Locate the newly generated proxy widget exposed on the outer super-node frame
      const promotedWidget = parentSubgraphNode.widgets?.find(w => w.name === slotName || w.label === slotName);
      
      if (promotedWidget && !promotedWidget._is_hijacked) {
        const origPromotedCallback = promotedWidget.callback;
      
        // Hijack the top-level master proxy toggle box safely
        promotedWidget.callback = function(value) {
            origPromotedCallback?.apply(this, arguments);
            
            // Push the changed state down to our interior node widget
            localWidget.value = value;
            
            // FORCED TRIGGER: Instantly execute custom frontend logic callback
            if (typeof localWidget.callback === "function") {
                localWidget.callback(value);
            }
        };
        
        // Mark as hijacked to prevent endless callback attachment stacks
        promotedWidget._is_hijacked = true;
      
        // Foundational immediate value sync upon initial load/promotion
        if (promotedWidget.value !== undefined && localWidget.value !== promotedWidget.value) {
            localWidget.value = promotedWidget.value;
            if (typeof localWidget.callback === "function") {
                localWidget.callback(promotedWidget.value);
            }
        }
      }
  } else {

      
  }
}


app.registerExtension({
    name: "ale.group.bypasser",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (String(nodeData?.name || "") !== "AleGroupBypasser") {
          return;
        }

        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
          const result = originalOnNodeCreated?.apply(this, arguments);
            
        if (!this.properties || typeof this.properties !== "object") {
            this.properties = {};
        }
        if (typeof this.properties[ALTERNATE_KEY] !== "string") {
            this.properties[ALTERNATE_KEY] = "";
        }
        if (typeof this.properties[EXCLUDE_KEY] !== "string") {
            this.properties[EXCLUDE_KEY] = "";
        }

          bindNode(this);
          ALEGROUPBYPASSER_SERVICE.init();
          ALEGROUPBYPASSER_SERVICE.registerNode(this);     
          refreshWidgets(this);
            
          return result;
        };

        const origOnAdded = nodeType.prototype.onAdded;
        nodeType.prototype.onAdded = function(graph) {
            const result = origOnAdded?.apply(this, arguments);
            
            // Allow ComfyUI subgraph mappings a tiny calculation window to establish links
            setTimeout(() => {
                for (let i = 0; i < this.inputs.length; i++) {
                    syncPromotedWidgetCallback(this, this.inputs[i].name);
                }
            }, 100);

            return result;
        };
        
        const originalOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (info) {
         
          for(let i=0;i<info.inputs.length;i++) {

            if (this.widgets && this.widgets.find((w) => { return w._hash_ref===info.inputs[i].widget._hash_ref; })) continue;
              
            //this.addInput(info.inputs[i].name, info.inputs[i].type);
            const boolWidget = addBooleanWidgetToNode(this, info.inputs[i].name, info.widgets_values[i], info.inputs[i].name.trim().toLowerCase());

           // if(info.inputs[i].link) {
           //   boolWidget._inputslot_origin_id = app.graph.links[info.inputs[i].link].origin_id;
           // }
            //this.inputs[i].widget = boolWidget;
            //this.inputs[i].widget = JSON.parse(JSON.stringify(boolWidget, (key, value) => key === '_node' ? undefined : value));
            //this.inputs[i].widget.callback = function(value) { booleanWidgetCallback(value, info.inputs[i].name.trim().toLowerCase()); };
            this.inputs[i].widget = { name : info.inputs[i].name, _hash_ref : boolWidget._hash_ref };
          }
          
          const result = originalOnConfigure?.apply(this, arguments);
          // Ensure size updates after slots are generated
          this.setSize(this.computeSize());
          
          return result;
        };
      
      const origOnConnectionsChange = nodeType.prototype.onConnectionsChange;
      // 2. Override the prototype method for all nodes of this type
      nodeType.prototype.onConnectionsChange = function (side, slot, connect, link_info, output) {
          
          // 3. Always run the original LiteGraph/Comfy logic first to prevent UI breaking
          const result = origOnConnectionsChange?.apply(this, arguments);

           // --- Hook 4: Link Wire Alteration Fallback ---
          // 'side' or 'type': 1 = Input (Left side), 2 = Output (Right side)
          // 'connect': true if a wire was plugged in, false if a wire was removed
          if (side === 1 && this.inputs[slot] && output.widget && output.widget._hash_ref) {
              this.inputs[slot].widget = { name: this.inputs[slot].name, _hash_ref : output.widget._hash_ref };
              if(connect && link_info) {
                    const localWidget = this.widgets[link_info.target_slot];
                    const upstreamWidget = ALEGROUPBYPASSER_SERVICE.getUpstreamWidgetByLink(link_info, this.graph);
                    if(upstreamWidget && localWidget && localWidget.value!=upstreamWidget.value) {
                       localWidget.value = upstreamWidget.value;
                       if (typeof localWidget.callback === "function") {
                            localWidget.callback(upstreamWidget.value);
                            this.setDirtyCanvas(true, true);
                        }
                    }
                  /*
                  const graphContext = this.graph || app.graph;
                  const upstreamNode = graphContext.getNodeById(link_info.origin_id);
                  if(upstreamNode) {
                      const upstreamWidget = upstreamNode.widgets?.[0] || upstreamNode.widgets?.find(w => w.type === "toggle" || w.name === "value");
                      const realWidget = output.node.widgets.find((w) => { return w._hash_ref===output.widget._hash_ref; });
                      if(upstreamWidget && realWidget && upstreamWidget.value!==realWidget.value) {
                          localWidget.value = promotedWidget.value;
                          if (typeof localWidget.callback === "function") {
                              realWidget.callback(upstreamWidget.value);
                          }
                          this.setDirtyCanvas(true, true);
                      }
                  }
                  */
              }
          }

          /*
          if (side === 1 && output.node && output.node.widgets && output.widget) { 
              //this.slotConnectionChange(connect, link_info.origin_id, output_widget);
              const realWidget = output.node.widgets.find((w) => { return w._hash_ref===output.widget._hash_ref; });
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
        */

          // Always return the original execution result
          return result;
      }; 

        const origOnDrawBackground = nodeType.prototype.onDrawBackground;
        nodeType.prototype.onDrawBackground = function(ctx) {
            const result = origOnDrawBackground?.apply(this, arguments);
            //refreshWidgets(this);
            /*
            // Ensure callback structures remain bound when components are actively clicked
            for (let i = 0; i < this.inputs.length; i++) {
                const slotName = this.inputs[i].name;
            
                // Continually attempt to stitch the outer callback if unhijacked
                syncPromotedWidgetCallback(this, slotName);
            
                const parentNode = findParentSubgraphNode(this);
                if (parentNode) {
                    const promotedWidget = parentNode.widgets?.find(w => w.name === slotName || w.label === slotName);
                    const localWidget = this.widgets?.find(w => w.name === slotName);
                
                    if (promotedWidget && localWidget && localWidget.value !== promotedWidget.value) {
                        localWidget.value = promotedWidget.value;
                        if (typeof localWidget.callback === "function") {
                            localWidget.callback(promotedWidget.value);
                        }
                        this.setDirtyCanvas(true, true);
                    }
                }
            }
            for(const link of  [...this.graph.links.values()].filter(m => m.target_id===this.id)) {
                const upstreamNode = this.graph.getNodeById(link.origin_id);
                if(upstreamNode) {
                    const upstreamWidget = upstreamNode.widgets?.[0] || upstreamNode.widgets?.find(w => w.type === "toggle" || w.name === "value");
                    const localWidget = this.widgets.find((w) => { return w._hash_ref===this.inputs[link.target_slot].widget._hash_ref; });
                    if(upstreamWidget && localWidget && localWidget.value!=upstreamWidget.value) {
                        localWidget.value = upstreamWidget.value;
                        if (typeof localWidget.callback === "function") {
                            localWidget.callback(upstreamWidget.value);
                        }
                        this.setDirtyCanvas(true, true);
                    }
                }
            }
            */
            /*
            if(this.graph) {
                for(const link of  [...this.graph.links.values()].filter(m => m.target_id===this.id)) {
                    // upstreamWidget = getUpstreamWidgetById(link, this.graph);
                    const localWidget = this.widgets[link.target_slot];
                    const upstreamWidget = ALEGROUPBYPASSER_SERVICE.getUpstreamWidgetByLink(link, this.graph);
                    if(upstreamWidget && localWidget && localWidget.value!=upstreamWidget.value) {
                       localWidget.value = upstreamWidget.value;
                       if (typeof localWidget.callback === "function") {
                            localWidget.callback(upstreamWidget.value);
                            this.setDirtyCanvas(true, true);
                        }
                    }
                }
            }
            */
            
            return result;
        };
    },
    
  loadedGraphNode(node) {
    //console.log("AAAAA");
  },
});

    
