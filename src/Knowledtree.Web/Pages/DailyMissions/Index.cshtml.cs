using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.DailyMissions;
using Knowledtree.Permissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Knowledtree.Web.Pages.DailyMissions;

[Authorize(KnowledtreePermissions.DailyMissions.Default)]
public class IndexModel : KnowledtreePageModel
{
    private readonly IAdminDailyMissionAppService _dailyMissionAppService;

    public List<DailyMissionDto> Missions { get; set; } = [];

    public DailyMissionType[] MissionTypes { get; } = Enum.GetValues<DailyMissionType>();

    public DailyMissionRewardType[] RewardTypes { get; } = Enum.GetValues<DailyMissionRewardType>();

    [BindProperty]
    public CreateUpdateDailyMissionDto CreateInput { get; set; } = new();

    [BindProperty]
    public CreateUpdateDailyMissionDto UpdateInput { get; set; } = new();

    public string? OpenModalId { get; set; }

    public int ActiveGoldCount => Missions.Count(x => x.IsActive && x.RewardType == DailyMissionRewardType.Gold);

    public int ActiveGemCount => Missions.Count(x => x.IsActive && x.RewardType == DailyMissionRewardType.Gem);

    public bool PoolIsReady => ActiveGoldCount >= DailyMissionConsts.GoldMissionsPerDay
                               && ActiveGemCount >= DailyMissionConsts.GemMissionsPerDay;

    public IndexModel(IAdminDailyMissionAppService dailyMissionAppService)
    {
        _dailyMissionAppService = dailyMissionAppService;
    }

    public virtual async Task OnGetAsync()
    {
        await LoadAsync();
    }

    public virtual async Task<IActionResult> OnPostCreateAsync()
    {
        KeepModelStatePrefix(nameof(CreateInput));
        await LoadAsync();
        if (!ModelState.IsValid)
        {
            OpenModalId = "createDailyMissionModal";
            return Page();
        }

        try
        {
            await _dailyMissionAppService.CreateAsync(CreateInput);
            return RedirectToPage();
        }
        catch (Exception exception)
        {
            ModelState.AddModelError(string.Empty, exception.Message);
            OpenModalId = "createDailyMissionModal";
            return Page();
        }
    }

    public virtual async Task<IActionResult> OnPostUpdateAsync(int id)
    {
        KeepModelStatePrefix(nameof(UpdateInput));
        await LoadAsync();
        if (!ModelState.IsValid)
        {
            OpenModalId = $"editDailyMissionModal-{id}";
            return Page();
        }

        try
        {
            await _dailyMissionAppService.UpdateAsync(id, UpdateInput);
            return RedirectToPage();
        }
        catch (Exception exception)
        {
            ModelState.AddModelError(string.Empty, exception.Message);
            OpenModalId = $"editDailyMissionModal-{id}";
            return Page();
        }
    }

    public virtual async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        try
        {
            await _dailyMissionAppService.DeleteAsync(id);
            return RedirectToPage();
        }
        catch (Exception exception)
        {
            ModelState.AddModelError(string.Empty, exception.Message);
            await LoadAsync();
            return Page();
        }
    }

    private async Task LoadAsync()
    {
        Missions = await _dailyMissionAppService.GetListAsync();
    }

    private void KeepModelStatePrefix(string prefix)
    {
        foreach (var key in ModelState.Keys
                     .Where(x => !x.StartsWith(prefix + ".", StringComparison.Ordinal)
                                 && !string.Equals(x, prefix, StringComparison.Ordinal))
                     .ToList())
        {
            ModelState.Remove(key);
        }
    }
}
