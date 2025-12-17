import { readonly, ref } from 'vue'
import { useRouter } from 'vue-router'

const activeSection = ref('home')

export const useNavigation = () => {
    const router = useRouter()

    const setActiveSection = (section: string) => {
        activeSection.value = section
    }

    const gotoLink = (key: string) => {
        router.push({ name: key as any })
        setActiveSection(key)

        // Scroll to top of page
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    const initializeActiveSection = () => {
        const currentPath = window.location.pathname.substring(1) || 'home'
        setActiveSection(currentPath)
    }

    return {
        activeSection: readonly(activeSection),
        setActiveSection,
        gotoLink,
        initializeActiveSection
    }
}
