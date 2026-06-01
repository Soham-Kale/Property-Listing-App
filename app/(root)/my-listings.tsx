import { useSupabase } from '@/hooks/useSupabase';
import { Property } from '@/types';
import { useAuth } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    FlatList,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { formatPrice } from '@/lib/utils';
import { SkeletonPropertyCard } from '@/components/SkeletonLoader';

export default function MyListingsScreen() {
    const router = useRouter();
    const { userId } = useAuth();
    const authSupabase = useSupabase();

    const [listings, setListings] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchListings = useCallback(async () => {
        if (!userId) { setLoading(false); return; }
        setLoading(true);
        const { data, error } = await authSupabase
            .from('properties')
            .select('*')
            .eq('owner_clerk_id', userId)
            .order('created_at', { ascending: false });

        if (!error) setListings(data ?? []);
        setLoading(false);
    }, [userId]);

    useFocusEffect(useCallback(() => { fetchListings(); }, [fetchListings]));

    const handleMenu = (property: Property) => {
        const options = property.is_sold
            ? ['Edit', 'Delete', 'Cancel']
            : ['Edit', 'Mark as Sold', 'Delete', 'Cancel'];
        const cancelIndex = options.length - 1;
        const destructiveIndex = options.indexOf('Delete');

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: destructiveIndex },
                (i) => handleAction(i, options[i], property)
            );
        } else {
            const androidOptions = options.filter(o => o !== 'Cancel');
            Alert.alert(property.title, 'Choose an action', [
                ...androidOptions.map(o => ({
                    text: o,
                    style: o === 'Delete' ? ('destructive' as const) : ('default' as const),
                    onPress: () => handleAction(androidOptions.indexOf(o), o, property),
                })),
                { text: 'Cancel', style: 'cancel' },
            ]);
        }
    };

    const handleAction = async (_index: number, action: string, property: Property) => {
        if (!userId) return;
        if (action === 'Edit') {
            router.push(`/(root)/edit-property/${property.id}`);
        } else if (action === 'Mark as Sold') {
            Alert.alert('Mark as Sold', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Mark Sold', onPress: async () => {
                        const { data, error } = await authSupabase
                            .from('properties').update({ is_sold: true })
                            .eq('id', property.id).eq('owner_clerk_id', userId)
                            .select();
                        if (!error && data && data.length > 0) fetchListings();
                        else Alert.alert('Error', 'Failed to mark as sold. Please try again.');
                    }
                },
            ]);
        } else if (action === 'Delete') {
            Alert.alert('Delete Listing', 'This cannot be undone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        const { error } = await authSupabase
                            .from('properties').delete()
                            .eq('id', property.id).eq('owner_clerk_id', userId);
                        if (!error) setListings(prev => prev.filter(p => p.id !== property.id));
                        else Alert.alert('Error', 'Failed to delete. Please try again.');
                    }
                },
            ]);
        }
    };

    return (
        <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="flex-row items-center px-5 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800 flex-1">My Listings</Text>
                <Text className="text-sm text-gray-400">{listings.length} total</Text>
            </View>

            {loading ? (
                <View className="px-5 pt-4">
                    {[1, 2, 3].map(i => <SkeletonPropertyCard key={i} />)}
                </View>
            ) : (
                <FlatList
                    data={listings}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push(`/(root)/property/${item.id}`)}
                            className="flex-row rounded-2xl mb-4 overflow-hidden bg-white"
                            style={{
                                shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
                                opacity: item.is_sold ? 0.6 : 1,
                            }}
                        >
                            <Image
                                source={item.images.length > 0 ? item.images[0] : require('@/assets/images/kribb.png')}
                                style={{ width: 112, height: 112 }}
                                contentFit="cover"
                                cachePolicy="memory-disk"
                            />
                            <View className="flex-1 p-3 justify-between">
                                <Text className="text-sm font-bold text-gray-800 mb-1" numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Text className="text-xs text-gray-500 mb-2">{item.city}</Text>
                                <Text className="text-blue-600 font-bold text-sm">{formatPrice(item.price)}</Text>
                                <View className="flex-row gap-2 mt-2">
                                    {item.is_sold && (
                                        <View className="bg-red-50 px-2 py-0.5 rounded-full">
                                            <Text className="text-red-500 text-xs font-semibold">Sold</Text>
                                        </View>
                                    )}
                                    {item.is_featured && (
                                        <View className="bg-amber-50 px-2 py-0.5 rounded-full">
                                            <Text className="text-amber-600 text-xs font-semibold">Featured</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleMenu(item)}
                                className="w-10 items-center justify-center"
                            >
                                <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View className="items-center py-24">
                            <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4">
                                <Ionicons name="home-outline" size={36} color="#3B82F6" />
                            </View>
                            <Text className="text-gray-700 text-lg font-bold mb-1">No listings yet</Text>
                            <Text className="text-gray-400 text-sm text-center px-8">
                                Properties you list will appear here
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(root)/(tabs)/create')}
                                className="mt-6 bg-blue-600 px-6 py-3 rounded-2xl"
                            >
                                <Text className="text-white font-semibold">Add a Property</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
