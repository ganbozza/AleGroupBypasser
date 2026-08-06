import { app } from "../../scripts/app.js";

const MODE_ACTIVE = LiteGraph.ALWAYS;
const MODE_BYPASS = 4;

function normalizeTitle(title) {
  return String(title || "").trim();
}

function getAllGroups(graphContext = app.graph) {
  let gatheredGroups = [];

  // 1. Grab all groups present in the current graph layer context
  if (graphContext._groups && graphContext._groups.length > 0) {
      for (const group of graphContext._groups) {
          // We append a helpful 'layer' property so you know exactly where this group lives
          gatheredGroups.push(group);
      }
  }

  // 2. Scan all nodes in this layer to check for nested Subgraphs
  if (graphContext._nodes) {
      for (const node of graphContext._nodes) {
          // Check if the node contains an internal nested subgraph
          if (node.subgraph && node.subgraph instanceof LGraph) {    
              // Recurse into the sub-graph layer and merge the results
              const subGroups = getAllGroups(node.subgraph);
              gatheredGroups = gatheredGroups.concat(subGroups);
          }
      }
  }

  return gatheredGroups;
}
class AleGroupBypasserService {
    constructor() {
        this.initialized = false;
        this._updatingWidget = false;
        this.nodes = new Set();
        this.group_collections = new Map();
    }

    init() {
        const self = this;
        if (self.initialized) return;
        self.initialized = true;

      // 1. Capture the original LiteGraph layout instantiation method safely
        const origGraphAdd = LGraph.prototype.add;
      // 2. Override the baseline graph prototype globally
        LGraph.prototype.add = function(obj, ...args) {
            //3. Run the native instantiation system first to ensure LiteGraph registers the object properties
            const result = origGraphAdd.apply(this, arguments);

          if (obj && obj.constructor && obj.constructor.name === "LGraphGroup") {
              self.addGroupToCollection(obj);
          }

          console.log("A new group is being added to the canvas!");
          return result;
        };
      /*
        if (typeof LGraphCanvas !== "undefined" && LGraphCanvas.onGroupAdd) {
            const originalOnGroupAdd = LGraphCanvas.onGroupAdd;
            LGraphCanvas.onGroupAdd = function(...args) {

                // 3. Execute the original logic so the group is actually created
                originalOnGroupAdd.apply(this, args);

                // 4. Retrieve the newly created group (it's the last one in the list)
                const group = app.graph._groups[app.graph._groups.length - 1];

                if (group) {
                    // add group to collection
                    self.addGroupToCollection(group);
                }
                console.log("A new group is being added to the canvas!");
            };
        }
        */

        // Intercept LiteGraph drawing loop
        
        const origDraw = LGraphCanvas.prototype.draw;
        LGraphCanvas.prototype.draw = function(...args) {
          if (!app.canvas.isDragging) {
            const available_groups = getAllGroups();
             for (const group of available_groups) {
                if(self.group_collections.has(normalizeTitle(group.title))) {
                    continue;
                }
                // add group to collection
                self.addGroupToCollection(group);
            }
            self.processGroupCollection(available_groups);
              
            // update widget state in each node
            self.syncNodesWidgetValue();            
          }
          return origDraw.apply(this, args);
        };
        
        console.log("AleGroupBypasser_Service initialized...");
    }

    syncNodesWidgetValue(ms=100) {
        if(this._updatingWidget) return;
        setTimeout(() => {
            for (const node of this.nodes) {
                if(node.widgets) {
                    for(const w of node.widgets) {
                      let widget = w;
                      const link = [...node.graph.links.values()].find((l)=>l.id===node.inputs[node.findInputSlot(w.name)]?.link);
                      if(link) {
                        widget = this.getUpstreamWidgetByLink(link, node.graph);
                      }
                      const group = this.group_collections.get(normalizeTitle(w.name).toLowerCase());
                      if(group && widget)
                      {
                        const group_toggle_value = (group.value===MODE_ACTIVE) ? false : true;
                        if(widget.value!==group_toggle_value) {
                          console.log("Changing value for "+w.name);               
                          widget.value = group_toggle_value;                           
                        }
                      }
                    }
                }
            }
        }, ms);    
    }
    
    findWidget(node, name) {
      return (node.widgets || []).find((widget) => widget.name === name);
    }    
  
    processGroupCollection(available_groups) {
      if(this.group_collections.size > available_groups.length) {
        const ag_titles = [];
        for (const ag of available_groups) {
          ag_titles.push(ag.title);
        }
        for (const [key, val] of this.group_collections) {
          if(!ag_titles.includes(val.title)) {
            this.group_collections.delete(key);              
            console.log("Group removed from collection...");
          }
        }
      }
      
      for (const [key, val] of this.group_collections) {
        for (const group of available_groups) {
          if (group.title==val.title) {
            const hasActiveNode = this.processNodeInsideGroup(group, MODE_BYPASS);
            if((val.value===MODE_BYPASS && hasActiveNode) || (val.value===MODE_ACTIVE && !hasActiveNode))
            {
              val.value = (val.value===MODE_BYPASS) ? MODE_ACTIVE : MODE_BYPASS;
              break;
            }
          }
        }
      }
    }
      
