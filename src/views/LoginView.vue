<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div class="w-full max-w-md">
            <div class="bg-white rounded-lg shadow-xl p-8">
                <h1 class="text-3xl font-bold text-center text-gray-800 mb-2">Quản lý Tài liệu</h1>
                <p class="text-center text-gray-500 mb-8">Đăng nhập vào tài khoản của bạn</p>

                <Form :model="formData" layout="vertical" @finish="handleLogin" :loading="loading">
                    <FormItem label="Email" name="email" :rules="[
                        { required: true, message: 'Vui lòng nhập email' },
                        { type: 'email', message: 'Email không hợp lệ' },
                    ]">
                        <Input v-model:value="formData.email" placeholder="email@example.com" />
                    </FormItem>

                    <FormItem label="Mật khẩu" name="password"
                        :rules="[{ required: true, message: 'Vui lòng nhập mật khẩu' }]">
                        <InputPassword v-model:value="formData.password" placeholder="Mật khẩu" />
                    </FormItem>

                    <FormItem>
                        <Button type="primary" html-type="submit" block :loading="loading">
                            Đăng nhập
                        </Button>
                    </FormItem>
                </Form>

                <div class="text-center">
                    <p class="text-gray-600 text-sm">
                        Chưa có tài khoản?
                        <router-link to="/register" class="text-indigo-600 hover:text-indigo-700 font-semibold">
                            Đăng ký
                        </router-link>
                    </p>
                </div>

                <Alert v-if="error" type="error" :message="error" show-icon class="mt-4" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuthComposable'
import { Alert, Button, Form, FormItem, Input, InputPassword, message } from 'ant-design-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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
        message.success('Đăng nhập thành công!')
        router.push('/dashboard')
    } catch (err: any) {
        error.value = err?.response?.data?.message || 'Đăng nhập thất bại'
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
