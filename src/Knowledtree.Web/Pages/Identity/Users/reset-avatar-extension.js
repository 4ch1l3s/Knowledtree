(function () {
    'use strict';

    var resetAvatarAction = {
        text: 'Reset Avatar',
        icon: 'fas fa-user-slash',
        confirmMessage: function (data) {
            return 'Bạn có chắc chắn muốn xóa ảnh đại diện của "' + data.record.userName + '"?';
        },
        action: function (data) {
            var userId = data.record.id;

            abp.ajax({
                url: '/api/user-avatar/' + userId,
                type: 'DELETE'
            }).then(function () {
                abp.notify.success(
                    'Đã xóa ảnh đại diện của "' + data.record.userName + '".',
                    'Reset Avatar'
                );
            }).catch(function (error) {
                if (error && error.status === 404) {
                    abp.notify.warn(
                        'Người dùng "' + data.record.userName + '" chưa có ảnh đại diện.',
                        'Reset Avatar'
                    );
                }
            });
        }
    };

    abp.ui.extensions.entityActions
        .get('identity.user')
        .addContributor(function (actionList) {
            actionList.addTail(resetAvatarAction);
        });
})();
