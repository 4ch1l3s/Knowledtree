using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Knowledtree.Trees;
using Knowledtree.UserWallets;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Users;

namespace Knowledtree.DailyMissions;

[Authorize]
public class DailyMissionAppService : KnowledtreeAppService, IDailyMissionAppService
{
    private static readonly TimeZoneInfo MissionTimeZone = ResolveMissionTimeZone();

    private readonly IRepository<DailyMission, int> _dailyMissionRepository;
    private readonly IRepository<UserDailyMission, Guid> _userDailyMissionRepository;
    private readonly IRepository<PlantingSession, Guid> _plantingSessionRepository;
    private readonly IRepository<UserWallet, Guid> _walletRepository;

    public DailyMissionAppService(
        IRepository<DailyMission, int> dailyMissionRepository,
        IRepository<UserDailyMission, Guid> userDailyMissionRepository,
        IRepository<PlantingSession, Guid> plantingSessionRepository,
        IRepository<UserWallet, Guid> walletRepository)
    {
        _dailyMissionRepository = dailyMissionRepository;
        _userDailyMissionRepository = userDailyMissionRepository;
        _plantingSessionRepository = plantingSessionRepository;
        _walletRepository = walletRepository;
    }

    public virtual async Task<TodayDailyMissionsDto> GetTodayAsync()
    {
        var userId = CurrentUser.GetId();
        var missionDate = GetCurrentMissionDate();
        var assignments = await GetOrCreateAssignmentsAsync(userId, missionDate);
        await SyncProgressAsync(assignments, userId, missionDate);
        var wallet = await GetOrCreateWalletAsync(userId);
        var items = assignments.OrderBy(x => x.Slot).Select(MapAssignment).ToList();

        return new TodayDailyMissionsDto
        {
            MissionDate = missionDate,
            ResetsAt = GetMissionWindowUtc(missionDate).End,
            CompletedCount = items.Count(x => x.IsCompleted),
            ClaimedCount = items.Count(x => x.IsClaimed),
            TotalCount = items.Count,
            Wallet = MapWallet(wallet),
            Missions = items
        };
    }

