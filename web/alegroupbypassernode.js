import { app } from "../../scripts/app.js";
//import { ALEGROUPBYPASSER_SERVICE } from "./alegroupbypasser_service.js";

function bindNode(node) {
  if (node.__groupBypasserBound) {
    return;
  }
  node.__groupBypasserBound = true;

}

app.registerExtension({
    name: "comfy.group.bypasser",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (!String(nodeData?.name || "") === "AleGroupBypasser") {
          return;
        }
    
        const originalOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
          const result = originalOnNodeCreated?.apply(this, arguments);
          //ALEGROUPBYPASSER_SERVICE.init();
          bindNode(this);
          return result;
        }
    },
  loadedGraphNode(node) {
    console.log("AAAAA");
  },
    
});
