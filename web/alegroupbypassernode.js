import { app } from "../../scripts/app.js";
import { ALEGROUPBYPASSER_SERVICE } from "./alegroupbypasser_service.js";

function refreshWidgets(node) {
  var updated = false;
  if(node._refreshInProgress) return;
  node._refreshInProgress = true;
  
  for(const [key, val] of ALEGROUPBYPASSER_SERVICE.group_collections) {
    if(!node.widgets.find((w) => w.name === val.title))
    {
      const widget = node.addWidget(
        "toggle",
        val.title,
        val.value,
        (value) => {
          // Optional: callback when toggle changes
        },
        { serialize: true }
      );
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
          return result;
        }
        const originalOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function () {
          const result = originalOnConfigure?.apply(this, arguments);
          console.log("CCC");
          return result;
        }
    },
  loadedGraphNode(node) {
    console.log("AAAAA");
  },
  _refreshNode() {
    refreshNode(this); 
  }
});
