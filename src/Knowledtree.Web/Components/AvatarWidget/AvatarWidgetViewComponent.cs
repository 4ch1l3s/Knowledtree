using System;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.AspNetCore.Mvc;
using Volo.Abp.Users;

namespace Knowledtree.Web.Components.AvatarWidget;

/// <summary>
/// ViewComponent hiển thị avatar có thể chỉnh sửa.
/// Dùng cho Account/Manage và admin edit user.
/// </summary>
public class AvatarWidgetViewComponent : AbpViewComponent
{
    private readonly ICurrentUser _currentUser;

    public AvatarWidgetViewComponent(ICurrentUser currentUser)
    {
        _currentUser = currentUser;
    }

    public IViewComponentResult Invoke(Guid? userId = null, bool editable = true)
    {
        var targetUserId = userId ?? _currentUser.Id;
        var userName = _currentUser.UserName ?? "User";

        var model = new AvatarWidgetModel
        {
            UserId = targetUserId,
            Initials = userName.Length > 0 ? userName[0].ToString().ToUpper() : "U",
            Editable = editable,
            UploadUrl = userId.HasValue
                ? $"/api/user-avatar/upload/{userId.Value}"
                : "/api/user-avatar/upload"
        };

        return View("~/Components/AvatarWidget/Default.cshtml", model);
    }
}

public class AvatarWidgetModel
{
    public Guid? UserId { get; set; }
    public string Initials { get; set; } = "U";
    public bool Editable { get; set; } = true;
    public string UploadUrl { get; set; } = "/api/user-avatar/upload";
}
