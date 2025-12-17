<template>
    <div class="register-page">
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div class="w-full max-w-md">
                <div class="bg-white rounded-lg shadow-xl p-8">
                    <h1 class="text-3xl font-bold text-center text-gray-800 mb-2">Document Manager</h1>
                    <p class="text-center text-gray-500 mb-8">Create your account</p>

                    <Form
                        :model="formData"
                        layout="vertical"
                        @finish="handleRegister"
                        :loading="loading"
                    >
                        <FormItem
                            label="Full Name"
                            name="fullName"
                            :rules="[{ required: true, message: 'Please enter full name' }]"
                        >
                            <Input v-model:value="formData.fullName" placeholder="Your Name" />
                        </FormItem>

                        <FormItem
                            label="Email"
                            name="email"
                            :rules="[
                                { required: true, message: 'Please enter email' },
                                { type: 'email', message: 'Invalid email' },
                            ]"
                        >
                            <Input v-model:value="formData.email" placeholder="your@email.com" />
                        </FormItem>

                        <FormItem
                            label="Password"
                            name="password"
                            :rules="[
                                { required: true, message: 'Please enter password' },
                                { min: 6, message: 'Password must be at least 6 characters' },
                            ]"
                        >
                            <InputPassword v-model:value="formData.password" placeholder="Password" />
                        </FormItem>

                        <FormItem
                            label="Confirm Password"
                            name="confirmPassword"
                            :rules="[
                                { required: true, message: 'Please confirm password' },
                                validatePasswordMatch(),
                            ]"
                        >
                            <InputPassword v-model:value="formData.confirmPassword" placeholder="Confirm Password" />
                        </FormItem>

                        <FormItem>
                            <Button type="primary" html-type="submit" block :loading="loading">
                                Sign Up
                            </Button>
                        </FormItem>
                    </Form>

                    <div class="text-center">
                        <p class="text-gray-600 text-sm">
                            Already have an account?
                            <router-link to="/login" class="text-indigo-600 hover:text-indigo-700 font-semibold">
                                Sign in
                            </router-link>
                        </p>
                    </div>

                    <a-alert
                        v-if="error"
                        type="error"
                        :message="error"
                        show-icon
                        class="mt-4"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuthComposable'
import { message, Form, FormItem, Input, InputPassword, Button, Alert } from 'ant-design-vue'

const router = useRouter()
const { register } = useAuth()

const formData = ref({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
})

const loading = ref(false)
const error = ref('')

const validatePasswordMatch = () => {
    return {
        validator: (_: any, value: string) => {
            if (!value || value === formData.value.password) {
                return Promise.resolve()
            }
            return Promise.reject(new Error('Passwords do not match'))
        },
    }
}

const handleRegister = async () => {
    loading.value = true
    error.value = ''
    try {
        await register(formData.value.email, formData.value.password, formData.value.fullName)
        message.success('Registration successful! Please log in.')
        router.push('/login')
    } catch (err: any) {
        error.value = err?.response?.data?.message || 'Registration failed'
        message.error(error.value)
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
:deep(.ant-form) {
    margin-bottom: 24px;
}
</style>
