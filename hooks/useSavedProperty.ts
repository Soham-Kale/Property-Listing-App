import { useAuth } from "@clerk/expo";
import { useSupabase } from "./useSupabase";
import { useEffect, useState } from "react";

export function useSavedProperty(
    propertyId: string,
    onUnSave?: () => void) {

    const { userId } = useAuth();
    const authSupabase = useSupabase();

    const [isSaved, setIsSaved] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    const checkIfSaved = async () => {
        if (!userId) return;

    const { data } = await authSupabase
        .from("saved_properties")
        .select("id")
        .eq("user_clerk_id", userId)
        .eq("property_id", propertyId)
        .single();

        setIsSaved(!!data);
    };

    useEffect(() => {
        checkIfSaved();
    }, [propertyId, userId]);

    const toggleSave = async () => {
        if(!userId || saveLoading) return;
        setSaveLoading(true);

        if(isSaved) {
            await authSupabase
            .from("saved_properties")
            .delete()
            .eq("user_clerk_id", userId)
            .eq("property_id", propertyId)

            setIsSaved(false);
            onUnSave?.();
        } else {
            await authSupabase.from("saved_properties").insert({
                user_clerk_id: userId,
                property_id: propertyId,
            })
            setIsSaved(true);
        }
        setSaveLoading(false);
    };

    return { isSaved, toggleSave, saveLoading };
}