import { View, Text, ScrollView, FlatList, TouchableOpacity, Image, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Linking, Alert, ActivityIndicator, Share, TextInput } from 'react-native'
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
import ImageViewing from 'react-native-image-viewing';

const { width } = Dimensions.get('window');

const ADMIN_PHONE = "7721027579";

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
    const [emiOpen, setEmiOpen] = useState(false);
    const [emiLoan, setEmiLoan] = useState('');
    const [emiRate, setEmiRate] = useState('8.5');
    const [emiTenure, setEmiTenure] = useState('20');

    const authSupabase = useSupabase();

    const { isSaved, toggleSave, saveLoading } = useSavedProperty(id ?? "");

    const fetchProperty = async() => {
        const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

        if (error) {
            Alert.alert("Error", "Failed to load property. Please try again.");
        }
        setProperty(data);
        setLoading(false);
    }

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveIndex(index);
    };

    const handleShare = async () => {
        if (!property) return;
        await Share.share({
            message: `${property.title} — ${formatPrice(property.price)}\n${property.address}, ${property.city}\n\nFind it on Kribb!`,
        });
    };

    const handleContactAgent = () => {
        const message = `Hi! I'm interested in the property: ${property?.title}`;

        const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(
            message
        )}`;

        Linking.openURL(url);
    };

    const handleMarkSold = () => {
        Alert.alert("Mark as Sold", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Mark Sold",
                onPress: async () => {
                    const { error } = await authSupabase
                        .from("properties")
                        .update({ is_sold: true })
                        .eq("id", id);

                    if (error) {
                        Alert.alert("Error", "Failed to mark as sold. Please try again.");
                        return;
                    }
                    setProperty((prev) => prev ? { ...prev, is_sold: true } : prev);
                },
            },
        ]);
    };

    const handleDelete = () => {
        Alert.alert("Delete Property", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const { error } = await authSupabase
                        .from("properties")
                        .delete()
                        .eq("id", id);

                    if (error) {
                        Alert.alert("Error", "Failed to delete property. Please try again.");
                        return;
                    }
                    router.replace("/(root)/(tabs)");
                },
            },
        ]);
    };

    useEffect(() => {
        fetchProperty();
    }, [id])

    if (!property) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" />
                ) : (
                    <Text className="text-gray-500">Property not found</Text>
                )}
            </View>
        );
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

                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={handleShare}
                                    className="w-10 h-10 bg-white rounded-full items-center justify-center"
                                    style={{ elevation: 3 }}
                                >
                                    <Ionicons name="share-outline" size={20} color="#111827" />
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
                        onPress={() =>
                            router.push({
                                pathname: "/(root)/property/map",
                                params: {
                                latitude: property.latitude,
                                longitude: property.longitude,
                                title: property.title,
                                address: `${property.address}, ${property.city}`,
                                },
                            })
                        }
                        activeOpacity={0.9}
                        className='rounded-2xl overflow-hidden mb-6'
                        style={{ height: 200 }}
                    >
                        <WebView
                            source={{ uri: mapUrl }}
                            style={{ flex: 1 }}
                            scrollEnabled={false}
                            pointerEvents="none"
                        />

                        <View className='absolute bottom-3 right-3 bg-white/50 px-3 py-1 rounded-full items-center flex-row gap-1'>
                            <Ionicons name='expand-outline' size={12} color="374151"/>
                            <Text className='text-gray-600 text-xs font-medium'>
                                Tap to expand
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleContactAgent}
                        className='flex-row items-center justify-center bg-green-600 gap-2 py-4 rounded-2xl mb-4'>
                        <Ionicons name='logo-whatsapp' size={20} color="white"/>
                        <Text className='text-white font-bold text-base'>Contact Agent</Text>
                    </TouchableOpacity>

                    {/* EMI Calculator */}
                    <TouchableOpacity
                        onPress={() => {
                            setEmiOpen(v => !v);
                            if (!emiLoan) setEmiLoan(String(property.price));
                        }}
                        className='flex-row items-center justify-between bg-blue-50 px-4 py-4 rounded-2xl mb-3 border border-blue-100'
                    >
                        <View className='flex-row items-center gap-2'>
                            <Ionicons name='calculator-outline' size={20} color="#2563EB" />
                            <Text className='text-blue-700 font-semibold text-base'>EMI Calculator</Text>
                        </View>
                        <Ionicons name={emiOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#2563EB" />
                    </TouchableOpacity>

                    {emiOpen && (() => {
                        const P = Math.max(0, Number(emiLoan) || 0);
                        const r = Math.max(0, (Number(emiRate) || 0) / 12 / 100);
                        const n = Math.max(0, Math.floor((Number(emiTenure) || 0) * 12));
                        const emi = n === 0 ? 0
                            : r === 0 ? P / n
                            : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                        const total = n === 0 ? 0 : r === 0 ? P : emi * n;
                        const interest = n === 0 ? 0 : total - P;
                        return (
                            <View className='bg-white border border-gray-200 rounded-2xl p-4 mb-4'>
                                <View className='gap-3 mb-4'>
                                    <View>
                                        <Text className='text-xs font-semibold text-gray-600 mb-1'>Loan Amount (₹)</Text>
                                        <TextInput
                                            value={emiLoan}
                                            onChangeText={setEmiLoan}
                                            keyboardType='numeric'
                                            className='bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800'
                                        />
                                    </View>
                                    <View className='flex-row gap-3'>
                                        <View className='flex-1'>
                                            <Text className='text-xs font-semibold text-gray-600 mb-1'>Interest Rate (%)</Text>
                                            <TextInput
                                                value={emiRate}
                                                onChangeText={setEmiRate}
                                                keyboardType='numeric'
                                                className='bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800'
                                            />
                                        </View>
                                        <View className='flex-1'>
                                            <Text className='text-xs font-semibold text-gray-600 mb-1'>Tenure (years)</Text>
                                            <TextInput
                                                value={emiTenure}
                                                onChangeText={setEmiTenure}
                                                keyboardType='numeric'
                                                className='bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-800'
                                            />
                                        </View>
                                    </View>
                                </View>
                                <View className='bg-blue-50 rounded-xl p-3 gap-2'>
                                    <View className='flex-row justify-between'>
                                        <Text className='text-gray-600 text-sm'>Monthly EMI</Text>
                                        <Text className='text-blue-700 font-bold text-sm'>{formatPrice(Math.round(emi))}</Text>
                                    </View>
                                    <View className='flex-row justify-between'>
                                        <Text className='text-gray-600 text-sm'>Total Payment</Text>
                                        <Text className='text-gray-800 font-semibold text-sm'>{formatPrice(Math.round(total))}</Text>
                                    </View>
                                    <View className='flex-row justify-between'>
                                        <Text className='text-gray-600 text-sm'>Total Interest</Text>
                                        <Text className='text-red-500 font-semibold text-sm'>{formatPrice(Math.round(interest))}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })()}

                    {isAdmin && property.owner_clerk_id === userId && (
                        <View className='gap-3'>
                            <TouchableOpacity
                                onPress={() => router.push(`/(root)/edit-property/${property.id}`)}
                                className='flex-row items-center justify-center gap-2 bg-blue-600 py-4 rounded-2xl'
                                style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
                            >
                                <Ionicons name='create-outline' size={18} color="white" />
                                <Text className='text-white font-bold'>Edit Listing</Text>
                            </TouchableOpacity>
                            <View className='flex-row gap-3'>
                                {!property.is_sold && (
                                    <TouchableOpacity
                                        onPress={handleMarkSold}
                                        className='flex-1 flex-row items-center justify-center gap-2 bg-amber-50 py-4 rounded-2xl border border-amber-200'>
                                        <Ionicons name='checkmark-circle-outline' size={18} color="#D97706" />
                                        <Text className='text-amber-600 font-semibold'>Mark Sold</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    onPress={handleDelete}
                                    className='flex-1 flex-row items-center justify-center gap-2 bg-red-50 py-4 rounded-2xl border border-red-200'>
                                    <Ionicons name='trash-outline' size={18} color="#EF4444" />
                                    <Text className='text-red-500 font-semibold'>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            <ImageViewing
                images={property.images.map((uri) => ({ uri }))}
                imageIndex={activeIndex}
                visible={imageViewerVisible}
                onRequestClose={() => setImageViewerVisible(false)}
            />
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