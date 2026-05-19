import { View, Text, ScrollView, FlatList, TouchableOpacity, Image, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useUserStore } from '@/store/userStore';
import { Property } from '@/types';
import { useSupabase } from '@/hooks/useSupabase';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSavedProperty } from '@/hooks/useSavedProperty';
import { formatPrice } from '@/lib/utils';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

export default function PropertyDetails() {

    const { id } = useLocalSearchParams<{ id: string}>();
    const { userId } = useAuth();
    const router = useRouter();
    const isAdmin = useUserStore((store) => store.isAdmin);

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [imageViewerVisible, setImageViewerVisible] = useState(false);

    const authSupabase = useSupabase();

    const { isSaved, toggleSave, saveLoading } = useSavedProperty(id ?? "");

    const featchProperty = async() => {
        const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

        setProperty(data);
        setLoading(false);
    }

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveIndex(index);
    };

    useEffect(() => {
        featchProperty();
    }, [id])

    if(!property) {
        return (
            <View className='flex-1 items-center justify-center bg-white'>
                <Text className='text-gray-500'>Property not found</Text>
            </View>
        )
    }

    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
        property.longitude - 0.003}%2C${ property.latitude - 0.003}%2C${ property.longitude + 0.003}%2C${
            property.latitude + 0.003}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`;

    const isLongDesc = (property.description?.length ?? 0) > 150;
    const displayDesc =
    expanded || !isLongDesc
        ? property.description
        : property.description?.slice(0, 150) + "...";


    return (
        <View className='flex-1 bg-white'>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View>
                    <View style={{ opacity: property.is_sold ? 0.5 : 1 }}>
                        <FlatList
                            data={property.images}
                            keyExtractor={(_,i) => i.toString()}
                            renderItem={({item}) => (
                                <TouchableOpacity
                                    onPress={() => setImageViewerVisible(true)}
                                >
                                    <Image
                                        source={{ uri: item }}
                                        style={{ width, height: 300 }}
                                        resizeMode='cover'
                                        
                                    />
                                </TouchableOpacity>
                            )}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={onScroll}
                            scrollEventThrottle={16}
                        />
                    </View>

                    <View className='absolute bottom-3 right-4 bg-black/50 px-3 py-2 rounded-full '>
                        <Text className='text-white text-xs font-medium'>
                            {activeIndex+1}/{property.images.length}
                        </Text>
                        
                    </View>

                    <SafeAreaView className='absolute top-0 left-0 right-0'>
                        <View className='flex-row items-center justify-between px-4 pt-2'>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="w-10 h-10 bg-white rounded-full items-center justify-center"
                                style={{ elevation: 3 }}
                                >
                                <Ionicons name="arrow-back" size={20} color="#111827" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={toggleSave}
                                disabled={saveLoading}
                                className="w-10 h-10 bg-white rounded-full items-center justify-center"
                                style={{ elevation: 3 }}
                                >
                                <Ionicons
                                    name={isSaved ? "heart" : "heart-outline"}
                                    size={20}
                                    color={isSaved ? "#EF4444" : "#111827"}
                                />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </View>

                <View 
                    className='px-5 pt-5 pb-8'
                    style={{ opacity: property.is_sold ? 0.6 : 1 }}
                >
                    <View className="flex-row gap-2 mb-3 flex-wrap">
                        <View className="bg-blue-50 px-3 py-1 rounded-full">
                            <Text className="text-blue-600 text-xs font-semibold capitalize">
                                {property.type}
                            </Text>
                        </View>

                        {property.is_featured && (
                            <View className="bg-amber-50 px-3 py-1 rounded-full">
                                <Text className="text-amber-600 text-xs font-semibold">
                                    ⭐ Featured
                                </Text>
                            </View>
                        )}

                        {property.is_sold && (
                            <View className="bg-red-50 px-3 py-1 rounded-full">
                                <Text className="text-red-500 text-xs font-semibold">
                                    Sold
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text className="text-2xl font-bold text-gray-900 mb-1">
                        {property.title}
                    </Text>

                    <Text className="text-blue-600 text-xl font-bold mb-4">
                        {formatPrice(property.price)}
                    </Text>

                    <View className='flex-row justify-between bg-gray-50 rounded-2xl p-4 mb-5'>
                        <SpecItem
                            icon="bed-outline"
                            label="Beds"
                            value={`${property.bedrooms}`}
                        />
                        <SpecItem
                            icon="water-outline"
                            label="Baths"
                            value={`${property.bathrooms}`}
                        />
                        <SpecItem
                            icon="expand-outline"
                            label="Area"
                            value={`${property.area_sqft} ft²`}
                        />
                        <SpecItem
                            icon="home-outline"
                            label="Type"
                            value={`${property.type}`}
                        />
                    </View>

                    <Text className='text-base font-bold text-gray-900 mb-2'>
                        Description
                    </Text>
                    <Text className='text-gray-500 text-sm leading-6 mb-1'>
                        {displayDesc}
                    </Text>

                    {isLongDesc && (
                        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                            <Text className="text-blue-600 text-sm font-medium mb-5">
                            {expanded ? "Show less" : "Read more"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <Text className='text-base font-bold text-gray-900 mb-2 mt-5'>
                        Location
                    </Text>

                    <View className="flex-row items-center gap-2 mb-4">
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-500 text-sm flex-1">
                            {property.address}, {property.city}
                        </Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.9}
                        className='rounded-2xl overflow-hidden mb-6'
                        style={{
                            height: 200,
                            // borderRadius: 12,
                            // overflow: 'hidden',
                        }}
                    >
                        <WebView
                            source={{ uri: mapUrl }}
                            style={{ flex: 1 }}
                            scrollEnabled={false}
                            pointerEvents="none"
                        />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    )
}

function SpecItem({
    icon,
    label,
    value,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}) {
    return (
        <View className="items-center gap-1">
            <Ionicons name={icon} size={20} color="#2563EB" />

            <Text className="text-gray-900 font-bold text-sm">
                {value}
            </Text>

            <Text className="text-gray-400 text-xs">
                {label}
            </Text>
        </View>
    );
}