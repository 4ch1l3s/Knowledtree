(function () {
    'use strict';

    var cssId = 'knowledtree-user-balance-styles';

    function ensureStyles() {
        if (document.getElementById(cssId)) {
            return;
        }

        var style = document.createElement('style');
        style.id = cssId;
        style.textContent = [
            '.kt-balance-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:18px;}',
            '.kt-balance-field{border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#f9fafb;}',
            '.kt-balance-field label{display:block;font-size:12px;font-weight:700;color:#6b7280;margin-bottom:6px;text-transform:uppercase;}',
            '.kt-balance-section-title{font-size:14px;font-weight:700;margin:18px 0 10px;}',
            '.kt-balance-table{margin-bottom:12px;}',
            '.kt-balance-table th{font-size:12px;color:#6b7280;}',
            '.kt-balance-table td{vertical-align:middle;}',
            '.kt-balance-qty{max-width:110px;}',
            '.kt-balance-actions{display:flex;gap:6px;justify-content:flex-end;}',
            '.kt-balance-add{border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#f9fafb;}',
            '.kt-balance-add-row{display:grid;grid-template-columns:minmax(0,1fr) 120px auto;gap:10px;align-items:end;}',
            '.kt-balance-empty{border:1px dashed #d1d5db;border-radius:10px;padding:18px;text-align:center;color:#6b7280;background:#fafafa;}',
            '.kt-balance-error{border:1px solid #fecaca;border-radius:10px;padding:14px;color:#991b1b;background:#fef2f2;}',
            '@media (max-width: 575.98px){.kt-balance-summary{grid-template-columns:1fr}.kt-balance-add-row{grid-template-columns:1fr}.kt-balance-actions{justify-content:flex-start;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function isUsersPage() {
        return window.location.pathname.toLowerCase().indexOf('/identity/users') >= 0;
    }

    function findUserIdInModal(modal) {
        var userId = null;
        var form = modal.querySelector('form');

        if (form) {
            var actionUrl = form.getAttribute('action') || '';
            var actionMatch = actionUrl.match(/[?&]id=([0-9a-f-]+)/i);
            if (actionMatch) {
                userId = actionMatch[1];
            }
        }

        if (!userId) {
            var idInput = modal.querySelector('input[name="User.Id"]')
                || modal.querySelector('input[name="UserId"]')
                || modal.querySelector('input[name="Id"]')
                || modal.querySelector('input[name="id"]');

            if (idInput && /^[0-9a-f-]+$/i.test(idInput.value)) {
                userId = idInput.value;
            }
        }

        if (!userId && modal.dataset && modal.dataset.url) {
            var dataMatch = modal.dataset.url.match(/[?&]id=([0-9a-f-]+)/i);
            if (dataMatch) {
                userId = dataMatch[1];
            }
        }

        return userId;
    }

    function normalizeId(value) {
        return String(value).replace(/[^a-zA-Z0-9_-]/g, '-');
    }

    function htmlEncode(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatNumber(value) {
        return Number(value || 0).toLocaleString();
    }

    function ajaxJson(options) {
        var request = {
            url: options.url,
            type: options.type || 'GET'
        };

        if (options.data) {
            request.data = JSON.stringify(options.data);
            request.contentType = 'application/json';
        }

        return abp.ajax(request);
    }

    function getBalanceUrl(userId) {
        return '/api/admin/users/' + encodeURIComponent(userId) + '/balance';
    }

    function injectBalanceTab(container, attempt) {
        if (!isUsersPage()) {
            return;
        }

        attempt = attempt || 0;
        ensureStyles();

        var modalBody = container.querySelector('.modal-body')
            || container.querySelector('.offcanvas-body')
            || container.querySelector('[class*="modal-body"]')
            || container;
        var userId = findUserIdInModal(container);

        if (container.querySelector('.kt-user-balance-pane')) {
            return;
        }

        if (!modalBody) {
            if (attempt < 6) {
                setTimeout(function () {
                    injectBalanceTab(modal, attempt + 1);
                }, 300);
            }

            return;
        }

        var tabList = modalBody.querySelector('.nav-tabs')
            || container.querySelector('.nav-tabs');
        var tabContent = modalBody.querySelector('.tab-content')
            || container.querySelector('.tab-content');

        if (!userId || !tabList || !tabContent) {
            if (attempt < 6) {
                setTimeout(function () {
                    injectBalanceTab(container, attempt + 1);
                }, 300);
            }

            return;
        }

        var normalizedUserId = normalizeId(userId);
        var tabId = 'kt-user-balance-tab-' + normalizedUserId;
        var paneId = 'kt-user-balance-pane-' + normalizedUserId;

        var item = document.createElement('li');
        item.className = 'nav-item';
        item.setAttribute('role', 'presentation');
        item.innerHTML = '<button class="nav-link" id="' + tabId + '" data-bs-toggle="tab" data-bs-target="#' + paneId + '" type="button" role="tab" aria-controls="' + paneId + '" aria-selected="false">Balance</button>';
        tabList.appendChild(item);

        var pane = document.createElement('div');
        pane.className = 'tab-pane fade kt-user-balance-pane';
        pane.id = paneId;
        pane.setAttribute('role', 'tabpanel');
        pane.setAttribute('aria-labelledby', tabId);
        pane.dataset.userId = userId;
        pane.innerHTML = renderLoading();
        tabContent.appendChild(pane);

        attachPaneHandlers(pane);

        var tabButton = item.querySelector('button');
        tabButton.addEventListener('shown.bs.tab', function () {
            if (pane.dataset.loaded !== 'true') {
                loadBalance(pane);
            }
        });
    }

    function attachPaneHandlers(pane) {
        pane.addEventListener('click', function (event) {
            var target = event.target.closest('[data-kt-balance-action]');
            if (!target) {
                return;
            }

            event.preventDefault();

            var action = target.dataset.ktBalanceAction;
            if (action === 'reload') {
                loadBalance(pane);
            } else if (action === 'save-wallet') {
                saveWallet(pane);
            } else if (action === 'save-package') {
                savePackage(pane, Number(target.dataset.treePoolId));
            } else if (action === 'delete-package') {
                deletePackage(pane, Number(target.dataset.treePoolId));
            } else if (action === 'add-package') {
                addPackage(pane);
            }
        });
    }

    function loadBalance(pane) {
        pane.innerHTML = renderLoading();

        ajaxJson({
            url: getBalanceUrl(pane.dataset.userId)
        }).then(function (data) {
            pane.dataset.loaded = 'true';
            pane._balanceData = data;
            renderBalance(pane, data);
        }).catch(function () {
            pane.dataset.loaded = 'false';
            pane.innerHTML = renderError('Cannot load balance data.');
        });
    }

    function saveWallet(pane) {
        var coinInput = pane.querySelector('[data-kt-balance-input="coin"]');
        var gemInput = pane.querySelector('[data-kt-balance-input="gem"]');
        var payload = {
            coin: Math.max(0, Number(coinInput.value || 0)),
            gem: Math.max(0, Number(gemInput.value || 0))
        };

        ajaxJson({
            url: getBalanceUrl(pane.dataset.userId) + '/wallet',
            type: 'PUT',
            data: payload
        }).then(function (data) {
            pane._balanceData = data;
            renderBalance(pane, data);
            abp.notify.success('Balance updated.');
        }).catch(function () {
            abp.notify.error('Cannot update wallet.');
        });
    }

    function savePackage(pane, treePoolId) {
        var input = pane.querySelector('[data-kt-balance-package-qty="' + treePoolId + '"]');
        upsertPackage(pane, treePoolId, Math.max(0, Number(input.value || 0)), 'Seed package updated.');
    }

    function addPackage(pane) {
        var poolSelect = pane.querySelector('[data-kt-balance-input="treePoolId"]');
        var quantityInput = pane.querySelector('[data-kt-balance-input="quantity"]');
        var treePoolId = Number(poolSelect.value || 0);
        var quantity = Math.max(0, Number(quantityInput.value || 0));

        if (!treePoolId || quantity <= 0) {
            abp.notify.warn('Choose a tree pool and enter a quantity greater than zero.');
            return;
        }

        upsertPackage(pane, treePoolId, quantity, 'Seed package saved.');
    }

    function upsertPackage(pane, treePoolId, quantity, successMessage) {
        ajaxJson({
            url: getBalanceUrl(pane.dataset.userId) + '/seed-packages',
            type: 'PUT',
            data: {
                treePoolId: treePoolId,
                quantity: quantity
            }
        }).then(function (data) {
            pane._balanceData = data;
            renderBalance(pane, data);
            abp.notify.success(successMessage);
        }).catch(function () {
            abp.notify.error('Cannot save seed package.');
        });
    }

    function deletePackage(pane, treePoolId) {
        if (!confirm('Remove this seed package from the user?')) {
            return;
        }

        ajaxJson({
            url: getBalanceUrl(pane.dataset.userId) + '/seed-packages/' + treePoolId,
            type: 'DELETE'
        }).then(function (data) {
            pane._balanceData = data;
            renderBalance(pane, data);
            abp.notify.success('Seed package removed.');
        }).catch(function () {
            abp.notify.error('Cannot remove seed package.');
        });
    }

    function renderBalance(pane, data) {
        pane.innerHTML = [
            '<div class="kt-balance-summary">',
            '  <div class="kt-balance-field">',
            '    <label>Coin</label>',
            '    <input type="number" min="0" step="1" class="form-control" data-kt-balance-input="coin" value="' + Number(data.wallet.coin || 0) + '">',
            '  </div>',
            '  <div class="kt-balance-field">',
            '    <label>Gem</label>',
            '    <input type="number" min="0" step="1" class="form-control" data-kt-balance-input="gem" value="' + Number(data.wallet.gem || 0) + '">',
            '  </div>',
            '</div>',
            '<div class="d-flex justify-content-end mb-3">',
            '  <button type="button" class="btn btn-primary btn-sm" data-kt-balance-action="save-wallet"><i class="fa fa-save me-1"></i>Save Balance</button>',
            '</div>',
            '<div class="kt-balance-section-title">Seed packages</div>',
            renderSeedPackages(data.seedPackages || []),
            '<div class="kt-balance-section-title">Add or update package</div>',
            renderAddPackage(data.treePools || []),
            '<div class="text-muted small mt-2">Setting quantity to 0 removes the package.</div>'
        ].join('');
    }

    function renderSeedPackages(seedPackages) {
        if (!seedPackages.length) {
            return '<div class="kt-balance-empty">No seed package owned.</div>';
        }

        var rows = seedPackages.map(function (item) {
            var activeBadge = item.treePoolIsActive
                ? '<span class="badge bg-success">Active</span>'
                : '<span class="badge bg-secondary">Inactive</span>';

            return [
                '<tr>',
                '  <td>',
                '    <div class="fw-semibold">' + htmlEncode(item.treePoolName) + '</div>',
                '    <div class="small text-muted">Pool #' + item.treePoolId + '</div>',
                '  </td>',
                '  <td>' + activeBadge + '</td>',
                '  <td><input type="number" min="0" step="1" class="form-control form-control-sm kt-balance-qty" data-kt-balance-package-qty="' + item.treePoolId + '" value="' + Number(item.quantity || 0) + '"></td>',
                '  <td>',
                '    <div class="kt-balance-actions">',
                '      <button type="button" class="btn btn-outline-primary btn-sm" data-kt-balance-action="save-package" data-tree-pool-id="' + item.treePoolId + '">Save</button>',
                '      <button type="button" class="btn btn-outline-danger btn-sm" data-kt-balance-action="delete-package" data-tree-pool-id="' + item.treePoolId + '">Delete</button>',
                '    </div>',
                '  </td>',
                '</tr>'
            ].join('');
        }).join('');

        return [
            '<div class="table-responsive">',
            '  <table class="table table-sm kt-balance-table">',
            '    <thead><tr><th>Package</th><th>Status</th><th>Quantity</th><th class="text-end">Actions</th></tr></thead>',
            '    <tbody>' + rows + '</tbody>',
            '  </table>',
            '</div>'
        ].join('');
    }

    function renderAddPackage(treePools) {
        var options = ['<option value="">Choose tree pool...</option>'].concat(treePools.map(function (pool) {
            var label = pool.name + ' #' + pool.id + (pool.isActive ? '' : ' (inactive)');
            return '<option value="' + pool.id + '">' + htmlEncode(label) + '</option>';
        })).join('');

        return [
            '<div class="kt-balance-add">',
            '  <div class="kt-balance-add-row">',
            '    <div>',
            '      <label class="form-label">Tree pool</label>',
            '      <select class="form-select form-select-sm" data-kt-balance-input="treePoolId">' + options + '</select>',
            '    </div>',
            '    <div>',
            '      <label class="form-label">Quantity</label>',
            '      <input type="number" min="1" step="1" class="form-control form-control-sm" data-kt-balance-input="quantity" value="1">',
            '    </div>',
            '    <button type="button" class="btn btn-outline-primary btn-sm" data-kt-balance-action="add-package">Save Package</button>',
            '  </div>',
            '</div>'
        ].join('');
    }

    function renderLoading() {
        return '<div class="text-center py-4"><i class="fa fa-spinner fa-spin me-1"></i>Loading balance...</div>';
    }

    function renderError(message) {
        return [
            '<div class="kt-balance-error">',
            '  <div class="fw-semibold mb-2">' + htmlEncode(message) + '</div>',
            '  <button type="button" class="btn btn-outline-danger btn-sm" data-kt-balance-action="reload">Retry</button>',
            '</div>'
        ].join('');
    }

    function findBalanceContainers(root) {
        if (!root || root.nodeType !== 1) {
            return [];
        }

        var candidates = [];
        var selector = '.modal, .offcanvas, [role="dialog"], .modal-content, .offcanvas-body';

        if (root.matches && root.matches(selector)) {
            candidates.push(root);
        }

        if (root.querySelectorAll) {
            root.querySelectorAll(selector).forEach(function (item) {
                candidates.push(item);
            });

            if (root.querySelector('.nav-tabs') && root.querySelector('.tab-content')) {
                candidates.push(root);
            }
        }

        return candidates.filter(function (item, index) {
            return candidates.indexOf(item) === index;
        });
    }

    function scanBalanceContainers(root) {
        findBalanceContainers(root || document.body).forEach(function (container) {
            injectBalanceTab(container);
        });
    }

    function observeModals() {
        if (!isUsersPage()) {
            return;
        }

        scanBalanceContainers(document.body);
        setTimeout(function () { scanBalanceContainers(document.body); }, 500);
        setTimeout(function () { scanBalanceContainers(document.body); }, 1500);

        if (typeof $ !== 'undefined' && $.fn) {
            $(document).on('shown.bs.modal', '.modal', function () {
                var modal = this;
                setTimeout(function () {
                    injectBalanceTab(modal);
                }, 250);
            });

            $(document).on('shown.bs.offcanvas', '.offcanvas', function () {
                var offcanvas = this;
                setTimeout(function () {
                    injectBalanceTab(offcanvas);
                }, 250);
            });
        }

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) {
                        return;
                    }

                    setTimeout(function () {
                        scanBalanceContainers(node);
                    }, 500);
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener('DOMContentLoaded', observeModals);
})();
