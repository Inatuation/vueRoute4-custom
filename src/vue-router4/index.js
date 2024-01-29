import { createWebHistory } from './history/html5';
import { createWebHashHistory } from './history/hash';
import { shallowRef, computed, unref, reactive } from 'vue';
import { RouterLink } from './router-link';
import { RouterView } from './router-view';

/**
 * 标准化路由记录
 */
function normalizeRouteRecord(record) {
    return {
        path: record.path,
        name: record.name,
        children: record.children || [],
        beforeEnter: record.beforeEnter,
        components: {
            default: record.component
        }
    };
}

// 创建路由状态信息结构，即vue-router中返回给用户的$router
const STATE_LOCATIO_NORMALIZE = {
    push: '/', // 路由路径
    matched: [] // 匹配到的路由记录
};

/**
 * 构建路由配置信息的父子关系
 */
function createRouterRecordMatcher(record, parent) {
    const matcher = {
        path: record.path,
        record,
        children: [],
        parent
    };
    if (parent) {
        parent.children.push(matcher);
    }
    return matcher;
}

/**
 * 拍平路由配置信息
 * @param { Array } routes - 路由列表
 */
function createRouterMatcher(routes) {
    const matchers = [];
    function addRoute(record, parent) {
        const mainNoremalizeRecord = normalizeRouteRecord(record);
        const matcher = createRouterRecordMatcher(mainNoremalizeRecord, parent);
        if (mainNoremalizeRecord.children && mainNoremalizeRecord.children.length) {
            for (let i = 0; i < mainNoremalizeRecord.children.length; i++) {
                addRoute(mainNoremalizeRecord.children[i], matcher);
            }
        }
        matchers.push(matcher);
    }
    routes.forEach((route) => addRoute(route));
    /**
     * 匹配路由信息方法
     * @param {*} location - 路径
     * @return {Object} - STATE_LOCATIO_NORMALIZE
     * [HomeRecord, aRecord]
     */
    function resolve(location) {
        const matched = [];
        let matcher = matchers.find((item) => item.path === location);
        while (matcher) {
            matched.unshift(matcher.record); // 推入数组前面
            matcher = matcher.parent;
        }
        return {
            path: location,
            matched
        };
    }
    return {
        resolve
    };
}

/**
 * 创建路由器
 * @param {object} options - 路由器选项
 * @param {historyRouter} options.history - 路由模式
 * @param {array} options.routes - 路由列表
 * @returns {object} - 路由器实例
 */
function createRouter(options) {
    const historyRouter = options.history || createWebHistory(); // 默认使用history路由模式
    // 格式化用户配置的路由
    const matcher = createRouterMatcher(options.routes);
    // 需要具备响应式时，所以需要利用vue的方法，但是有一个弊端，如果响应式的话无法结构属性，结构会导致失去响应式
    // 先浅进行浅代理
    const currentRoute = shallowRef(STATE_LOCATIO_NORMALIZE);

    // 监听前进后退，匹配路由
    let ready;
    function markAsReady() {
        if (ready) return;
        historyRouter.listen((to) => {
            const targetLocation = matcher.resolve(to);
            const from = currentRoute.value;
            finalizeNavigation(targetLocation, from, true);
        });
    }

    function finalizeNavigation(to, from, replace) {
        if (from === STATE_LOCATIO_NORMALIZE || replace) {
            // 初次跳转用replace
            historyRouter.replace(to.path);
        } else {
            historyRouter.push(to.path);
        }
        currentRoute.value = to;
        // 调用一次监听浏览器前进后退, 触发路由重新匹配
        markAsReady();
    }

    function pushWithRedirect(to) {
        // 匹配路由matched记录
        const targetLocation = matcher.resolve(to);
        console.log(targetLocation);
        const from = currentRoute.value;
        finalizeNavigation(targetLocation, from);
    }

    function push(to) {
        return pushWithRedirect(to);
    }
    const router = {
        push,
        install(app) {
            // 注册的时候，将currentRoute所有属性，通过computed代理，这样就可以很方便的将值结构出来使用
            const reactiveRoute = {};
            for (let key in STATE_LOCATIO_NORMALIZE) {
                reactiveRoute[key] = computed(() => currentRoute.value[key]);
            }
            // 通过provide暴露方法给用户使用
            app.config.globalProperties.$router = router; // 路由方法
            Object.defineProperty(app.config.globalProperties, '$route', {
                enumerable: true, // 可枚举
                get: () => unref(currentRoute)
            });

            app.provide('route', reactive(reactiveRoute));
            app.provide('router location', router);
            app.component('RouterLink', RouterLink);
            app.component('RouterView', RouterView);

            // 初始化时，需要做一次默认跳转，将路由和浏览器的历史记录栈同步一次
            if (currentRoute.value === STATE_LOCATIO_NORMALIZE) {
                push(historyRouter.location);
            }
        }
    };
    return router;
}

export { createRouter, createWebHistory, createWebHashHistory };
