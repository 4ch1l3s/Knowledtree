using Knowledtree.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace Knowledtree.Permissions;

public class KnowledtreePermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var myGroup = context.AddGroup(KnowledtreePermissions.GroupName);

        myGroup.AddPermission(
            KnowledtreePermissions.Tester,
            L("Permission:Tester"));

        var userAvatarPermission = myGroup.AddPermission(
            KnowledtreePermissions.UserAvatars.Default,
            L("Permission:UserAvatars"));

        userAvatarPermission.AddChild(
            KnowledtreePermissions.UserAvatars.Delete,
            L("Permission:UserAvatars.Delete"));

        var treeManagementPermission = myGroup.AddPermission(
            KnowledtreePermissions.TreeManagement.Default,
            L("Permission:TreeManagement"));

        var treesPermission = treeManagementPermission.AddChild(
            KnowledtreePermissions.TreeManagement.Trees.Default,
            L("Permission:TreeManagement.Trees"));

        treesPermission.AddChild(
            KnowledtreePermissions.TreeManagement.Trees.Create,
            L("Permission:TreeManagement.Trees.Create"));

        treesPermission.AddChild(
            KnowledtreePermissions.TreeManagement.Trees.Update,
            L("Permission:TreeManagement.Trees.Update"));

        treesPermission.AddChild(
            KnowledtreePermissions.TreeManagement.Trees.Delete,
            L("Permission:TreeManagement.Trees.Delete"));

        var treePoolsPermission = treeManagementPermission.AddChild(
            KnowledtreePermissions.TreeManagement.TreePools.Default,
            L("Permission:TreeManagement.TreePools"));

        treePoolsPermission.AddChild(
            KnowledtreePermissions.TreeManagement.TreePools.Create,
            L("Permission:TreeManagement.TreePools.Create"));

        treePoolsPermission.AddChild(
            KnowledtreePermissions.TreeManagement.TreePools.Update,
            L("Permission:TreeManagement.TreePools.Update"));

        treePoolsPermission.AddChild(
            KnowledtreePermissions.TreeManagement.TreePools.Delete,
            L("Permission:TreeManagement.TreePools.Delete"));

        treePoolsPermission.AddChild(
            KnowledtreePermissions.TreeManagement.TreePools.ManageItems,
            L("Permission:TreeManagement.TreePools.ManageItems"));

        var dailyMissionsPermission = myGroup.AddPermission(
            KnowledtreePermissions.DailyMissions.Default,
            L("Permission:DailyMissions"));

        dailyMissionsPermission.AddChild(
            KnowledtreePermissions.DailyMissions.Create,
            L("Permission:DailyMissions.Create"));

        dailyMissionsPermission.AddChild(
            KnowledtreePermissions.DailyMissions.Update,
            L("Permission:DailyMissions.Update"));

        dailyMissionsPermission.AddChild(
            KnowledtreePermissions.DailyMissions.Delete,
            L("Permission:DailyMissions.Delete"));
    }

    private static LocalizableString L(string name)
    {
        return LocalizableString.Create<KnowledtreeResource>(name);
    }
}