    public virtual async Task<ClaimDailyMissionResultDto> ClaimAsync(Guid id)
    {
        var userId = CurrentUser.GetId();
        var missionDate = GetCurrentMissionDate();
        var assignment = await AsyncExecuter.FirstOrDefaultAsync(
            (await _userDailyMissionRepository.GetQueryableAsync())
            .Where(x => x.Id == id && x.UserId == userId && x.MissionDate == missionDate));

        if (assignment == null)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.DailyMissionNotFound);
        }

        await SyncProgressAsync([assignment], userId, missionDate);
        var now = Clock.Now;
        assignment.Claim(now);

        var wallet = await GetOrCreateWalletAsync(userId);
        if (assignment.RewardType == DailyMissionRewardType.Gold)
        {
            wallet.CreditCoin(assignment.RewardAmount);
        }
        else
        {
            wallet.CreditGem(assignment.RewardAmount);
        }

        await _userDailyMissionRepository.UpdateAsync(assignment, autoSave: false);
        await _walletRepository.UpdateAsync(wallet, autoSave: true);

        return new ClaimDailyMissionResultDto
        {
            Mission = MapAssignment(assignment),
            Wallet = MapWallet(wallet)
        };
    }

    protected virtual DateOnly GetCurrentMissionDate()
    {
        var localNow = TimeZoneInfo.ConvertTimeFromUtc(ToUtc(Clock.Now), MissionTimeZone);
        return DateOnly.FromDateTime(localNow);
    }

    protected virtual async Task<List<UserDailyMission>> GetOrCreateAssignmentsAsync(
        Guid userId,
        DateOnly missionDate)
    {
        var assignments = await AsyncExecuter.ToListAsync(
            (await _userDailyMissionRepository.GetQueryableAsync())
            .Where(x => x.UserId == userId && x.MissionDate == missionDate));

        if (assignments.Count >= DailyMissionConsts.MissionsPerDay)
        {
            return assignments.OrderBy(x => x.Slot).Take(DailyMissionConsts.MissionsPerDay).ToList();
        }

        var activeMissions = await AsyncExecuter.ToListAsync(
            (await _dailyMissionRepository.GetQueryableAsync()).Where(x => x.IsActive));
        var assignedMissionIds = assignments
            .Where(x => x.DailyMissionId.HasValue)
            .Select(x => x.DailyMissionId!.Value)
            .ToHashSet();

        var goldSlots = new[] { 1, 2 };
        var missingGoldSlots = goldSlots.Where(slot => assignments.All(x => x.Slot != slot)).ToList();
        var missingGemSlots = assignments.All(x => x.Slot != 3) ? new[] { 3 } : [];
        var goldCandidates = SelectForDate(
            activeMissions.Where(x => x.RewardType == DailyMissionRewardType.Gold && !assignedMissionIds.Contains(x.Id)),
            userId,
            missionDate,
            DailyMissionRewardType.Gold,
            missingGoldSlots.Count);
        var gemCandidates = SelectForDate(
            activeMissions.Where(x => x.RewardType == DailyMissionRewardType.Gem && !assignedMissionIds.Contains(x.Id)),
            userId,
            missionDate,
            DailyMissionRewardType.Gem,
            missingGemSlots.Length);

        if (goldCandidates.Count != missingGoldSlots.Count || gemCandidates.Count != missingGemSlots.Length)
        {
            throw new BusinessException(KnowledtreeDomainErrorCodes.DailyMissionPoolInsufficient);
        }

        var newAssignments = new List<UserDailyMission>();
        for (var index = 0; index < missingGoldSlots.Count; index++)
        {
            newAssignments.Add(new UserDailyMission(
                GuidGenerator.Create(), userId, goldCandidates[index], missionDate, missingGoldSlots[index]));
        }

        for (var index = 0; index < missingGemSlots.Length; index++)
        {
            newAssignments.Add(new UserDailyMission(
                GuidGenerator.Create(), userId, gemCandidates[index], missionDate, missingGemSlots[index]));
        }

        if (newAssignments.Count > 0)
        {
            await _userDailyMissionRepository.InsertManyAsync(newAssignments, autoSave: true);
            assignments.AddRange(newAssignments);
        }

        return assignments.OrderBy(x => x.Slot).ToList();
    }

    protected virtual List<DailyMission> SelectForDate(
        IEnumerable<DailyMission> candidates,
        Guid userId,
        DateOnly missionDate,
        DailyMissionRewardType rewardType,
        int count)
    {
        return candidates
            .OrderBy(mission => GetDeterministicSortKey(userId, missionDate, rewardType, mission.Id))
            .Take(count)
            .ToList();
    }

    protected virtual async Task SyncProgressAsync(
        List<UserDailyMission> assignments,
        Guid userId,
        DateOnly missionDate)
    {
        var (dayStart, dayEnd) = GetMissionWindowUtc(missionDate);
        var sessions = await AsyncExecuter.ToListAsync(
            (await _plantingSessionRepository.GetQueryableAsync())
            .Where(x =>
                x.UserId == userId
                && x.Status == PlantingSessionStatus.Claimed
                && x.ServerEndTime.HasValue
                && x.ServerEndTime.Value >= dayStart
                && x.ServerEndTime.Value < dayEnd));
        var completedSessionCount = sessions.Count;
        var focusMinutes = sessions.Sum(x => x.PlannedDurationMinutes);
        var now = Clock.Now;
        var changedAssignments = new List<UserDailyMission>();

        foreach (var assignment in assignments)
        {
            var progress = assignment.MissionType switch
            {
                DailyMissionType.CompleteFocusSessions => completedSessionCount,
                DailyMissionType.FocusMinutes => focusMinutes,
                _ => 0
            };

            if (assignment.Progress == Math.Min(progress, assignment.TargetValue))
            {
                continue;
            }

            assignment.SetProgress(progress, now);
            changedAssignments.Add(assignment);
        }

        if (changedAssignments.Count > 0)
        {
            await _userDailyMissionRepository.UpdateManyAsync(changedAssignments, autoSave: true);
        }
    }

    protected virtual async Task<UserWallet> GetOrCreateWalletAsync(Guid userId)
    {
        var wallet = await AsyncExecuter.FirstOrDefaultAsync(
            (await _walletRepository.GetQueryableAsync()).Where(x => x.UserId == userId));

        if (wallet != null)
        {
            return wallet;
        }

        wallet = new UserWallet(GuidGenerator.Create(), userId, StoreAppService.StarterCoin, StoreAppService.StarterGem);
        return await _walletRepository.InsertAsync(wallet, autoSave: true);
    }

    private static string GetDeterministicSortKey(
        Guid userId,
        DateOnly missionDate,
        DailyMissionRewardType rewardType,
        int missionId)
    {
        var input = $"{userId:N}|{missionDate:yyyy-MM-dd}|{(int)rewardType}|{missionId}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input)));
    }

    private static (DateTime Start, DateTime End) GetMissionWindowUtc(DateOnly missionDate)
    {
        var localStart = DateTime.SpecifyKind(
            missionDate.ToDateTime(TimeOnly.MinValue),
            DateTimeKind.Unspecified);
        var localEnd = localStart.AddDays(1);
        return (
            TimeZoneInfo.ConvertTimeToUtc(localStart, MissionTimeZone),
            TimeZoneInfo.ConvertTimeToUtc(localEnd, MissionTimeZone));
    }

    private static DateTime ToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private static TimeZoneInfo ResolveMissionTimeZone()
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

    private static UserDailyMissionDto MapAssignment(UserDailyMission assignment)
    {
        return new UserDailyMissionDto
        {
            Id = assignment.Id,
            DailyMissionId = assignment.DailyMissionId,
            MissionDate = assignment.MissionDate,
            Slot = assignment.Slot,
            Name = assignment.MissionName,
            Description = assignment.MissionDescription,
            MissionType = assignment.MissionType,
            TargetValue = assignment.TargetValue,
            RewardType = assignment.RewardType,
            RewardAmount = assignment.RewardAmount,
            Progress = assignment.Progress,
            IsCompleted = assignment.IsCompleted,
            IsClaimed = assignment.IsClaimed,
            CompletedAt = assignment.CompletedAt,
            ClaimedAt = assignment.ClaimedAt
        };
    }

    private static WalletDto MapWallet(UserWallet wallet)
    {
        return new WalletDto { Coin = wallet.Coin, Gem = wallet.Gem };
    }
}
