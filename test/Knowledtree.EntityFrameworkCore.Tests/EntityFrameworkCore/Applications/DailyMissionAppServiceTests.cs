using System;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.DailyMissions;
using Knowledtree.Trees;
using Shouldly;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;
using Xunit;

namespace Knowledtree.EntityFrameworkCore.Applications;

public class DailyMissionAppServiceTests : KnowledtreeEntityFrameworkCoreTestBase
{
    private static readonly Guid CurrentUserId =
        Guid.Parse("2e701e62-0953-4dd3-910b-dc6cc93ccb0d");

    private readonly IDailyMissionAppService _dailyMissionAppService;
    private readonly IAdminDailyMissionAppService _adminDailyMissionAppService;
    private readonly IRepository<UserDailyMission, Guid> _userDailyMissionRepository;
    private readonly IRepository<Tree, int> _treeRepository;
    private readonly IRepository<TreePool, int> _treePoolRepository;
    private readonly IRepository<PlantingSession, Guid> _plantingSessionRepository;

    public DailyMissionAppServiceTests()
    {
        _dailyMissionAppService = GetRequiredService<IDailyMissionAppService>();
        _adminDailyMissionAppService = GetRequiredService<IAdminDailyMissionAppService>();
        _userDailyMissionRepository = GetRequiredService<IRepository<UserDailyMission, Guid>>();
        _treeRepository = GetRequiredService<IRepository<Tree, int>>();
        _treePoolRepository = GetRequiredService<IRepository<TreePool, int>>();
        _plantingSessionRepository = GetRequiredService<IRepository<PlantingSession, Guid>>();
    }

    [Fact]
    public async Task Admin_Should_Create_Update_And_Delete_Mission()
    {
        var created = await CreateMissionAsync(
            "CRUD mission",
            DailyMissionType.FocusMinutes,
            15,
            DailyMissionRewardType.Gold,
            50,
            isActive: false);

        var updated = await _adminDailyMissionAppService.UpdateAsync(created.Id, new CreateUpdateDailyMissionDto
        {
            Name = "Updated CRUD mission",
            Description = "Updated by integration test",
            MissionType = DailyMissionType.CompleteFocusSessions,
            TargetValue = 2,
            RewardType = DailyMissionRewardType.Gem,
            RewardAmount = 2,
            IsActive = true
        });

        updated.Name.ShouldBe("Updated CRUD mission");
        updated.RewardType.ShouldBe(DailyMissionRewardType.Gem);
        updated.IsActive.ShouldBeTrue();

        await _adminDailyMissionAppService.DeleteAsync(created.Id);
        (await _adminDailyMissionAppService.GetListAsync()).ShouldNotContain(x => x.Id == created.Id);
    }

    [Fact]
    public async Task First_GetToday_Should_Assign_Two_Gold_And_One_Gem_Then_Return_The_Saved_Assignments()
    {
        var first = await _dailyMissionAppService.GetTodayAsync();
        var second = await _dailyMissionAppService.GetTodayAsync();

        first.TotalCount.ShouldBe(3);
        first.Missions.Count(x => x.RewardType == DailyMissionRewardType.Gold).ShouldBe(2);
        first.Missions.Count(x => x.RewardType == DailyMissionRewardType.Gem).ShouldBe(1);
        first.Missions.Select(x => x.Id).ShouldBe(second.Missions.Select(x => x.Id));
        first.Missions.Select(x => x.DailyMissionId).ShouldBe(second.Missions.Select(x => x.DailyMissionId));
        first.Missions.Select(x => x.Slot).ShouldBe(new[] { 1, 2, 3 });
    }

