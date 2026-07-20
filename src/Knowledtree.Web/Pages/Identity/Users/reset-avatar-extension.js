(function () {
    'use strict';
    var l = abp.localization.getResource('Knowledtree');

    var resetAvatarAction = {
        text: l('Web:ResetAvatar'),
        icon: 'fas fa-user-slash',
        confirmMessage: function (data) {
            return l('Web:ResetAvatarConfirm', data.record.userName);
        },
        action: function (data) {
            var userId = data.record.id;

            abp.ajax({
                url: '/api/user-avatar/' + userId,
                type: 'DELETE'
            }).then(function () {
                abp.notify.success(
                    l('Web:AvatarResetSuccess', data.record.userName),
                    l('Web:ResetAvatar')
                );
            }).catch(function (error) {
                if (error && error.status === 404) {
                    abp.notify.warn(
                        l('Web:AvatarNotFound', data.record.userName),
                        l('Web:ResetAvatar')
                    );
                } else if (error && error.status === 403) {
                    abp.notify.error(
                        l('Web:AvatarDeleteForbidden'),
                        l('Web:ResetAvatar')
                    );
                } else {
                    abp.notify.error(
                        l('Web:AvatarDeleteError'),
                        l('Web:ResetAvatar')
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
