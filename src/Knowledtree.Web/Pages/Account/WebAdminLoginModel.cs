using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Localization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using Volo.Abp.Account.Web;
using Volo.Abp.Account.Web.Pages.Account;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.OpenIddict;
using IdentityUser = Volo.Abp.Identity.IdentityUser;

namespace Knowledtree.Web.Pages.Account;

[Dependency(ReplaceServices = true)]
[ExposeServices(typeof(LoginModel), typeof(OpenIddictSupportedLoginModel))]
public class WebAdminLoginModel : OpenIddictSupportedLoginModel
{
    private readonly IStringLocalizer<KnowledtreeResource> _localizer;

    public WebAdminLoginModel(
        IAuthenticationSchemeProvider schemeProvider,
        IOptions<AbpAccountOptions> accountOptions,
        IOptions<IdentityOptions> identityOptions,
        IdentityDynamicClaimsPrincipalContributorCache identityDynamicClaimsPrincipalContributorCache,
        AbpOpenIddictRequestHelper openIddictRequestHelper,
        IStringLocalizer<KnowledtreeResource> localizer)
        : base(
            schemeProvider,
            accountOptions,
            identityOptions,
            identityDynamicClaimsPrincipalContributorCache,
            openIddictRequestHelper)
    {
        _localizer = localizer;
    }

    public override async Task<IActionResult> OnPostAsync(string action)
    {
        if (!string.Equals(action, "Cancel", StringComparison.OrdinalIgnoreCase) &&
            ModelState.IsValid &&
            LoginInput != null)
        {
            var user = await FindUserAsync(LoginInput.UserNameOrEmailAddress);

            if (user != null)
            {
                // Do not increment access-failure counters here. The base model remains
                // responsible for every failed/locked/not-allowed login result.
                var passwordResult = await SignInManager.CheckPasswordSignInAsync(
                    user,
                    LoginInput.Password,
                    lockoutOnFailure: false);

                if (passwordResult.Succeeded && !await HasWebAdminAccessAsync(user))
                {
                    return await PermissionDeniedAsync();
                }
            }
        }

        return await base.OnPostAsync(action);
    }

    public override async Task<IActionResult> OnGetExternalLoginCallbackAsync(
        string returnUrl = "",
        string returnUrlHash = "",
        string? remoteError = null)
    {
        if (string.IsNullOrWhiteSpace(remoteError))
        {
            var externalLogin = await SignInManager.GetExternalLoginInfoAsync();

            if (externalLogin != null)
            {
                var user = await UserManager.FindByLoginAsync(
                    externalLogin.LoginProvider,
                    externalLogin.ProviderKey);

                // The admin portal must not auto-provision an external account. Only an
                // already-linked admin identity can complete an external login here.
                if (user == null || !await HasWebAdminAccessAsync(user))
                {
                    ReturnUrl = returnUrl;
                    ReturnUrlHash = returnUrlHash;
                    return await PermissionDeniedAsync();
                }
            }
        }

        return await base.OnGetExternalLoginCallbackAsync(returnUrl, returnUrlHash, remoteError);
    }

    private async Task<IdentityUser?> FindUserAsync(string userNameOrEmailAddress)
    {
        if (string.IsNullOrWhiteSpace(userNameOrEmailAddress))
        {
            return null;
        }

        return await UserManager.FindByNameAsync(userNameOrEmailAddress) ??
               await UserManager.FindByEmailAsync(userNameOrEmailAddress);
    }

    private async Task<bool> HasWebAdminAccessAsync(IdentityUser user)
    {
        return WebAdminLoginAccessPolicy.HasAccess(await UserManager.GetRolesAsync(user));
    }

    private async Task<IActionResult> PermissionDeniedAsync()
    {
        var attemptedUserName = LoginInput?.UserNameOrEmailAddress;

        await SignInManager.SignOutAsync();

        var pageResult = await base.OnGetAsync();

        if (LoginInput != null && !string.IsNullOrWhiteSpace(attemptedUserName))
        {
            LoginInput.UserNameOrEmailAddress = attemptedUserName;
        }

        Alerts.Danger(_localizer["WebLogin:PermissionDenied"].Value);
        return pageResult;
    }
}

internal static class WebAdminLoginAccessPolicy
{
    internal const string AdminRoleName = "admin";

    internal static bool HasAccess(IEnumerable<string> roleNames)
    {
        return roleNames.Any(roleName =>
            string.Equals(roleName, AdminRoleName, StringComparison.OrdinalIgnoreCase));
    }
}