    [Fact]
    public async Task GetToday_Should_Require_A_Sufficient_Active_Pool_And_Exclude_Inactive_Missions()
    {
        await DeactivateAllMissionsAsync();
        var activeGoldOne = await CreateMissionAsync("Active Gold 1", DailyMissionType.FocusMinutes, 30, DailyMissionRewardType.Gold, 100);
        var activeGem = await CreateMissionAsync("Active Gem", DailyMissionType.FocusMinutes, 60, DailyMissionRewardType.Gem, 2);
        var inactiveGold = await CreateMissionAsync("Inactive Gold", DailyMissionType.CompleteFocusSessions, 1, DailyMissionRewardType.Gold, 999, isActive: false);

        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _dailyMissionAppService.GetTodayAsync());

        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.DailyMissionPoolInsufficient);
        await WithUnitOfWorkAsync(async () =>
        {
            (await _userDailyMissionRepository.GetListAsync(x => x.UserId == CurrentUserId)).ShouldBeEmpty();
        });
        var activeGoldTwo = await CreateMissionAsync("Active Gold 2", DailyMissionType.CompleteFocusSessions, 1, DailyMissionRewardType.Gold, 100);

        var today = await _dailyMissionAppService.GetTodayAsync();

        today.Missions.Select(x => x.DailyMissionId).ShouldBe(new int?[]
        {
            activeGoldOne.Id,
            activeGoldTwo.Id,
            activeGem.Id
        }, ignoreOrder: true);
        today.Missions.ShouldNotContain(x => x.DailyMissionId == inactiveGold.Id);
    }

    [Fact]
    public async Task Progress_Should_Count_Only_Claimed_Sessions_In_The_Current_Vietnam_Day_And_Cap_At_Target()
    {
        await DeactivateAllMissionsAsync();
        await CreateMissionAsync("Gold minutes", DailyMissionType.FocusMinutes, 60, DailyMissionRewardType.Gold, 100);
        await CreateMissionAsync("Gold sessions", DailyMissionType.CompleteFocusSessions, 2, DailyMissionRewardType.Gold, 150);
        await CreateMissionAsync("Gem minutes", DailyMissionType.FocusMinutes, 90, DailyMissionRewardType.Gem, 3);
        var initial = await _dailyMissionAppService.GetTodayAsync();
        var catalog = await CreateCatalogAsync();
        var (dayStart, _) = GetCurrentVietnamDayWindowUtc();
        var insideDay = dayStart.AddHours(2);

        await CreateSessionAsync(catalog, PlantingSessionStatus.Claimed, 30, insideDay);
        await CreateSessionAsync(catalog, PlantingSessionStatus.Claimed, 45, insideDay.AddMinutes(1));
        await CreateSessionAsync(catalog, PlantingSessionStatus.Failed, 120, insideDay.AddMinutes(2));
        await CreateSessionAsync(catalog, PlantingSessionStatus.Growing, 180, insideDay.AddMinutes(3));
        await CreateSessionAsync(catalog, PlantingSessionStatus.Cancelled, 90, insideDay.AddMinutes(4));
        await CreateSessionAsync(catalog, PlantingSessionStatus.Claimed, 120, dayStart.AddMinutes(-1));

        var today = await _dailyMissionAppService.GetTodayAsync();
        var goldMinutes = today.Missions.Single(x => x.Name == "Gold minutes");
        var goldSessions = today.Missions.Single(x => x.Name == "Gold sessions");
        var gemMinutes = today.Missions.Single(x => x.Name == "Gem minutes");

        today.Missions.Select(x => x.Id).ShouldBe(initial.Missions.Select(x => x.Id));
        goldMinutes.Progress.ShouldBe(60);
        goldMinutes.IsCompleted.ShouldBeTrue();
        goldSessions.Progress.ShouldBe(2);
        goldSessions.IsCompleted.ShouldBeTrue();
        gemMinutes.Progress.ShouldBe(75);
        gemMinutes.IsCompleted.ShouldBeFalse();
        today.CompletedCount.ShouldBe(2);
    }

    [Fact]
    public async Task Completed_Mission_Should_Credit_Wallet_Only_Once()
    {
        var before = await _dailyMissionAppService.GetTodayAsync();
        await CreateCompletedFocusSessionsAsync(count: 3, minutesPerSession: 30);

        var completed = await _dailyMissionAppService.GetTodayAsync();
        completed.CompletedCount.ShouldBe(3);
        var mission = completed.Missions.First();

        var result = await _dailyMissionAppService.ClaimAsync(mission.Id);
        result.Mission.IsClaimed.ShouldBeTrue();
        if (mission.RewardType == DailyMissionRewardType.Gold)
        {
            result.Wallet.Coin.ShouldBe(before.Wallet.Coin + mission.RewardAmount);
            result.Wallet.Gem.ShouldBe(before.Wallet.Gem);
        }
        else
        {
            result.Wallet.Coin.ShouldBe(before.Wallet.Coin);
            result.Wallet.Gem.ShouldBe(before.Wallet.Gem + mission.RewardAmount);
        }

        var exception = await Should.ThrowAsync<BusinessException>(() =>
            _dailyMissionAppService.ClaimAsync(mission.Id));
        exception.Code.ShouldBe(KnowledtreeDomainErrorCodes.DailyMissionAlreadyClaimed);
    }

    private async Task<DailyMissionDto> CreateMissionAsync(
        string name,
        DailyMissionType missionType,
        int targetValue,
        DailyMissionRewardType rewardType,
        int rewardAmount,
        bool isActive = true)
    {
        return await _adminDailyMissionAppService.CreateAsync(new CreateUpdateDailyMissionDto
        {
            Name = name,
            Description = $"Test mission: {name}",
            MissionType = missionType,
            TargetValue = targetValue,
            RewardType = rewardType,
            RewardAmount = rewardAmount,
            IsActive = isActive
        });
    }

    private async Task DeactivateAllMissionsAsync()
    {
        foreach (var mission in await _adminDailyMissionAppService.GetListAsync())
        {
            await _adminDailyMissionAppService.UpdateAsync(mission.Id, new CreateUpdateDailyMissionDto
            {
                Name = mission.Name,
                Description = mission.Description,
                MissionType = mission.MissionType,
                TargetValue = mission.TargetValue,
                RewardType = mission.RewardType,
                RewardAmount = mission.RewardAmount,
                IsActive = false
            });
        }
    }

    private async Task<(Tree Tree, TreePool Pool)> CreateCatalogAsync()
    {
        return await WithUnitOfWorkAsync(async () =>
        {
            var tree = await _treeRepository.InsertAsync(
                new Tree($"Mission test tree {Guid.NewGuid():N}", null, TreeRarity.Common, "mission_test", 0),
                autoSave: true);
            var pool = await _treePoolRepository.InsertAsync(
                new TreePool(
                    $"Mission test pool {Guid.NewGuid():N}",
                    TreePoolType.Permanent,
                    CurrencyType.Gold,
                    0,
                    100,
                    0,
                    0,
                    null,
                    null,
                    false),
                autoSave: true);

            return (tree, pool);
        });
    }

    private async Task CreateSessionAsync(
        (Tree Tree, TreePool Pool) catalog,
        PlantingSessionStatus status,
        int plannedMinutes,
        DateTime endTime)
    {
        await WithUnitOfWorkAsync(async () =>
        {
            var startTime = endTime.AddMinutes(-plannedMinutes);
            var session = new PlantingSession(
                Guid.NewGuid(),
                CurrentUserId,
                catalog.Pool.Id,
                null,
                plannedMinutes,
                startTime,
                startTime);

            switch (status)
            {
                case PlantingSessionStatus.Claimed:
                    session.Complete(catalog.Tree.Id, endTime, endTime, 0, 0);
                    break;
                case PlantingSessionStatus.Failed:
                    session.Fail(endTime, endTime);
                    break;
                case PlantingSessionStatus.Cancelled:
                    session.Cancel();
                    break;
                case PlantingSessionStatus.Growing:
                    break;
                default:
                    throw new ArgumentOutOfRangeException(nameof(status), status, null);
            }

            await _plantingSessionRepository.InsertAsync(session, autoSave: true);
        });
    }

    private async Task CreateCompletedFocusSessionsAsync(int count, int minutesPerSession)
    {
        var catalog = await CreateCatalogAsync();
        var endTime = DateTime.UtcNow;
        for (var index = 0; index < count; index++)
        {
            await CreateSessionAsync(
                catalog,
                PlantingSessionStatus.Claimed,
                minutesPerSession,
                endTime.AddSeconds(-index));
        }
    }

    private static (DateTime Start, DateTime End) GetCurrentVietnamDayWindowUtc()
    {
        var timeZone = ResolveVietnamTimeZone();
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);
        var localStart = DateTime.SpecifyKind(localNow.Date, DateTimeKind.Unspecified);
        return (
            TimeZoneInfo.ConvertTimeToUtc(localStart, timeZone),
            TimeZoneInfo.ConvertTimeToUtc(localStart.AddDays(1), timeZone));
    }

    private static TimeZoneInfo ResolveVietnamTimeZone()
    {
        foreach (var timeZoneId in new[] { "Asia/Ho_Chi_Minh", "SE Asia Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
                // Try the platform-specific identifier below.
            }
            catch (InvalidTimeZoneException)
            {
                // Try the platform-specific identifier below.
            }
        }

        return TimeZoneInfo.Utc;
    }

}
