using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Knowledtree.Tags;
using Shouldly;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Identity;
using Volo.Abp.Security.Claims;
using Xunit;

namespace Knowledtree.EntityFrameworkCore.Applications;

public class TagAppServiceTests : KnowledtreeEntityFrameworkCoreTestBase
{
    private readonly ITagAppService _tagAppService;
    private readonly IdentityUserManager _identityUserManager;
    private readonly ICurrentPrincipalAccessor _currentPrincipalAccessor;

    public TagAppServiceTests()
    {
        _tagAppService = GetRequiredService<ITagAppService>();
        _identityUserManager = GetRequiredService<IdentityUserManager>();
        _currentPrincipalAccessor = GetRequiredService<ICurrentPrincipalAccessor>();
    }

    [Fact]
    public async Task Tag_Should_Be_Created_Updated_And_Deleted()
    {
        var created = await _tagAppService.CreateAsync(new CreateUpdateTagDto
        {
            Name = "Study",
            ColorCode = "#3366FF"
        });

        var tagsAfterCreate = await _tagAppService.GetMyTagsAsync();
        tagsAfterCreate.ShouldContain(x =>
            x.Id == created.Id && x.Name == "Study" && x.ColorCode == "#3366FF");

        var updated = await _tagAppService.UpdateAsync(created.Id, new CreateUpdateTagDto
        {
            Name = "Deep work",
            ColorCode = "#22AA66"
        });
        updated.Name.ShouldBe("Deep work");
        updated.ColorCode.ShouldBe("#22AA66");

        await _tagAppService.DeleteAsync(created.Id);

        var tagsAfterDelete = await _tagAppService.GetMyTagsAsync();
        tagsAfterDelete.ShouldNotContain(x => x.Id == created.Id);
    }

    [Fact]
    public async Task Update_Should_Reject_Tag_Owned_By_Another_User()
    {
        var tag = await _tagAppService.CreateAsync(new CreateUpdateTagDto
        {
            Name = "Private",
            ColorCode = "#AA2233"
        });
        var otherUser = await CreateUserAsync("tag-owner-check");

        using (ChangeCurrentUser(otherUser))
        {
            await Should.ThrowAsync<EntityNotFoundException>(() =>
                _tagAppService.UpdateAsync(tag.Id, new CreateUpdateTagDto
                {
                    Name = "Changed",
                    ColorCode = "#000000"
                }));
        }
    }

    private async Task<IdentityUser> CreateUserAsync(string prefix)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        var userName = $"{prefix}-{suffix}";
        var user = new IdentityUser(
            Guid.NewGuid(),
            userName,
            $"{userName}@test.local");

        var result = await _identityUserManager.CreateAsync(user);
        result.Succeeded.ShouldBeTrue();

        return user;
    }

    private IDisposable ChangeCurrentUser(IdentityUser user)
    {
        var identity = new ClaimsIdentity(
        [
            new Claim(AbpClaimTypes.UserId, user.Id.ToString()),
            new Claim(AbpClaimTypes.UserName, user.UserName),
            new Claim(AbpClaimTypes.Email, user.Email ?? $"{user.UserName}@test.local")
        ], "Test");

        return _currentPrincipalAccessor.Change(new ClaimsPrincipal(identity));
    }
}
