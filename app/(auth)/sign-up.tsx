import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { useAuth, useSignUp } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';

export default function SignUp() {

    const { signUp, errors, fetchStatus } = useSignUp();
    const { isSignedIn } = useAuth();

    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [isAdminRole, setIsAdminRole] = useState(false);

    const isLoading = fetchStatus === 'fetching';

    if(signUp.status === "complete" || isSignedIn) {
        return null;
    }

    const onSignUpPress = async() => {
        const { error } = await signUp.password({
            emailAddress: email,
            password,
            firstName,
            lastName,
            unsafeMetadata: { isAdmin: isAdminRole },
        });

        if(error) {
            alert(error.message);
            // console.error(JSON.stringify(error.message, null, 2));
            return;
        }

        if(!error) {
            await signUp.verifications.sendEmailCode();
        }
    };

    const onVerifyPress = async () => {
        await signUp.verifications.verifyEmailCode({
        code,
        });

        if (signUp.status === "complete") {
            await signUp.finalize({
                navigate: ({ session, decorateUrl }) => {
                if (session?.currentTask) {
                    console.log(session?.currentTask);
                    return;
                }
                const url = decorateUrl("/");
                router.replace(url as any);
                },
            });
        } else {
        console.error("Sign-up attempt not complete:", signUp);
        }
    };

    if(
        signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields.includes('email_address') &&
        signUp.missingFields.length === 0
    ) {
        return (
            <View className='flex-1 justify-center px-6 py-12'>
                <Image
                    source={require("../../assets/images/kribb.png")}
                    className='w-32 h-16 mb-8'
                    resizeMode='contain'
                />

                <Text className='text-3xl font-bold text-gray-800 mb-2'>Verify Your Account {" "}</Text>
                <Text className='text-gray-500 mb-2'>We send code to {email}</Text>

                <View className='flex-row gap-3 mb-4'>
                    <TextInput 
                        className='flex-1 border border-gray-300 px-4 py-3 rounded-xl'
                        placeholder='Enter verification code'
                        value={code}
                        onChangeText={setCode}
                        placeholderTextColor="#9CA3AF"
                        keyboardType='number-pad'
                    />
                    {errors.fields.password && (
                    <Text className='text-red-500 mb-4'>
                        {errors.fields.password.message}
                    </Text>
                )}
                </View>

                <TouchableOpacity
                    onPress={onVerifyPress}
                    disabled={isLoading}
                    className='w-full py-4 bg-blue-600 rounded-xl items-center mb-4'
                >
                    {isLoading ? (
                        <ActivityIndicator color="white"/>
                    ): (
                        <Text className='text-white font-bold text-base'> Verify</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => signUp.verifications.sendEmailCode()}
                    className='py-2'
                >
                    {isLoading ? (
                        <ActivityIndicator color="white"/>
                    ): (
                        <Text className='text-blue-600'>I need a new code</Text>
                    )}
                </TouchableOpacity>
            </View>
        )
    }

    return (
        <ScrollView 
            contentContainerStyle={{ flexGrow: 1 }}
            className="bg-white"
            keyboardShouldPersistTaps="handled"
        >
            <View className='flex-1 justify-center px-6 py-12'>
                <Image
                    source={require("../../assets/images/kribb.png")}
                    className='w-32 h-16 mb-8'
                    resizeMode='contain'
                />

                <Text className='text-3xl font-bold text-gray-800 mb-2'>Create Account</Text>
                <Text className='text-gray-500 mb-2'>Find your dream home today</Text>

                <View className='flex-row gap-3 mb-4'>
                    <TextInput 
                        className='flex-1 border border-gray-300 px-4 py-3 rounded-xl'
                        placeholder='First name'
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize='words'
                    />

                    <TextInput 
                        className='flex-1 border border-gray-300 px-4 py-3 rounded-xl'
                        placeholder='Last name'
                        value={lastName}
                        onChangeText={setLastName}
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize='words'
                    />
                </View>

                <TextInput 
                    className='w-full border border-gray-300 px-4 py-3 rounded-xl mb-4'
                    placeholder='Email address'
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#9CA3AF"
                    keyboardType='email-address'
                    autoCapitalize='none'
                />
                {errors.fields.emailAddress && (
                    <Text className='text-red-500 mb-4'>
                        {errors.fields.emailAddress.message}
                    </Text>
                )}

                <TextInput
                    className='w-full border border-gray-300 px-4 py-3 rounded-xl mb-4'
                    placeholder='Password'
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                />
                {errors.fields.password && (
                    <Text className='text-red-500 mb-4'>
                        {errors.fields.password.message}
                    </Text>
                )}

                <Text className='text-gray-600 mb-2 font-medium'>I am signing up as</Text>
                <View className='flex-row mb-6 rounded-xl overflow-hidden border border-gray-300'>
                    <TouchableOpacity
                        onPress={() => setIsAdminRole(false)}
                        className={`flex-1 py-3 items-center ${!isAdminRole ? 'bg-blue-600' : 'bg-white'}`}
                    >
                        <Text className={`font-semibold ${!isAdminRole ? 'text-white' : 'text-gray-600'}`}>User</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setIsAdminRole(true)}
                        className={`flex-1 py-3 items-center ${isAdminRole ? 'bg-blue-600' : 'bg-white'}`}
                    >
                        <Text className={`font-semibold ${isAdminRole ? 'text-white' : 'text-gray-600'}`}>Admin</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={onSignUpPress}
                    disabled={isLoading}
                    className='w-full py-4 bg-blue-600 rounded-xl items-center mb-4'
                >
                    {isLoading ? (
                        <ActivityIndicator color="white"/>
                    ): (
                        <Text className='text-white font-bold text-base'> Sign Up</Text>
                    )}
                </TouchableOpacity>

                <View className='flex-row justify-center'>
                    <Text className='text-gray-500'>Already have an account? </Text>
                        <Link href="/(auth)/sign-in">
                            <Text className='text-blue-500 font-semibold'>Sign In</Text>
                        </Link>
                </View>

                <View nativeID='clerk-captcha'/>

            </View>
        </ScrollView>
    )
}