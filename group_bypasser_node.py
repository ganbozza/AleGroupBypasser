from server import PromptServer

class AleGroupBypasser:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {}}

    RETURN_TYPES = ()
    FUNCTION = "execute"
    CATEGORY = "Example"

    def execute(self, **kwargs):
        # FIX: Directly broadcast a custom socket event to the web interface
        PromptServer.instance.send_sync("my_custom_node_finished", {
            "resolved_value": false
        })
        return ()


NODE_CLASS_MAPPINGS = {
    "AleGroupBypasser": AleGroupBypasser,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "AleGroupBypasser": "Ale Group Bypasser",
}