    addGroupToCollection(group) {
        const title = normalizeTitle(group.title);
        if(!title) { 
          return; 
        }
        const key = title.toLowerCase();
        if(!this.group_collections.has(key)) {
            this.group_collections.set(key, {
                key,
                title,
                value : MODE_BYPASS
            }); 
        }
    /*
        if (this.group_collections.get(key).value === MODE_BYPASS) { // ignore if group already in active state
          this.group_collections.get(key).value =  (this.processNodeInsideGroup(group, MODE_BYPASS)) ? MODE_ACTIVE : MODE_BYPASS;
        }
      */  
    }

    updateNodeInsideGroupByTitle(title, mode) {
       const available_groups = app.graph?._groups || [];
       for (const group of available_groups) {
          if(normalizeTitle(group.title)===title) {
              this.processNodeInsideGroup(group, mode, true);
          }
       }
    }
  
    processNodeInsideGroup(group, mode, is_set=false) {
         if (app.canvas.isDragging)
            return;

        for (const node of group.graph.nodes) {
            const nodeBounding = node.getBounding();
            const nodeCenter = nodeBounding &&
                [nodeBounding[0] + nodeBounding[2] * 0.5, nodeBounding[1] + nodeBounding[3] * 0.5];
            if (nodeCenter) {
                const grouBounds = group._bounding;
                if (nodeCenter[0] >= grouBounds[0] &&
                    nodeCenter[0] < grouBounds[0] + grouBounds[2] &&
                    nodeCenter[1] >= grouBounds[1] &&
                    nodeCenter[1] < grouBounds[1] + grouBounds[3]) {
                    if(node.mode!==mode) {
                      if(is_set) {
                        node.mode = mode;
                      } else {
                        //console.log("found opposite of mode : "+mode+" ...");
                        return true;
                    }
                  }
                }
            }
        }
        //if(!is_set)
        //  console.log("all bypassed...");
        return false;
    }
    
    getGroupNodes(group) {
        return Array.from(group._children).filter((c) => c instanceof LGraphNode);
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

  // inputs[1]._subgraphSlot.linkIds (subgraph punya input yg related dgn link id) dari link id tu boleh tgh node target_id & target_slot
// one liner : [...app.graph._nodes.values()].filter(m => m.subgraph).find((m) => m.subgraph.links === app.graph.nodes[2].subgraph.links).inputs.find((i)=>i._subgraphSlot.linkIds.find(li => li===2))
getUpstreamWidgetByLink(link, graphContext) {
    /*
    if(link.origin_id>0) {
        const upstreamNode = graphContext.getNodeById(link.origin_id);
        const next_link =  [...graphContext.links.values()].filter(m => m.target_id===upstreamNode.id);
        if(next_link)
            return getUpstreamNodeById(next_link, graphContext);
        return upstreamNode;
    }
    */
    if(link.origin_id>0) {
        const nextUpstreamLink = [...graphContext.links.values()].find(m => m.target_id===link.origin_id)
        if(nextUpstreamLink)
            return this.getUpstreamWidgetByLink(nextUpstreamLink, graphContext);
        return graphContext.getNodeById(link.origin_id).widgets[link.origin_slot];
    } 
    // upstream is subgraph
    return this.getUpstreamWidgetInSubgraphByLink(link, graphContext);
}

getUpstreamWidgetInSubgraphByLink(link, graphContext) {

    const upstreamSubgraph = [...graphContext._nodes.values()].filter(n => n.subgraph).find((n) => [...n.subgraph.links.values()].find((l)=>l===link));
    if(upstreamSubgraph) {
        // takyah kut ni : const inputSlot = inputs.find((i)=>i._subgraphSlot.linkIds.find(li => li===link.id))
        const nextUpstreamLink = upstreamSubgraph.inputs[link.origin_slot].link;
        if (nextUpstreamLink) {
            return this.getUpstreamWidgetByLink(upstreamSubgraph.graph.links.get(nextUpstreamLink), upstreamSubgraph.graph);
        }
        const widgetId = upstreamSubgraph.inputs[link.origin_slot].widgetId;
        return upstreamSubgraph.widgets.find((w)=>w.widgetId===upstreamSubgraph.inputs[link.origin_slot].widgetId);
    }
    /*
     [...app.graph._nodes.values()].filter(m => m.subgraph).find((m) => m.subgraph.links === app.graph.nodes[2].subgraph.links).inputs.find((i)=>i._subgraphSlot.linkIds.find(li => li===link.id))
    if(graphContext.links===link) {
        const subgraphNode = [...app.graph.nodes.values()].filter(m => m.subgraph).find((m) => m.subgraph.links === link);
        return graphContext;
    }
    
    // Iterate through all nodes on this level to find subgraphs
    if (graphContext._nodes) {
        for (const node of graphContext._nodes) {
          // Check if the node contains an internal nested subgraph
          if (node.subgraph && node.subgraph instanceof LGraph) {    
              // Recurse into the sub-graph layer and merge the results
              const upstreamWidget = findWidgetInSubgraphByLink(link, node.subgraph);
              if(upstreamWidget) {
                  return upstreamWidget;
              }
          }
        }
    }
    */
    return null;
}
}

export const ALEGROUPBYPASSER_SERVICE = new AleGroupBypasserService();
