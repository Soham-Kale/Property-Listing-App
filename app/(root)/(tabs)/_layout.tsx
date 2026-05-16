import { useUserStore } from "@/store/userStore";
import { useAuth } from "@clerk/expo";
import { router, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

function AndroidTabs() {
    const { signOut } = useAuth();
    const isAdmin = useUserStore((state) => state.isAdmin);

    const onPressSignOut = async () => {
        try {
        await signOut();
        router.replace("/sign-in");
        } catch (error) {
        alert("Error signing out: " + error);
        }
    };

    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                    <Ionicons name="home" color={color} size={size} />
                ),}}
            />
            <Tabs.Screen
                name="search"
                options={{
                    title: "Search",
                    tabBarIcon: ({ color, size }) => (
                    <Ionicons name="search" color={color} size={size} />
                ),}}
            />
            <Tabs.Screen
                name="create"
                options={{
                    title: "Add",
                    href: isAdmin ? undefined : null,
                    tabBarIcon: ({ color, size }) => (
                    <Ionicons name="add-circle" color={color} size={size} />
                ),}}
            />
            <Tabs.Screen
                name="saved"
                options={{
                    title: "saved",
                    tabBarIcon: ({ color, size }) => (
                    <Ionicons name="heart" color={color} size={size} />
                ),}}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "profile",
                    tabBarIcon: ({ color, size }) => (
                    <Ionicons name="person" color={color} size={size} />
                ),}}
            />
        </Tabs>
    );
}

function IOSTabs() {
    const { signOut } = useAuth();
    const isAdmin = useUserStore((state) => state.isAdmin);

    const onPressSignOut = async () => {
        try {
        await signOut();
        router.replace("/sign-in");
        } catch (error) {
        alert("Error signing out: " + error);
        }
    };

    return (
        <NativeTabs>
            <NativeTabs.Trigger name="index">
                <Label>Home</Label>
                <Icon sf="house.fill" />
            </NativeTabs.Trigger>
            <NativeTabs.Trigger name="search">
                <Icon sf="magnifyingglass" />
                <Label>Search</Label>
            </NativeTabs.Trigger>

            {isAdmin && (
                <NativeTabs.Trigger name="create">
                <Icon sf="plus.circle.fill" />
                <Label>Add Property</Label>
                </NativeTabs.Trigger>
            )}

            <NativeTabs.Trigger name="saved">
                <Icon sf="bookmark.fill" />
                <Label>Saved</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="profile">
                <Icon sf="person.circle" />
                <Label>Profile</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    );
}

export default function TabsLayout() {
    return Platform.OS === "ios" ? <IOSTabs /> : <AndroidTabs />;
}