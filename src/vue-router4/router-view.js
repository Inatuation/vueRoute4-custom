import { h, inject, provide, computed } from 'vue';

export const RouterView = {
    name: 'RouterView',
    setup(props, { slots }) {
        const depth = inject('depth', 0);
        // 注入route
        const injectRoute = inject('route')
        const matchedRouteRef = computed(() => injectRoute.matched[depth]);
        provide('depth', depth + 1);
        return () => {
            const matchRoute = matchedRouteRef.value;
            const viewComponents = matchRoute && matchRoute.components.default;

            if (!viewComponents) {
                // 没有组件，则渲染插槽内容
                return slots.default && slots.default();
            }
            return h(viewComponents);
        }
    }
}