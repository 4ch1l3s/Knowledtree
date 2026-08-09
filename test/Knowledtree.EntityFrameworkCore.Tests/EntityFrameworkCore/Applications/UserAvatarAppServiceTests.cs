using System;
using System.Threading.Tasks;
using Knowledtree.UserAvatars;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace Knowledtree.EntityFrameworkCore.Applications;

public class UserAvatarAppServiceTests : KnowledtreeEntityFrameworkCoreTestBase
{
    private static readonly Guid CurrentUserId =
        Guid.Parse("2e701e62-0953-4dd3-910b-dc6cc93ccb0d");

    private readonly IUserAvatarAppService _userAvatarAppService;

    public UserAvatarAppServiceTests()
    {
        _userAvatarAppService = GetRequiredService<IUserAvatarAppService>();
    }

    [Fact]
    public async Task Avatar_Should_Be_Uploaded_Replaced_And_Deleted()
    {
        var firstContent = new byte[] { 1, 2, 3, 4 };
        var uploaded = await _userAvatarAppService.UploadAvatarAsync(
            CreateMobileUpload(firstContent, "image/png"));

        uploaded.Base64Content.ShouldBe(Convert.ToBase64String(firstContent));
        uploaded.ContentType.ShouldBe("image/png");

        var secondContent = new byte[] { 9, 8, 7 };
        await _userAvatarAppService.UploadAvatarAsync(
            CreateMobileUpload(secondContent, "image/jpeg"));

        var replaced = await _userAvatarAppService.GetAvatarAsync(CurrentUserId);
        replaced.ShouldNotBeNull();
        replaced.Base64Content.ShouldBe(Convert.ToBase64String(secondContent));
        replaced.ContentType.ShouldBe("image/jpeg");

        await _userAvatarAppService.DeleteAvatarAsync();

        var deleted = await _userAvatarAppService.GetMyAvatarAsync();
        deleted.ShouldBeNull();
    }

    [Fact]
    public async Task Upload_Should_Reject_Invalid_Base64()
    {
        await Should.ThrowAsync<UserFriendlyException>(() =>
            _userAvatarAppService.UploadAvatarAsync(new UserAvatarUploadDto
            {
                Base64Content = "not-valid-base64",
                ContentType = "image/png",
                ProcessOnServer = false
            }));
    }

    private static UserAvatarUploadDto CreateMobileUpload(
        byte[] content,
        string contentType)
    {
        return new UserAvatarUploadDto
        {
            Base64Content = Convert.ToBase64String(content),
            ContentType = contentType,
            ProcessOnServer = false
        };
    }
}
