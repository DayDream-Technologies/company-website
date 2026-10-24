(function () {
    const format = window.DaydreamFormat;
    const auth = window.DaydreamAuth;
    let clients = [];
    let selectedId = null;

    function ready(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    function showBanner(text, kind) {
        const banner = document.getElementById('portal-banner');
        banner.hidden = !text;
        banner.textContent = text || '';
        banner.className = 'portal-banner' + (kind ? ' ' + kind : '');
    }

    function field(label, name, type) {
        const wrap = document.createElement('label');
        wrap.className = 'field';
        wrap.appendChild(Object.assign(document.createElement('span'), { textContent: label }));
        const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
        if (type !== 'textarea') input.type = type || 'text';
        input.name = name;
        input.required = type !== 'textarea' && name !== 'description';
        wrap.appendChild(input);
        return wrap;
    }

    function renderClients() {
        const list = document.getElementById('client-list');
        const query = document.getElementById('client-search').value.trim().toLowerCase();
        list.replaceChildren();
        const visible = clients.filter(function (client) {
            const haystack = ((client.full_name || '') + ' ' + (client.company || '') + ' ' + (client.email || '')).toLowerCase();
            return !query || haystack.indexOf(query) !== -1;
        });
        if (!visible.length) {
            list.appendChild(Object.assign(document.createElement('p'), {
                className: 'empty-state',
                textContent: 'No clients match.',
            }));
            return;
        }
        visible.forEach(function (client) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'client-row' + (client.id === selectedId ? ' selected' : '');
            button.dataset.clientId = client.id;
            const name = document.createElement('strong');
            name.textContent = client.full_name || client.email || 'Unnamed client';
            button.appendChild(name);
            button.appendChild(Object.assign(document.createElement('span'), {
                textContent: client.company || client.email || '',
            }));
            list.appendChild(button);
        });
    }

    async function selectClient(clientId) {
        selectedId = clientId;
        renderClients();
        const detail = document.getElementById('client-detail');
        const client = clients.find(function (item) { return item.id === clientId; });
        detail.replaceChildren();
        detail.appendChild(Object.assign(document.createElement('h2'), {
            textContent: client.full_name || client.email || 'Client',
        }));
        if (client.company) {
            detail.appendChild(Object.assign(document.createElement('p'), { className: 'meta', textContent: client.company }));
        }

        const db = window.supabaseClient;
        const [projectsRes, subsRes, invoicesRes] = await Promise.all([
            db.from('projects').select('*').eq('client_id', clientId).order('updated_at', { ascending: false }),
            db.from('subscriptions').select('*, service_plans(name)').eq('client_id', clientId).order('created_at', { ascending: false }),
            db.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        ]);
        const failed = [projectsRes, subsRes, invoicesRes].find(function (result) { return result.error; });
        if (failed) throw failed.error;

        detail.appendChild(Object.assign(document.createElement('h3'), { textContent: 'Projects' }));
        const projects = projectsRes.data || [];
        if (!projects.length) {
            detail.appendChild(Object.assign(document.createElement('p'), { className: 'empty-state', textContent: 'No projects.' }));
        } else {
            projects.forEach(function (project) {
                const row = document.createElement('p');
                row.textContent = project.name + ' · ' + format.statusLabel(project.status);
                detail.appendChild(row);
            });
        }

        const projectForm = document.createElement('form');
        projectForm.className = 'stack-form';
        projectForm.id = 'project-form';
        projectForm.appendChild(field('Project name', 'name', 'text'));
        projectForm.appendChild(field('Description', 'description', 'textarea'));
        const status = document.createElement('label');
        status.className = 'field';
        status.appendChild(Object.assign(document.createElement('span'), { textContent: 'Status' }));
        const select = document.createElement('select');
        select.name = 'status';
        ['active', 'paused', 'completed'].forEach(function (value) {
            select.appendChild(Object.assign(document.createElement('option'), { value: value, textContent: format.statusLabel(value) }));
        });
        status.appendChild(select);
        projectForm.appendChild(status);
        projectForm.appendChild(Object.assign(document.createElement('button'), {
            type: 'submit',
            className: 'portal-button',
            textContent: 'Add project',
        }));
        detail.appendChild(projectForm);

        detail.appendChild(Object.assign(document.createElement('h3'), { textContent: 'Subscription' }));
        const subs = subsRes.data || [];
        detail.appendChild(Object.assign(document.createElement('p'), {
            textContent: subs.length
                ? (subs[0].service_plans ? subs[0].service_plans.name : 'Subscription') + ' · ' + format.statusLabel(subs[0].status)
                : 'No subscription.',
        }));

        detail.appendChild(Object.assign(document.createElement('h3'), { textContent: 'Invoices' }));
        const invoices = invoicesRes.data || [];
        if (!invoices.length) {
            detail.appendChild(Object.assign(document.createElement('p'), { className: 'empty-state', textContent: 'No invoices.' }));
        } else {
            invoices.forEach(function (invoice) {
                detail.appendChild(Object.assign(document.createElement('p'), {
                    textContent: (invoice.description || 'Invoice') + ' · ' + format.money(invoice.amount_cents) + ' · ' + format.statusLabel(invoice.status),
                }));
            });
        }
    }

    function renderPlans(plans) {
        const panel = document.getElementById('panel-plans');
        panel.replaceChildren();
        panel.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Service plans' }));
        panel.appendChild(Object.assign(document.createElement('p'), {
            className: 'meta',
            textContent: 'Prices are created in Stripe. Paste a price id here, or run scripts/billing/sync-plans.mjs.',
        }));
        plans.forEach(function (plan) {
            const form = document.createElement('form');
            form.className = 'portal-card stack-form';
            form.dataset.planId = plan.id;
            form.appendChild(Object.assign(document.createElement('h3'), { textContent: plan.name }));
            form.appendChild(Object.assign(document.createElement('p'), {
                className: 'plan-price',
                textContent: format.money(plan.price_cents) + (plan.interval === 'one_time' ? ' one-time' : ' / ' + plan.interval),
            }));
            const description = field('Description', 'description', 'textarea');
            description.querySelector('textarea').value = plan.description || '';
            description.querySelector('textarea').required = false;
            form.appendChild(description);
            const price = field('Stripe price id', 'stripe_price_id', 'text');
            price.querySelector('input').value = plan.stripe_price_id || '';
            price.querySelector('input').required = false;
            form.appendChild(price);
            const active = document.createElement('label');
            active.className = 'check-field';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'active';
            checkbox.checked = plan.active;
            active.appendChild(checkbox);
            active.appendChild(document.createTextNode(' Active'));
            form.appendChild(active);
            form.appendChild(Object.assign(document.createElement('button'), {
                type: 'submit',
                className: 'portal-button',
                textContent: 'Save plan',
            }));
            panel.appendChild(form);
        });
    }

    function fillInvoiceClients() {
        const select = document.getElementById('invoice-client');
        select.replaceChildren();
        select.appendChild(Object.assign(document.createElement('option'), { value: '', textContent: 'Select a client' }));
        clients.forEach(function (client) {
            select.appendChild(Object.assign(document.createElement('option'), {
                value: client.id,
                textContent: (client.full_name || 'Unnamed') + (client.company ? ' · ' + client.company : ''),
            }));
        });
    }

    async function load() {
        const user = await auth.requireAdmin();
        if (!user) return;
        const db = window.supabaseClient;
        const [profilesRes, plansRes] = await Promise.all([
            db.from('profiles').select('id, full_name, company, role, created_at').order('created_at', { ascending: false }),
            db.from('service_plans').select('*').order('price_cents'),
        ]);
        if (profilesRes.error) throw profilesRes.error;
        if (plansRes.error) throw plansRes.error;

        const users = profilesRes.data || [];
        clients = users.filter(function (profile) { return profile.role !== 'admin'; });
        renderClients();
        fillInvoiceClients();
        renderPlans(plansRes.data || []);
        if (clients.length) await selectClient(clients[0].id);
    }

    ready(function () {
        if (!document.getElementById('client-list')) return;

        document.getElementById('logout-button').addEventListener('click', function () {
            auth.signOut();
        });
        document.getElementById('client-search').addEventListener('input', renderClients);
        document.getElementById('client-list').addEventListener('click', function (event) {
            const button = event.target.closest('[data-client-id]');
            if (!button) return;
            selectClient(button.dataset.clientId).catch(function (error) {
                showBanner(error.message, 'error');
            });
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

        document.getElementById('client-detail').addEventListener('submit', async function (event) {
            if (event.target.id !== 'project-form') return;
            event.preventDefault();
            const form = event.target;
            const button = form.querySelector('button');
            button.disabled = true;
            const { error } = await window.supabaseClient.from('projects').insert({
                client_id: selectedId,
                name: form.name.value.trim(),
                description: form.description.value.trim(),
                status: form.status.value,
            });
            button.disabled = false;
            if (error) {
                showBanner(error.message, 'error');
                return;
            }
            showBanner('Project added.', 'success');
            await selectClient(selectedId);
        });

        document.getElementById('invoice-form').addEventListener('submit', async function (event) {
            event.preventDefault();
            const form = event.target;
            const button = form.querySelector('button');
            button.disabled = true;
            try {
                const dollars = Number(form.amount.value);
                if (!Number.isFinite(dollars) || dollars < 0.5) throw new Error('Enter an amount of at least $0.50.');
                await window.DaydreamBilling.createInvoice({
                    clientId: form.clientId.value,
                    amountCents: Math.round(dollars * 100),
                    description: form.description.value.trim(),
                    dueDate: form.dueDate.value || null,
                    send: form.send.checked,
                });
                showBanner(form.send.checked ? 'Invoice created and emailed.' : 'Invoice created.', 'success');
                form.reset();
                if (selectedId) await selectClient(selectedId);
            } catch (error) {
                showBanner(error.message, 'error');
            } finally {
                button.disabled = false;
            }
        });

        document.getElementById('panel-plans').addEventListener('submit', async function (event) {
            const form = event.target.closest('form[data-plan-id]');
            if (!form) return;
            event.preventDefault();
            const button = form.querySelector('button');
            button.disabled = true;
            const priceId = form.stripe_price_id.value.trim();
            const { error } = await window.supabaseClient.from('service_plans').update({
                description: form.description.value.trim(),
                stripe_price_id: priceId || null,
                active: form.active.checked,
            }).eq('id', form.dataset.planId);
            button.disabled = false;
            showBanner(error ? error.message : 'Plan saved.', error ? 'error' : 'success');
        });

        load().catch(function (error) {
            showBanner(error.message || 'Could not load the admin dashboard.', 'error');
        });
    });
})();
