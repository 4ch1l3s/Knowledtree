using Knowledtree.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace Knowledtree.Permissions;

public class KnowledtreePermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(KnowledtreePermissions.GroupName);

        var userAvatarPermission = myGroup.AddPermission(
            KnowledtreePermissions.UserAvatars.Default,
            L("Permission:UserAvatars"));

        userAvatarPermission.AddChild(
            KnowledtreePermissions.UserAvatars.Delete,
            L("Permission:UserAvatars.Delete"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<KnowledtreeResource>(name);
    }
}
