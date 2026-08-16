using System.Threading.Tasks;
using Knowledtree.Localization;
using Knowledtree.MultiTenancy;
using Knowledtree.Permissions;
using Microsoft.Extensions.DependencyInjection;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Identity.Web.Navigation;
using Volo.Abp.SettingManagement.Web.Navigation;
using Volo.Abp.TenantManagement.Web.Navigation;
using Volo.Abp.UI.Navigation;

namespace Knowledtree.Web.Menus;

public class KnowledtreeMenuContributor : IMenuContributor
{
    public async Task ConfigureMenuAsync(MenuConfigurationContext context)
    {
        if (context.Menu.Name == StandardMenus.Main)
        {
            await ConfigureMainMenuAsync(context);
        }
    }

    private async Task ConfigureMainMenuAsync(MenuConfigurationContext context)
    {
        var administration = context.Menu.GetAdministration();
        var l = context.GetLocalizer<KnowledtreeResource>();
        var permissionChecker = context.ServiceProvider.GetRequiredService<IPermissionChecker>();

        context.Menu.Items.Insert(
            0,
            new ApplicationMenuItem(
                KnowledtreeMenus.Home,
                l["Menu:Home"],
                "~/",
                icon: "fas fa-home",
                order: 0
            )
        );

        if (MultiTenancyConsts.IsEnabled)
        {
            administration?.SetSubItemOrder(TenantManagementMenuNames.GroupName, 1);
        }
        else
        {
            administration?.TryRemoveMenuItem(TenantManagementMenuNames.GroupName);
        }

        administration?.SetSubItemOrder(IdentityMenuNames.GroupName, 2);

        if (administration != null && await permissionChecker.IsGrantedAsync(KnowledtreePermissions.TreeManagement.Default))
        {
            var treeManagement = new ApplicationMenuItem(
                KnowledtreeMenus.TreeManagement,
                l["Menu:TreeManagement"],
                icon: "fas fa-seedling",
                order: 3);

            if (await permissionChecker.IsGrantedAsync(KnowledtreePermissions.TreeManagement.Trees.Default))
            {
                treeManagement.AddItem(new ApplicationMenuItem(
                    KnowledtreeMenus.Trees,
                    l["Menu:Trees"],
                    "~/TreeManagement/Trees",
                    icon: "fas fa-tree",
                    order: 1));
            }

            if (await permissionChecker.IsGrantedAsync(KnowledtreePermissions.TreeManagement.TreePools.Default))
            {
                treeManagement.AddItem(new ApplicationMenuItem(
                    KnowledtreeMenus.TreePools,
                    l["Menu:TreePools"],
                    "~/TreeManagement/TreePools",
                    icon: "fas fa-layer-group",
                    order: 2));
            }

            if (!treeManagement.IsLeaf)
            {
                administration.AddItem(treeManagement);
            }
        }

        if (administration != null && await permissionChecker.IsGrantedAsync(KnowledtreePermissions.DailyMissions.Default))
        {
            administration.AddItem(new ApplicationMenuItem(
                KnowledtreeMenus.DailyMissions,
                l["Menu:DailyMissions"],
                "~/DailyMissions",
                icon: "fas fa-tasks",
                order: 4));
        }

        administration?.SetSubItemOrder(SettingManagementMenuNames.GroupName, 5);
    }
}
