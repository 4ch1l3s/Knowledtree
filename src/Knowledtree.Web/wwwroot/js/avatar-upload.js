// Avatar injection script
// Tự động inject avatar widget vào:
// 1. Account/Manage — Personal Info tab
// 2. Identity Users — Edit user modal
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        setupAvatarErrorHandlers();
        injectAccountManageAvatar();
        observeIdentityUserModal();
    });

    // ── 0. Xử lý lỗi tải ảnh avatar (thay thế inline onerror bị CSP chặn) ──
    function setupAvatarErrorHandlers() {
        // Avatar lớn (trang Account/Manage)
        document.querySelectorAll('img.avatar-large').forEach(function (img) {
            img.addEventListener('error', function () {
                this.style.display = 'none';
                var placeholder = this.nextElementSibling;
                if (placeholder) placeholder.style.display = 'flex';
            });
        });
        // Avatar nhỏ trên topbar (UserMenu)
        document.querySelectorAll('img.lpx-user-avatar').forEach(function (img) {
            img.addEventListener('error', function () {
                this.style.display = 'none';
                var placeholder = this.nextElementSibling;
                if (placeholder) placeholder.style.display = 'flex';
            });
        });
    }

    // ── 1. Account/Manage: inject avatar vào Personal Info ──
    function injectAccountManageAvatar() {
        if (!window.location.pathname.toLowerCase().includes('/account/manage')) return;

        // Kiểm tra xem có widget server-rendered sẵn không (từ _AvatarSection.cshtml)
        var existingContainer = document.querySelector('.avatar-edit-container');
        if (existingContainer) {
            console.log('[Avatar DEBUG] Found server-rendered widget, attaching handlers...');
            attachHandlersToExistingWidget(existingContainer);
            return;
        }

        // Nếu không có widget server-rendered, tạo mới qua JS (fallback)
        var personalInfoForm = document.querySelector('#PersonalSettingsForm')
            || document.querySelector('form[id*="PersonalInfo"]')
            || document.querySelector('.tab-pane.active form')
            || document.querySelector('.tab-content form');

        if (!personalInfoForm) {
            setTimeout(injectAccountManageAvatar, 500);
            return;
        }

        console.log('[Avatar DEBUG] No server-rendered widget, creating via JS...');
        createAvatarWidget(personalInfoForm, 'my', '/api/user-avatar/upload', '?', false);
    }

    // ── Gắn event handler vào widget server-rendered đã có sẵn ──
    function attachHandlersToExistingWidget(container) {
        var fileInput = container.querySelector('input[type="file"]');
        var img = container.querySelector('img');
        var placeholder = container.querySelector('.avatar-large-placeholder');
        var uploadUrl = container.dataset.uploadUrl || '/api/user-avatar/upload';

        if (!fileInput) {
            console.error('[Avatar DEBUG] No file input found in existing widget');
            return;
        }

        // Click handler — click bất kỳ đâu trong container → mở file dialog
        container.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[Avatar DEBUG] Container clicked, opening file dialog...');
            fileInput.click();
        });

        // File change handler — upload khi chọn file
        fileInput.addEventListener('change', function () {
            if (!this.files || !this.files[0]) return;
            var file = this.files[0];

            console.log('[Avatar DEBUG] File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

            // Preview ngay lập tức
            var reader = new FileReader();
            reader.onload = function (e) {
                if (img) {
                    img.src = e.target.result;
                    img.style.display = 'block';
                }
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);

            // Upload
            var formData = new FormData();
            formData.append('file', file);

            var headers = {};
            var csrfToken = document.querySelector('input[name="__RequestVerificationToken"]')?.value
                || document.querySelector('meta[name="RequestVerificationToken"]')?.content;
            if (csrfToken) {
                headers['RequestVerificationToken'] = csrfToken;
            }

            console.log('[Avatar DEBUG] Upload URL:', uploadUrl);
            console.log('[Avatar DEBUG] CSRF Token found:', !!csrfToken);

            fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                headers: headers
            })
                .then(function (response) {
                    console.log('[Avatar DEBUG] Response status:', response.status, response.statusText);
                    if (response.ok) {
                        console.log('[Avatar DEBUG] Upload thành công!');
                        document.querySelectorAll('.lpx-user-avatar').forEach(function (a) {
                            a.src = a.src.split('?')[0] + '?t=' + Date.now();
                        });
                    } else {
                        response.text().then(function (text) {
                            console.error('[Avatar DEBUG] Upload thất bại:', response.status, text);
                        });
                    }
                })
                .catch(function (err) {
                    console.error('[Avatar DEBUG] Upload error:', err);
                });

            this.value = '';
        });

        console.log('[Avatar DEBUG] Handlers attached to existing widget OK');
    }

    // ── 2. Identity Users: observe modal mở và inject avatar ──
    function observeIdentityUserModal() {
        if (!window.location.pathname.toLowerCase().includes('/identity/users')) return;

        // Dùng jQuery event vì ABP dùng abp.ModalManager (jQuery-based)
        if (typeof $ !== 'undefined' && $.fn) {
            $(document).on('shown.bs.modal', '.modal', function () {
                var modalBody = this.querySelector('.modal-body');
                if (modalBody) {
                    // Đợi AJAX content load xong
                    setTimeout(function () { injectModalAvatar(modalBody); }, 500);
                }
            });
        }

        // Fallback: native DOM observer
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) return;

                    // Tìm modal-body trong node mới thêm
                    var modalBody = null;
                    if (node.classList && node.classList.contains('modal-body')) {
                        modalBody = node;
                    } else if (node.querySelector) {
                        modalBody = node.querySelector('.modal-body');
                    }

                    if (modalBody) {
                        setTimeout(function () { injectModalAvatar(modalBody); }, 500);
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function injectModalAvatar(modalBody) {
        // Đã inject rồi thì bỏ qua
        if (modalBody.querySelector('.avatar-edit-container')) return;

        // ── Tìm userId ──
        var userId = null;

        // Cách 1: Từ form action URL (ABP pattern: ?id=GUID)
        var form = modalBody.closest('.modal-content')?.querySelector('form')
            || modalBody.querySelector('form');

        if (form) {
            var actionUrl = form.getAttribute('action') || '';
            var match = actionUrl.match(/[?&]id=([0-9a-f-]+)/i);
            if (match) userId = match[1];
        }

        // Cách 2: Từ hidden input có name chính xác
        if (!userId) {
            var idInput = modalBody.querySelector('input[name="User.Id"]')
                || modalBody.querySelector('input[name="UserId"]')
                || modalBody.querySelector('input[name="Id"]')
                || modalBody.querySelector('input[name="id"]');
            if (idInput && idInput.value && idInput.value.match(/^[0-9a-f-]+$/i)) {
                userId = idInput.value;
            }
        }

        // Cách 3: Từ modal URL (data attribute hoặc iframe src)
        if (!userId) {
            var modal = modalBody.closest('.modal');
            if (modal) {
                // ABP ModalManager đôi khi lưu URL trong data
                var modalUrl = modal.querySelector('iframe')?.src
                    || modal.dataset?.url || '';
                var urlMatch = modalUrl.match(/[?&]id=([0-9a-f-]+)/i);
                if (urlMatch) userId = urlMatch[1];
            }
        }

        if (!userId) {
            console.log('[Avatar] Không tìm thấy userId trong modal');
            return;
        }

        console.log('[Avatar] Tìm thấy userId:', userId);

        // Tìm tab UserInformation hoặc nội dung đầu tiên
        var targetContainer = modalBody.querySelector('.tab-pane.active')
            || modalBody.querySelector('.tab-pane:first-child')
            || modalBody;

        // Tìm phần tử đầu tiên phía trên UserName
        var firstFormGroup = targetContainer.querySelector('.mb-3')
            || targetContainer.querySelector('.form-group')
            || targetContainer.querySelector('form > div:first-child');

        if (!firstFormGroup) {
            firstFormGroup = targetContainer;
        }

        // Lấy username cho initials
        var userNameInput = targetContainer.querySelector('input[name*="UserName"]')
            || targetContainer.querySelector('input[name*="userName"]');
        var userName = userNameInput ? userNameInput.value : 'U';
        var initials = userName.charAt(0).toUpperCase();

        var uploadUrl = '/api/user-avatar/upload/' + userId;

        createAvatarWidget(firstFormGroup, userId, uploadUrl, initials, true);
    }

    // ── Helper: tạo avatar widget và chèn vào DOM ──
    function createAvatarWidget(targetElement, userId, uploadUrl, initials, insertBefore) {
        initials = initials || '?';

        var container = document.createElement('div');
        container.className = 'text-center mb-4';

        var avatarContainer = document.createElement('div');
        avatarContainer.className = 'avatar-edit-container';
        avatarContainer.dataset.uploadUrl = uploadUrl;

        // Ảnh avatar — dùng userId 'my' cho current user
        var avatarSrc = userId === 'my'
            ? '/api/user-avatar/my?t=' + Date.now()
            : '/api/user-avatar/' + userId + '?t=' + Date.now();

        var img = document.createElement('img');
        img.className = 'avatar-large';
        img.src = avatarSrc;
        img.onerror = function () {
            this.style.display = 'none';
            this.nextElementSibling.style.display = 'flex';
        };
        avatarContainer.appendChild(img);

        var placeholder = document.createElement('div');
        placeholder.className = 'avatar-large-placeholder';
        placeholder.textContent = initials;
        placeholder.style.display = 'none';
        avatarContainer.appendChild(placeholder);

        // Overlay edit
        var overlay = document.createElement('div');
        overlay.className = 'avatar-edit-overlay';
        overlay.innerHTML = '<i class="fa fa-camera"></i>';
        avatarContainer.appendChild(overlay);

        // File input (ẩn)
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/jpeg,image/png';
        fileInput.style.display = 'none';
        avatarContainer.appendChild(fileInput);

        container.appendChild(avatarContainer);

        // Click handler — mở file dialog
        avatarContainer.addEventListener('click', function (e) {
            if (e.target === fileInput) return; // Tránh infinite loop
            e.stopPropagation();
            console.log('[Avatar DEBUG] Click on avatar container, opening file dialog...');
            fileInput.click();
        });

        fileInput.addEventListener('change', function () {
            if (!this.files || !this.files[0]) return;
            var file = this.files[0];

            console.log('[Avatar DEBUG] File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

            // Preview ngay lập tức
            var reader = new FileReader();
            reader.onload = function (e) {
                img.src = e.target.result;
                img.style.display = 'block';
                placeholder.style.display = 'none';
            };
            reader.readAsDataURL(file);

            // Upload — gửi kèm CSRF token cho ABP
            var formData = new FormData();
            formData.append('file', file);

            var headers = {};
            // ABP anti-forgery token
            var csrfToken = document.querySelector('input[name="__RequestVerificationToken"]')?.value
                || document.querySelector('meta[name="RequestVerificationToken"]')?.content;
            if (csrfToken) {
                headers['RequestVerificationToken'] = csrfToken;
            }

            console.log('[Avatar DEBUG] Upload URL:', uploadUrl);
            console.log('[Avatar DEBUG] CSRF Token found:', !!csrfToken);

            fetch(uploadUrl, {
                method: 'POST',
                body: formData,
                headers: headers
            })
                .then(function (response) {
                    console.log('[Avatar DEBUG] Response status:', response.status, response.statusText);
                    if (response.ok) {
                        console.log('[Avatar DEBUG] Upload thành công!');
                        // Refresh topbar avatars
                        document.querySelectorAll('.lpx-user-avatar').forEach(function (a) {
                            a.src = a.src.split('?')[0] + '?t=' + Date.now();
                        });
                    } else {
                        response.text().then(function (text) {
                            console.error('[Avatar DEBUG] Upload thất bại:', response.status, text);
                        });
                    }
                })
                .catch(function (err) {
                    console.error('[Avatar] Upload error:', err);
                });

            this.value = '';
        });

        // Chèn vào DOM
        if (insertBefore && targetElement.parentElement) {
            targetElement.parentElement.insertBefore(container, targetElement);
        } else {
            targetElement.insertBefore(container, targetElement.firstChild);
        }
    }
})();
