<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="w-full max-w-md">
            <div class="bg-white rounded-lg shadow-xl p-8">
                <h1 class="text-3xl font-bold text-center text-gray-800 mb-2">Document Manager</h1>
                <p class="text-center text-gray-500 mb-8">Sign in to your account</p>

                <Form
                    :model="formData"
                    layout="vertical"
                    @finish="handleLogin"
                    :loading="loading"
                >
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
                        :rules="[{ required: true, message: 'Please enter password' }]"
                    >
                        <InputPassword v-model:value="formData.password" placeholder="Password" />
                    </FormItem>

                    <FormItem>
                        <Button type="primary" html-type="submit" block :loading="loading">
                            Sign In
                        </Button>
                    </FormItem>
                </Form>

                <div class="text-center">
                    <p class="text-gray-600 text-sm">
                        Don't have an account?
                        <router-link to="/register" class="text-indigo-600 hover:text-indigo-700 font-semibold">
                            Sign up
                        </router-link>
                    </p>
                </div>

                <Alert
                    v-if="error"
                    type="error"
                    :message="error"
                    show-icon
                    class="mt-4"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuthComposable'
import { message, Form, FormItem, Input, InputPassword, Button, Alert } from 'ant-design-vue'

const router = useRouter()
const { login } = useAuth()

const formData = ref({
    email: '',
    password: '',
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
    loading.value = true
    error.value = ''
    try {
        await login(formData.value.email, formData.value.password)
        message.success('Login successful!')
        router.push('/dashboard')
    } catch (err: any) {
        error.value = err?.response?.data?.message || 'Login failed'
        message.error(error.value)
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
:deep(.ant-form) {
    @apply space-y-4;
}
</style>
