import { h, inject } from 'vue';

function useLink(props) {
    const router = inject('router location');
    function navigate() {
        console.log('跳转')
        router.push(props.to);
    }
    return {
        navigate
    };
}

export const RouterLink = {
    name: 'RouterLink',
    props: {
        to: {
            type: String,
            default() {
                return '/';
            }
        }
    },
    setup(props, { slots }) {
        const link = useLink(props);
        return () =>
            h(
                'a',
                {
                    onClick: link.navigate
                },
                slots.default && slots.default()
            );
    }
};
