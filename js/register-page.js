(function () {
    const DEFAULT_REGISTER_PERMISSIONS = [
        'add-task',
        'quadrant-view',
        'fortune',
        'pomodoro',
        'habit-tracker',
        'countdown',
        'time-tracker',
        'calendar',
        'dashboard',
        'review',
        'templates'
    ];

    function showFieldError(id, message) {
        const element = document.getElementById(id);
        if (!element) return;
        element.textContent = message;
        element.classList.add('show');
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(element => {
            element.textContent = '';
            element.classList.remove('show');
        });
        setStatus('');
    }

    function setStatus(message, type = 'info') {
        const status = document.getElementById('register-status');
        if (!status) return;
        status.textContent = message;
        status.dataset.status = type;
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function enhancePasswordVisibilityToggles(root = document) {
        root.querySelectorAll('input[type="password"][id]').forEach(input => {
            if (input.dataset.passwordToggleEnhanced === 'true') return;

            const wrapper = document.createElement('div');
            wrapper.className = 'password-toggle-field';
            input.parentNode.insertBefore(wrapper, input);
            wrapper.appendChild(input);

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'password-toggle-btn';
            toggle.setAttribute('aria-label', '显示密码');
            toggle.setAttribute('aria-pressed', 'false');
            toggle.textContent = '👁️';

            toggle.addEventListener('click', () => {
                const shouldShow = input.type === 'password';
                input.type = shouldShow ? 'text' : 'password';
                toggle.setAttribute('aria-label', shouldShow ? '隐藏密码' : '显示密码');
                toggle.setAttribute('aria-pressed', String(shouldShow));
                toggle.textContent = shouldShow ? '🙈' : '👁️';
                input.focus();
            });

            wrapper.appendChild(toggle);
            input.dataset.passwordToggleEnhanced = 'true';
        });
    }

    function validateInput(username, email, password, confirmPassword) {
        let isValid = true;

        if (!username || username.length < 3) {
            showFieldError('reg-username-error', '用户名至少 3 个字符');
            isValid = false;
        }

        if (username.toLowerCase() === 'admin') {
            showFieldError('reg-username-error', 'admin 是本地管理员保留账号，请换一个用户名');
            isValid = false;
        }

        if (email && !isValidEmail(email)) {
            showFieldError('reg-email-error', '请输入正确的邮箱地址');
            isValid = false;
        }

        if (!password || password.length < 6) {
            showFieldError('reg-password-error', '密码至少 6 位');
            isValid = false;
        }

        if (password !== confirmPassword) {
            showFieldError('reg-confirm-password-error', '两次输入的密码不一致');
            isValid = false;
        }

        return isValid;
    }

    function saveSession(user) {
        const session = {
            user,
            loginTime: new Date().toISOString(),
            rememberMe: true
        };
        if (window.SessionStorage?.setSession) {
            window.SessionStorage.setSession(session, { remember: true });
        } else {
            localStorage.setItem('userSession', JSON.stringify(session));
        }
    }

    async function hashPassword(password) {
        if (window.Security?.Password?.hashPassword) {
            return window.Security.Password.hashPassword(password);
        }
        return password;
    }

    async function handleRegister(event) {
        event.preventDefault();
        clearErrors();

        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (!validateInput(username, email, password, confirmPassword)) {
            return;
        }

        const users = window.UserStorage.getUsers();
        const usernameKey = username.toLowerCase();
        const emailKey = email.toLowerCase();
        const existingUser = users.find(user => {
            const sameUsername = String(user.username || '').toLowerCase() === usernameKey;
            const sameEmail = emailKey && String(user.email || '').toLowerCase() === emailKey;
            return sameUsername || sameEmail;
        });

        if (existingUser) {
            showFieldError('reg-username-error', '该用户名或邮箱已存在，请直接登录或换一个');
            return;
        }

        const submitButton = document.getElementById('register-submit-btn');
        if (submitButton) submitButton.disabled = true;
        setStatus('正在创建本地账号...', 'info');

        try {
            const passwordHash = await hashPassword(password);
            const user = {
                id: `user_${Date.now()}`,
                username,
                email,
                phone: '',
                password: passwordHash,
                role: 'user',
                avatar: '',
                permissions: DEFAULT_REGISTER_PERMISSIONS.slice(),
                createdAt: new Date().toISOString(),
                createdBy: 'self-registration',
                passwordMigrated: passwordHash !== password,
                localOnly: true
            };

            window.UserStorage.setUsers([...users, user]);
            saveSession(user);
            setStatus('本地账号创建成功，正在进入应用...', 'success');

            window.setTimeout(() => {
                window.location.replace('index.html?from=register&t=' + Date.now());
            }, 300);
        } catch (error) {
            console.error('本地注册失败:', error);
            setStatus('本地注册失败，请稍后重试', 'error');
            if (submitButton) submitButton.disabled = false;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        enhancePasswordVisibilityToggles();
        const form = document.getElementById('register-form');
        if (form) form.addEventListener('submit', handleRegister);
    });
})();
