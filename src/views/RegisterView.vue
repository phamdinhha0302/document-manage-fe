<template>
    <div class="register-page">
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div class="w-full max-w-md">
                <div class="bg-white rounded-lg shadow-xl p-8">
                    <h1 class="text-3xl font-bold text-center text-gray-800 mb-2">Quản lý Tài liệu</h1>
                    <p class="text-center text-gray-500 mb-8">Tạo tài khoản của bạn</p>

                    <Form :model="formData" layout="vertical" @finish="handleRegister" :loading="loading">
                        <FormItem label="Họ tên" name="fullName"
                            :rules="[{ required: true, message: 'Vui lòng nhập họ tên' }]">
                            <Input v-model:value="formData.fullName" placeholder="Tên của bạn" />
                        </FormItem>

                        <FormItem label="Email" name="email" :rules="[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' },
                        ]">
                            <Input v-model:value="formData.email" placeholder="email@example.com" />
                        </FormItem>

                        <FormItem label="Mật khẩu" name="password" :rules="[
                            { required: true, message: 'Vui lòng nhập mật khẩu' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                        ]">
                            <InputPassword v-model:value="formData.password" placeholder="Mật khẩu" />
                        </FormItem>

                        <FormItem label="Xác nhận mật khẩu" name="confirmPassword" :rules="[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                            validatePasswordMatch(),
                        ]">
                            <InputPassword v-model:value="formData.confirmPassword" placeholder="Xác nhận mật khẩu" />
                        </FormItem>

                        <FormItem>
                            <Button type="primary" html-type="submit" block :loading="loading">
                                Đăng ký
                            </Button>
                        </FormItem>
                    </Form>

                    <div class="text-center">
                        <p class="text-gray-600 text-sm">
                            Đã có tài khoản?
                            <router-link to="/login" class="text-indigo-600 hover:text-indigo-700 font-semibold">
                                Đăng nhập
                            </router-link>
                        </p>
                    </div>

                    <a-alert v-if="error" type="error" :message="error" show-icon class="mt-4" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuthComposable'
import { Button, Form, FormItem, Input, InputPassword, message } from 'ant-design-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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
            return Promise.reject(new Error('Mật khẩu không khớp'))
        },
    }
}

const handleRegister = async () => {
    loading.value = true
    error.value = ''
    try {
        await register(formData.value.email, formData.value.password, formData.value.fullName)
        message.success('Đăng ký thành công! Vui lòng đăng nhập.')
        router.push('/login')
    } catch (err: any) {
        error.value = err?.response?.data?.message || 'Đăng ký thất bại'
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
