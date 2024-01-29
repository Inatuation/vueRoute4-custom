// 创建当前url信息
function createCurrentHistoryLocation(base) {
    const { hash, pathname, search } = window.location;
    let hashUrl = hash;
    const hasWell = base.indexOf("#") > -1;
    if (hasWell) {
        hashUrl = hashUrl.slice(1) === '' ? '' : hashUrl.slice(2); // 如果是空补充/
    }
    // pathname url路径
    // hash url哈希值#
    // seach url查询参数
    return pathname + hashUrl + search;
}

/**
 * 构建浏览器的历史记录状态
 * @param {string} from 来源路径
 * @param {string} current 当前路径
 * @param {string} to 目标路径
 * @param {Boolean} replace 是否替换记录栈
 * @param {Boolean} computedScroll 是否保存scoll位置
 */
function buildHistoryState(from, current, to, replace = false, computedScroll = false) {
    return {
        from,
        current,
        to,
        replace,
        computedScroll: computedScroll
            ? {
                  x: window.scrollX,
                  y: window.scrollY
              }
            : {},
        position: window.history.length - 1 // 当前历史记录栈的位置,浏览器的历史记录栈默认是从2开始的
    };
}

// 包含路由状态，属性，方法
function useHistoryStateNavigation(base) {
    // 当前窗口的URL信息
    const currentLocation = {
        value: createCurrentHistoryLocation(base)
    };
    // 获取当前的浏览器历史记录状态,初始值是空的
    const historyState = {
        value: window.history.state
    };
    // 当历史记录状态为空，进行初始化历史记录状态
    if (!historyState.value) {
        const state = buildHistoryState(null, currentLocation.value, null, true);
        // 初始化到浏览器历史记录中保存
        changeLocation(currentLocation.value, state, true);
    }

    /**
     * 通过history pushState跳转浏览器记录
     * @param {string} to 目标路径
     * @param {Object} state 路由状态
     * @param {Boolean} isReplace 是否调用replace方法替换记录
     */
    function changeLocation(to, state, isReplace) {
        const hasWell = base.indexOf("#") > -1;
        const url = hasWell > -1 ? base + to : to;
        window.history[isReplace ? 'replaceState' : 'pushState'](state, null, url);
        // 同步更新历史记录状态
        historyState.value = state;
    }

    // 提供两个跳转方法
    /**
     * push跳转，历史记录栈位置+1
     * @param {string} to 跳转路径
     */
    function push(to) {
        // 设置即将跳转的历史记录
        const currentState = Object.assign({}, historyState.value, {
            to,
            scroll: { x: window.scrollX, y: window.scrollY }
        });
        changeLocation(currentState.current, currentState, true);
        // 在这之前还没跳转，而是将数据同步到历史记录里
        // 历史记录栈层级+1
        const newState = Object.assign(
            {},
            buildHistoryState(currentState.current, to, null, false),
            {
                position: currentState.position + 1
            }
        );
        changeLocation(to, newState, false);
        currentLocation.value = to; // 同步更新历史记录状态
    }
    /**
     * replace替换当前记录，历史记录栈位置不变
     * @param {string} to 跳转路径
     */
    function replace(to) {
        const state = Object.assign({}, historyState.value, {
            current: to
        });
        changeLocation(to, state, true);
    }
    return {
        location: currentLocation,
        state: historyState,
        push,
        replace
    };
}

// 监听浏览器的前进后退事件
function useHistoryListeners(base, historyState, currentLocation) {
    const listeners = []; // 收集监听前进后退的回调
    window.addEventListener('popstate', popStateHandler);
    function popStateHandler({ state }) {
        // 浏览器前进后退同步本地数据信息
        const to = createCurrentHistoryLocation(base); // 目标路径，浏览器已经切换了，所以直接读取当前的
        const from = currentLocation.value; // 来源的路径
        const fromState = historyState.value; // 来源的state状态
        currentLocation.value = to;
        historyState.value = state;
        const isBack = state.position - fromState.position < 0; // 根据层级判断点击后退还是前进
        listeners.forEach(listener => {
            listener(to, from, { isBack });
        });
    }
    function listen(fn) {
        listeners.push(fn);
    }
    return {
        listen,
    }
}

// 创建浏览器路由
export function createWebHistory(base = '') {
    const historyNavigation = useHistoryStateNavigation(base);
    const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location);
    const historyRouter = Object.assign({}, historyNavigation, historyListeners);
    Object.defineProperty(historyRouter, 'location', {
        get: () => historyNavigation.location.value
    });
    Object.defineProperty(historyRouter, 'state', {
        get: () => historyNavigation.state.value
    });
    return historyRouter;
}
