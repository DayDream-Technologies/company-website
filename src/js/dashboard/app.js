(function () {
    const format = window.DaydreamFormat;
    const auth = window.DaydreamAuth;
    let currentUser = null;
    let subscription = null;

    function ready(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    function showBanner(text, kind) {
        const banner = document.getElementById('portal-banner');
        if (!text) {
            banner.hidden = true;
            return;
        }
        banner.hidden = false;
        banner.textContent = text;
        banner.className = 'portal-banner' + (kind ? ' ' + kind : '');
    }

    function empty(parent, text) {
        parent.appendChild(Object.assign(document.createElement('p'), { className: 'empty-state', textContent: text }));
    }

    function badge(status) {
        const node = document.createElement('span');
        node.className = 'status-badge status-' + (status || 'unknown');
        node.textContent = format.statusLabel(status);
        return node;
    }

    function renderProjects(projects) {
        const panel = document.getElementById('panel-projects');
        panel.replaceChildren();
        panel.appendChild(Object.assign(document.createElement('h2'), { textContent: 'My projects' }));
        if (!projects.length) {
            empty(panel, 'No projects yet. When we start work together, it will show up here.');
            return;
        }
        const list = document.createElement('div');
        list.className = 'card-list';
        projects.forEach(function (project) {
            const card = document.createElement('article');
            card.className = 'portal-card';
            const title = document.createElement('div');
            title.className = 'card-title-row';
            title.appendChild(Object.assign(document.createElement('h3'), { textContent: project.name }));
            title.appendChild(badge(project.status));
            card.appendChild(title);
            if (project.description) {
                card.appendChild(Object.assign(document.createElement('p'), { textContent: project.description }));
            }
            card.appendChild(Object.assign(document.createElement('p'), {
                className: 'meta',
                textContent: 'Updated ' + format.formatDate(project.updated_at || project.created_at),
            }));
            list.appendChild(card);
        });
        panel.appendChild(list);
    }

    function renderBilling(plans) {
        const panel = document.getElementById('panel-billing');
        panel.replaceChildren();
        panel.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Subscription' }));

        const current = document.createElement('article');
        current.className = 'portal-card';
        if (!subscription) {
            current.appendChild(Object.assign(document.createElement('p'), {
                textContent: 'You do not have an active subscription.',
            }));
        } else {
            const plan = subscription.service_plans;
            const row = document.createElement('div');
            row.className = 'card-title-row';
            row.appendChild(Object.assign(document.createElement('h3'), {
                textContent: plan ? plan.name : 'Custom subscription',
            }));
            row.appendChild(badge(subscription.status));
            current.appendChild(row);
            current.appendChild(Object.assign(document.createElement('p'), {
                className: 'meta',
                textContent: 'Current period ends ' + format.formatDate(subscription.current_period_end),
            }));
            const actions = document.createElement('div');
            actions.className = 'button-row';
            actions.appendChild(actionButton('Change plan', 'portal'));
            actions.appendChild(actionButton('Cancel', 'cancel'));
            current.appendChild(actions);
        }
        panel.appendChild(current);

        panel.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Plans' }));
        const grid = document.createElement('div');
        grid.className = 'plan-grid';
        if (!plans.length) {
            empty(panel, 'Plans will appear here after they are connected to Stripe.');
            return;
        }
        plans.forEach(function (plan) {
            const card = document.createElement('article');
            card.className = 'portal-card plan-card';
            card.appendChild(Object.assign(document.createElement('h3'), { textContent: plan.name }));
            card.appendChild(Object.assign(document.createElement('p'), {
                className: 'plan-price',
                textContent: format.money(plan.price_cents) + (plan.interval === 'one_time' ? '' : ' / ' + plan.interval),
            }));
            if (plan.description) {
                card.appendChild(Object.assign(document.createElement('p'), { textContent: plan.description }));
            }
            const features = Array.isArray(plan.features) ? plan.features : [];
            if (features.length) {
                const list = document.createElement('ul');
                features.forEach(function (feature) {
                    list.appendChild(Object.assign(document.createElement('li'), { textContent: feature }));
                });
                card.appendChild(list);
            }
            const button = actionButton(plan.interval === 'one_time' ? 'Pay deposit' : 'Subscribe', 'checkout');
            button.dataset.priceId = plan.stripe_price_id || '';
            button.disabled = !plan.stripe_price_id;
            if (!plan.stripe_price_id) button.textContent = 'Not available yet';
            card.appendChild(button);
            grid.appendChild(card);
        });
        panel.appendChild(grid);
    }

    function actionButton(label, action) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'portal-button';
        button.dataset.action = action;
        button.textContent = label;
        return button;
    }

    function renderInvoices(invoices) {
        const panel = document.getElementById('panel-invoices');
        panel.replaceChildren();
        panel.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Invoices' }));
        if (!invoices.length) {
            empty(panel, 'No invoices yet.');
            return;
        }
        panel.appendChild(table(invoices, [
            ['Description', function (row) { return row.description || 'Invoice'; }],
            ['Amount', function (row) { return format.money(row.amount_cents); }],
            ['Status', function (row) { return format.statusLabel(row.status); }],
            ['Due', function (row) { return format.formatDate(row.due_date); }],
        ], function (row, cell) {
            const actions = document.createElement('div');
            actions.className = 'button-row';
            if (row.status !== 'paid' && row.status !== 'void') {
                const pay = actionButton('Pay now', 'pay-invoice');
                pay.dataset.invoiceId = row.id;
                actions.appendChild(pay);
            }
            if (row.invoice_pdf) {
                const link = document.createElement('a');
                link.className = 'text-link';
                link.href = row.invoice_pdf;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'Download PDF';
                actions.appendChild(link);
            }
            cell.appendChild(actions);
        }));
    }

    function renderPayments(payments) {
        const panel = document.getElementById('panel-payments');
        panel.replaceChildren();
        panel.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Payment history' }));
        if (!payments.length) {
            empty(panel, 'No payments yet.');
            return;
        }
        panel.appendChild(table(payments, [
            ['Date', function (row) { return format.formatDate(row.created_at); }],
            ['Amount', function (row) { return format.money(row.amount_cents); }],
            ['Status', function (row) { return format.statusLabel(row.status); }],
        ]));
    }

    function table(rows, columns, extra) {
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        const tableEl = document.createElement('table');
        const head = document.createElement('tr');
        columns.forEach(function (column) {
            head.appendChild(Object.assign(document.createElement('th'), { textContent: column[0] }));
        });
        if (extra) head.appendChild(document.createElement('th'));
        tableEl.appendChild(head);
        rows.forEach(function (row) {
            const tr = document.createElement('tr');
            columns.forEach(function (column) {
                tr.appendChild(Object.assign(document.createElement('td'), { textContent: column[1](row) }));
            });
            if (extra) {
                const cell = document.createElement('td');
                extra(row, cell);
                tr.appendChild(cell);
            }
            tableEl.appendChild(tr);
        });
        wrap.appendChild(tableEl);
        return wrap;
    }

    function fillSettings(profile) {
        document.getElementById('settings-name').value = profile.full_name || '';
        document.getElementById('settings-company').value = profile.company || '';
        document.getElementById('settings-email').value = currentUser.email || '';
    }

    async function load() {
        currentUser = await auth.requireUser();
        if (!currentUser) return;

        const params = new URLSearchParams(window.location.search);
        if (params.get('billing') === 'success') showBanner('Payment received. It can take a moment to appear below.', 'success');
        if (params.get('billing') === 'cancel') showBanner('Checkout was canceled. No charge was made.', 'error');

        const client = window.supabaseClient;
        const [profileRes, projectsRes, subsRes, invoicesRes, paymentsRes, plansRes] = await Promise.all([
            client.from('profiles').select('full_name, company, role').eq('id', currentUser.id).maybeSingle(),
            client.from('projects').select('*').eq('client_id', currentUser.id).order('updated_at', { ascending: false }),
            client.from('subscriptions').select('*, service_plans(*)').eq('client_id', currentUser.id).order('created_at', { ascending: false }),
            client.from('invoices').select('*').eq('client_id', currentUser.id).order('created_at', { ascending: false }),
            client.from('payments').select('*').eq('client_id', currentUser.id).order('created_at', { ascending: false }),
            client.from('service_plans').select('*').eq('active', true).order('price_cents'),
        ]);

        const failed = [profileRes, projectsRes, subsRes, invoicesRes, paymentsRes, plansRes].find(function (result) {
            return result.error;
        });
        if (failed) {
            showBanner(failed.error.message, 'error');
            return;
        }

        const profile = profileRes.data || {};
        document.getElementById('portal-greeting').textContent = profile.full_name
            ? 'Hello, ' + profile.full_name
            : 'Your dashboard';
        subscription = (subsRes.data || []).find(function (row) {
            return row.status !== 'canceled' && row.status !== 'incomplete_expired';
        }) || (subsRes.data || [])[0] || null;

        renderProjects(projectsRes.data || []);
        renderBilling(plansRes.data || []);
        renderInvoices(invoicesRes.data || []);
        renderPayments(paymentsRes.data || []);
        fillSettings(profile);
    }

    ready(function () {
        if (!document.getElementById('portal-greeting')) return;
        document.getElementById('logout-button').addEventListener('click', function () {
            auth.signOut();
        });

        document.querySelectorAll('.portal-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.portal-tab').forEach(function (item) {
                    item.setAttribute('aria-selected', 'false');
                });
                tab.setAttribute('aria-selected', 'true');
                document.querySelectorAll('.portal-panel').forEach(function (panel) {
                    panel.hidden = panel.id !== tab.dataset.panel;
                });
            });
        });

        document.querySelector('main').addEventListener('click', async function (event) {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            button.disabled = true;
            try {
                if (button.dataset.action === 'checkout') {
                    await window.DaydreamBilling.startCheckout(button.dataset.priceId);
                } else if (button.dataset.action === 'pay-invoice') {
                    await window.DaydreamBilling.payInvoice(button.dataset.invoiceId);
                } else if (button.dataset.action === 'portal') {
                    await window.DaydreamBilling.openPortal();
                } else if (button.dataset.action === 'cancel') {
                    await window.DaydreamBilling.openPortal({
                        flow: 'cancel',
                        subscriptionId: subscription && subscription.stripe_subscription_id,
                    });
                }
            } catch (error) {
                showBanner(error.message, 'error');
                button.disabled = false;
            }
        });

        document.getElementById('settings-form').addEventListener('submit', async function (event) {
            event.preventDefault();
            const button = document.getElementById('settings-submit');
            button.disabled = true;
            try {
                const { error } = await window.supabaseClient.from('profiles').update({
                    full_name: document.getElementById('settings-name').value.trim(),
                    company: document.getElementById('settings-company').value.trim(),
                }).eq('id', currentUser.id);
                if (error) throw error;
                const password = document.getElementById('settings-password').value;
                if (password) {
                    if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
                    await auth.updatePassword(password);
                    document.getElementById('settings-password').value = '';
                }
                document.getElementById('portal-greeting').textContent = 'Hello, ' + (document.getElementById('settings-name').value.trim() || 'there');
                showBanner('Account updated.', 'success');
            } catch (error) {
                showBanner(error.message, 'error');
            } finally {
                button.disabled = false;
            }
        });

        load().catch(function (error) {
            showBanner(error.message || 'Could not load your dashboard.', 'error');
        });
    });
})();
