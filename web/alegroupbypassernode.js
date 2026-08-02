import { app } from "../../scripts/app.js";
import { ALEGROUPBYPASSER_SERVICE } from "./alegroupbypasser_service.js";

function refreshNode() {
  node = this;
  if(node._refreshInProgress) return;
  node._refreshInProgress = true;
  for(const group of ALEGROUPBYPASSER_SERVICE.group_collections) {
    const widget = node.addWidget(
      "toggle",
      widgetName,
      isBypassed,
      (value) => {
        const bypassed = Boolean(value);
        const latestEntry = getEntryByKey(node, entry.key);
        if (!latestEntry) {
          return;
        }
        stateStore[entry.key] = bypassed;
        applyModeToGroupTitle(node, latestEntry, bypassed);
      },
    );    
  }
  node.setSize([node.size[0], node.computeSize()[1]]);
  app.graph?.setDirtyCanvas?.(true, true);
  node._refreshInProgress = false;
  /*
  setTimeout(() => {
    refreshNode(node);
  }, 400);
  */
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
          refreshNode();
          return result;
        }
    },
  loadedGraphNode(node) {
    console.log("AAAAA");
  },
    
});
