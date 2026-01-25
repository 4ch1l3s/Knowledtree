using Knowledtree.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace Knowledtree.Permissions;

public class KnowledtreePermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(KnowledtreePermissions.GroupName);
        //Define your own permissions here. Example:
        //myGroup.AddPermission(KnowledtreePermissions.MyPermission1, L("Permission:MyPermission1"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<KnowledtreeResource>(name);
    }
}
