import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { useAuth, useSignIn, useSignUp } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import signUp from './sign-up';

export default function SignIn() {

    const { signIn, errors, fetchStatus } = useSignIn();
    const { isSignedIn } = useAuth();

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");

    const isLoading = fetchStatus === 'fetching';


    const onSignInPress = async() => {
        const { error } = await signIn.password({
            emailAddress: email,
            password,
        });

        if(error) {
            alert(error.message);
            return;
        }

        if (signIn.status === "complete") {
            await signIn.finalize({
                navigate: ({ session, decorateUrl }) => {
                if (session?.currentTask) {
                    console.log(session?.currentTask);
                    return;
                }
                const url = decorateUrl("/");
                router.replace(url as any);
                },
            });
        } else if(signIn.status === "needs_second_factor" ) {
            await signIn.mfa.sendPhoneCode();
        }  else if(signIn.status === "needs_client_trust") {
            const emailFactor = signIn.supportedSecondFactors.find(
                (factor) => factor.strategy === "email_code"
            );

            if(emailFactor) {
                await signIn.mfa.sendEmailCode();
            }
        }
        else {
            console.error("Sign-in attempt not complete:", signIn);
        }
    };

    const onVerifyPress = async () => {
        await signIn.mfa.verifyEmailCode({
            code,
        });

        if (signIn.status === "complete") {
            await signIn.finalize({
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
        console.error("Sign-in attempt not complete:", signIn);
        }
    };

    if(signIn.status === 'needs_client_trust') {
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
                    onPress={() => signIn.mfa.sendEmailCode()}
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

                <Text className='text-3xl font-bold text-gray-800 mb-2'>Welcome Back</Text>
                <Text className='text-gray-500 mb-2'>Sign in to your account</Text>

                <TextInput 
                    className='w-full border border-gray-300 px-4 py-3 rounded-xl mb-4'
                    placeholder='Email address'
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#9CA3AF"
                    keyboardType='email-address'
                    autoCapitalize='none'
                />
                {errors.fields.identifier && (
                    <Text className='text-red-500 mb-4'>
                        {errors.fields.identifier.message}
                    </Text>
                )}

                <TextInput 
                    className='w-full border border-gray-300 px-4 py-3 rounded-xl mb-6'
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

                <TouchableOpacity
                    onPress={onSignInPress}
                    disabled={isLoading}
                    className='w-full py-4 bg-blue-600 rounded-xl items-center mb-4'
                >
                    {isLoading ? (
                        <ActivityIndicator color="white"/>
                    ): (
                        <Text className='text-white font-bold text-base'> Sign In</Text>
                    )}
                </TouchableOpacity>

                <View className='flex-row justify-center'>
                    <Text className='text-gray-500'>Don&apos;t have an account? </Text>
                        <Link href="/(auth)/sign-up">
                            <Text className='text-blue-500 font-semibold'>Sign Up</Text>
                        </Link>
                </View>

                <View nativeID='clerk-captcha'/>

            </View>
        </ScrollView>
    )
}