from server import PromptServer

class AleGroupBypasser:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {},
            "hidden": { "unique_id": "UNIQUE_ID" } # Captures node ID
        }

    RETURN_TYPES = ()
    FUNCTION = "execute"
    CATEGORY = "custom"

    def execute(self, unique_id, **kwargs):
        # FIX: Directly broadcast a custom socket event to the web interface
        PromptServer.instance.send_sync("my_custom_node_finished", {
            "node_id": unique_id,
            "resolved_value": false
        })
        return ()


NODE_CLASS_MAPPINGS = {
    "AleGroupBypasser": AleGroupBypasser,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AleGroupBypasser": "Ale Group Bypasser",
}
