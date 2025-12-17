// Animation presets for components
export const fadeIn = {
    initial: { opacity: 0 },
    enter: { opacity: 1 }
}

export const slideUp = {
    initial: { opacity: 0, y: 20 },
    enter: { opacity: 1, y: 0 }
}

export const staggerChildren = {
    initial: {},
    enter: {
        transition: {
            staggerChildren: 0.1
        }
    }
}
