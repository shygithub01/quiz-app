import * as React from "react";
import { toast as sonnerToast } from "sonner";
export const useToast = () => {
    const toast = React.useCallback((props) => {
        if (props.variant === "destructive") {
            sonnerToast.error(props.title || "Error", {
                description: props.description,
            });
        }
        else {
            sonnerToast.success(props.title || "Success", {
                description: props.description,
            });
        }
    }, []);
    return { toast };
};
export { sonnerToast as toast };
