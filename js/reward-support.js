(function () {
    'use strict';

    const REWARD_QR_SRC = 'assets/images/reward-wechat.png';
    const AUTO_SHOW_DELAY_MS = 800;
    const AUTO_SHOW_MAX_ATTEMPTS = 20;
    const AUTO_SHOW_RETRY_MS = 250;

    function getCurrentUser() {
        if (window.currentUser) return window.currentUser;
        if (window.SessionStorage?.getCurrentUser) {
            return window.SessionStorage.getCurrentUser();
        }
        const session = window.SessionStorage?.getSession?.('userSession');
        return session?.user || null;
    }

    function getRewardStorageKey(user) {
        const userKey = user?.id || user?.username || 'anonymous';
        return `rewardModalShown_${userKey}`;
    }

    function getStoredFlag(key) {
        if (window.DataSyncStorage?.getRaw) {
            return window.DataSyncStorage.getRaw(key);
        }
        return window.localStorage.getItem(key);
    }

    function setStoredFlag(key, value) {
        if (window.DataSyncStorage?.setRaw) {
            window.DataSyncStorage.setRaw(key, value);
            return;
        }
        window.localStorage.setItem(key, value);
    }

    function ensureRewardStyles() {
        if (document.getElementById('reward-support-styles')) return;

        const style = document.createElement('style');
        style.id = 'reward-support-styles';
        style.textContent = `
            .reward-support-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.25rem;
                background: rgba(15, 23, 42, 0.48);
                backdrop-filter: blur(10px);
            }
            .reward-support-dialog {
                width: min(92vw, 460px);
                max-height: 92vh;
                overflow: auto;
                border-radius: 28px;
                background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
                border: 1px solid rgba(148, 163, 184, 0.25);
                color: #172033;
            }
            .reward-support-header {
                position: relative;
                padding: 1.8rem 1.8rem 0.8rem;
                text-align: center;
            }
            .reward-support-icon {
                width: 60px;
                height: 60px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 20px;
                background: linear-gradient(135deg, #fef3c7, #fde68a);
                box-shadow: 0 12px 30px rgba(245, 158, 11, 0.22);
                font-size: 1.9rem;
                margin-bottom: 1rem;
            }
            .reward-support-title {
                margin: 0;
                font-size: 1.45rem;
                line-height: 1.35;
                font-weight: 800;
                color: #111827;
            }
            .reward-support-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 999px;
                background: #eef2ff;
                color: #475569;
                font-size: 1.4rem;
                line-height: 1;
                cursor: pointer;
            }
            .reward-support-body {
                padding: 0 1.8rem 1.8rem;
            }
            .reward-support-text {
                margin: 0 0 1rem;
                color: #4b5563;
                font-size: 0.98rem;
                line-height: 1.75;
                text-align: left;
            }
            .reward-support-qr-card {
                margin: 1.15rem auto;
                padding: 1rem;
                border-radius: 22px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
                text-align: center;
            }
            .reward-support-qr {
                display: block;
                width: min(260px, 72vw);
                max-width: 100%;
                height: auto;
                margin: 0 auto;
                border-radius: 16px;
            }
            .reward-support-placeholder {
                display: none;
                min-height: 190px;
                align-items: center;
                justify-content: center;
                padding: 1rem;
                border-radius: 16px;
                background: #f8fafc;
                color: #64748b;
                border: 1px dashed #cbd5e1;
                font-weight: 700;
            }
            .reward-support-caption {
                margin: 0.75rem 0 0;
                color: #2563eb;
                font-weight: 700;
                font-size: 0.95rem;
            }
            .reward-support-note {
                margin: 0.8rem 0 0;
                color: #64748b;
                font-size: 0.9rem;
                line-height: 1.6;
                text-align: center;
            }
            .reward-support-actions {
                display: flex;
                gap: 0.75rem;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 1.35rem;
            }
            .reward-support-btn {
                border: none;
                border-radius: 999px;
                padding: 0.78rem 1.25rem;
                font-weight: 800;
                cursor: pointer;
                min-width: 128px;
                transition: transform 0.18s ease, box-shadow 0.18s ease;
            }
            .reward-support-btn:hover {
                transform: translateY(-1px);
            }
            .reward-support-btn.primary {
                color: #ffffff;
                background: linear-gradient(135deg, #2563eb, #14b8a6);
                box-shadow: 0 14px 28px rgba(37, 99, 235, 0.24);
            }
            .reward-support-btn.secondary {
                color: #475569;
                background: #eef2ff;
            }
            body.dark-mode .reward-support-dialog {
                background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
                color: #e5e7eb;
                border-color: rgba(148, 163, 184, 0.18);
            }
            body.dark-mode .reward-support-title { color: #f8fafc; }
            body.dark-mode .reward-support-text,
            body.dark-mode .reward-support-note { color: #cbd5e1; }
            body.dark-mode .reward-support-qr-card {
                background: #111827;
                border-color: rgba(148, 163, 184, 0.22);
            }
        `;
        document.head.appendChild(style);
    }

    function closeRewardModal() {
        const modal = document.querySelector('.reward-support-modal');
        if (modal) modal.remove();
    }

    function createButton(label, variant, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `reward-support-btn ${variant}`;
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    }

    function showRewardModal(options = {}) {
        closeRewardModal();
        ensureRewardStyles();

        const user = getCurrentUser();
        if (options.source === 'auto' && user) {
            setStoredFlag(getRewardStorageKey(user), 'true');
        }

        const overlay = document.createElement('div');
        overlay.className = 'reward-support-modal';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'reward-support-title');

        const dialog = document.createElement('div');
        dialog.className = 'reward-support-dialog';

        const header = document.createElement('div');
        header.className = 'reward-support-header';

        const icon = document.createElement('div');
        icon.className = 'reward-support-icon';
        icon.textContent = '💛';

        const title = document.createElement('h2');
        title.id = 'reward-support-title';
        title.className = 'reward-support-title';
        title.textContent = '随喜赞赏，支持象限时光继续开源';

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'reward-support-close';
        closeButton.setAttribute('aria-label', '关闭随喜赞赏弹窗');
        closeButton.textContent = '×';
        closeButton.addEventListener('click', closeRewardModal);

        header.append(icon, title, closeButton);

        const body = document.createElement('div');
        body.className = 'reward-support-body';

        const text = document.createElement('p');
        text.className = 'reward-support-text';
        text.textContent = '象限时光开源版会持续保持本地优先、免费可用。如果它帮你理清优先级、节省时间，欢迎自愿扫码支持维护。赞赏完全随喜，不影响任何功能使用。';

        const qrCard = document.createElement('div');
        qrCard.className = 'reward-support-qr-card';

        const qrImg = document.createElement('img');
        qrImg.className = 'reward-support-qr';
        qrImg.src = REWARD_QR_SRC;
        qrImg.alt = '微信随喜赞赏二维码';
        qrImg.loading = 'lazy';

        const placeholder = document.createElement('div');
        placeholder.className = 'reward-support-placeholder';
        placeholder.textContent = '赞赏二维码暂未配置';

        qrImg.addEventListener('error', () => {
            qrImg.style.display = 'none';
            placeholder.style.display = 'flex';
        });

        const caption = document.createElement('p');
        caption.className = 'reward-support-caption';
        caption.textContent = '微信扫码，随喜支持';

        qrCard.append(qrImg, placeholder, caption);

        const note = document.createElement('p');
        note.className = 'reward-support-note';
        note.textContent = '你也可以通过 Star、反馈问题、分享项目来支持。';

        const actions = document.createElement('div');
        actions.className = 'reward-support-actions';
        actions.append(
            createButton('继续使用', 'primary', closeRewardModal),
            createButton('不再提示', 'secondary', closeRewardModal)
        );

        body.append(text, qrCard, note, actions);
        dialog.append(header, body);
        overlay.append(dialog);

        overlay.addEventListener('click', event => {
            if (event.target === overlay) closeRewardModal();
        });

        document.addEventListener('keydown', function handleEscape(event) {
            if (event.key === 'Escape') {
                closeRewardModal();
                document.removeEventListener('keydown', handleEscape);
            }
        });

        document.body.appendChild(overlay);
    }

    function shouldAutoShowFromRegister() {
        const params = new URLSearchParams(window.location.search);
        return params.get('from') === 'register';
    }

    function scheduleAutoRewardModal(attempt = 0) {
        if (!shouldAutoShowFromRegister()) return;

        const user = getCurrentUser();
        if (!user) {
            if (attempt < AUTO_SHOW_MAX_ATTEMPTS) {
                window.setTimeout(() => scheduleAutoRewardModal(attempt + 1), AUTO_SHOW_RETRY_MS);
            }
            return;
        }

        const storageKey = getRewardStorageKey(user);
        if (getStoredFlag(storageKey) === 'true') return;

        window.setTimeout(() => showRewardModal({ source: 'auto' }), AUTO_SHOW_DELAY_MS);
    }

    window.showRewardModal = showRewardModal;
    window.closeRewardModal = closeRewardModal;

    document.addEventListener('DOMContentLoaded', () => {
        scheduleAutoRewardModal();
    });
})();
