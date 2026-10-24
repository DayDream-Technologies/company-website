(function () {
    const sb = function () {
        return window.supabaseClient;
    };

    function client() {
        if (!sb()) throw new Error('Supabase is not configured. Add your project URL and anon key in src/js/config.js.');
        return sb();
    }

    function configured() {
        return typeof window.isSupabaseConfigured === 'function' && window.isSupabaseConfigured() && sb();
    }

    async function profileRole(userId) {
        const { data, error } = await client().from('profiles').select('role').eq('id', userId).maybeSingle();
        if (error) throw error;
        return data ? data.role : 'client';
    }

    async function redirectForRole(user) {
        const role = await profileRole(user.id);
        window.location.assign(role === 'admin' ? '/admin' : '/dashboard');
    }

    async function currentUser() {
        if (!configured()) return null;
        const { data, error } = await client().auth.getUser();
        if (error || !data.user) return null;
        return data.user;
    }

    async function requireUser() {
        const user = await currentUser();
        if (!user) {
            window.location.assign('/login');
            return null;
        }
        return user;
    }

    async function requireAdmin() {
        const user = await requireUser();
        if (!user) return null;
        const role = await profileRole(user.id);
        if (role !== 'admin') {
            window.location.assign('/dashboard');
            return null;
        }
        return user;
    }

    async function signIn(email, password) {
        const { data, error } = await client().auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
    }

    async function signUp(details) {
        const { data, error } = await client().auth.signUp({
            email: details.email,
            password: details.password,
            options: {
                data: {
                    full_name: details.fullName,
                    company: details.company,
                },
                emailRedirectTo: window.location.origin + '/login',
            },
        });
        if (error) throw error;
        return data;
    }

    async function sendReset(email) {
        const { error } = await client().auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/login',
        });
        if (error) throw error;
    }

    async function updatePassword(password) {
        const { error } = await client().auth.updateUser({ password });
        if (error) throw error;
    }

    async function signOut() {
        if (sb()) await sb().auth.signOut();
        window.location.assign('/login');
    }

    window.DaydreamAuth = {
        configured: configured,
        currentUser: currentUser,
        requireUser: requireUser,
        requireAdmin: requireAdmin,
        profileRole: profileRole,
        redirectForRole: redirectForRole,
        signIn: signIn,
        signUp: signUp,
        sendReset: sendReset,
        updatePassword: updatePassword,
        signOut: signOut,
    };

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    ready(function () {
        const form = document.getElementById('auth-form');
        if (!form) return;

        const message = document.getElementById('auth-message');
        const nameWrap = document.getElementById('name-field');
        const companyWrap = document.getElementById('company-field');
        const submit = document.getElementById('auth-submit');
        const forgot = document.getElementById('forgot-password');
        const resetPanel = document.getElementById('reset-panel');
        const resetForm = document.getElementById('reset-form');
        let mode = 'sign-in';

        function showMessage(text, kind) {
            message.hidden = false;
            message.textContent = text;
            message.className = 'auth-message' + (kind ? ' ' + kind : '');
        }

        function setMode(next) {
            mode = next;
            const signingUp = mode === 'sign-up';
            nameWrap.hidden = !signingUp;
            companyWrap.hidden = !signingUp;
            submit.textContent = signingUp ? 'Create account' : 'Sign in';
            document.getElementById('sign-in-tab').setAttribute('aria-selected', String(!signingUp));
            document.getElementById('sign-up-tab').setAttribute('aria-selected', String(signingUp));
            document.getElementById('name').required = signingUp;
        }

        document.getElementById('sign-in-tab').addEventListener('click', function () { setMode('sign-in'); });
        document.getElementById('sign-up-tab').addEventListener('click', function () { setMode('sign-up'); });

        if (!configured()) {
            showMessage('Add your Supabase URL and anon key in src/js/config.js before signing in.', 'error');
            submit.disabled = true;
            forgot.disabled = true;
        }

        if (sb()) {
            sb().auth.onAuthStateChange(function (event) {
                if (event === 'PASSWORD_RECOVERY') {
                    form.hidden = true;
                    resetPanel.hidden = false;
                }
            });
        }

        if (window.location.hash.indexOf('type=recovery') !== -1) {
            form.hidden = true;
            resetPanel.hidden = false;
        } else if (configured()) {
            currentUser().then(function (user) {
                if (user) redirectForRole(user);
            }).catch(function () { /* stay on the form */ });
        }

        forgot.addEventListener('click', async function () {
            const email = document.getElementById('email').value.trim();
            if (!email) {
                showMessage('Enter your email, then choose Forgot password.', 'error');
                return;
            }
            forgot.disabled = true;
            try {
                await sendReset(email);
                showMessage('Check your email for a password reset link.', 'success');
            } catch (error) {
                showMessage(error.message || 'Could not send the reset email.', 'error');
            } finally {
                forgot.disabled = false;
            }
        });

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            if (!configured()) return;
            submit.disabled = true;
            message.hidden = true;
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            try {
                if (mode === 'sign-up') {
                    if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
                    const result = await signUp({
                        email: email,
                        password: password,
                        fullName: document.getElementById('name').value.trim(),
                        company: document.getElementById('company').value.trim(),
                    });
                    if (result.session && result.user) {
                        await redirectForRole(result.user);
                        return;
                    }
                    showMessage('Account created. Check your email to confirm, then sign in.', 'success');
                } else {
                    const user = await signIn(email, password);
                    await redirectForRole(user);
                }
            } catch (error) {
                showMessage(error.message || 'Something went wrong.', 'error');
            } finally {
                submit.disabled = false;
            }
        });

        resetForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const password = document.getElementById('new-password').value;
            const button = document.getElementById('reset-submit');
            if (password.length < 8) {
                showMessage('Use at least 8 characters for your password.', 'error');
                return;
            }
            button.disabled = true;
            try {
                await updatePassword(password);
                showMessage('Password updated. Redirecting…', 'success');
                const user = await currentUser();
                if (user) await redirectForRole(user);
            } catch (error) {
                showMessage(error.message || 'Could not update the password.', 'error');
                button.disabled = false;
            }
        });
    });
})();
