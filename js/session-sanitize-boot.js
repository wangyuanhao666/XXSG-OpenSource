// 立即清理现有会话中的敏感信息
(function() {
    try {
        const cleanSession = (sessionStr) => {
            if (!sessionStr) return null;
            const session = JSON.parse(sessionStr);
            if (session.user && session.user.password) {
                delete session.user.password;
                return JSON.stringify(session);
            }
            return sessionStr;
        };

        const local = localStorage.getItem('userSession');
        const session = sessionStorage.getItem('userSession');

        if (local) localStorage.setItem('userSession', cleanSession(local));
        if (session) sessionStorage.setItem('userSession', cleanSession(session));

        if (local || session) {
            console.log('✅ 安全修复：已清理会话中的敏感信息');
        }
    } catch (e) {
        console.error('安全修复失败:', e);
    }
})();
