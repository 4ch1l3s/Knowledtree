using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Permissions;
using Knowledtree.Trees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Volo.Abp;

namespace Knowledtree.Web.Pages.TreeManagement.TreePools;

[Authorize(KnowledtreePermissions.TreeManagement.TreePools.Default)]
public class IndexModel : KnowledtreePageModel
{
    private readonly IAdminTreePoolAppService _treePoolAppService;
    private readonly IAdminTreeAppService _treeAppService;

    public List<TreePoolDto> TreePools { get; set; } = [];

    public List<TreeDto> Trees { get; set; } = [];

    public TreePoolType[] PoolTypes { get; } = Enum.GetValues<TreePoolType>();

    public CurrencyType[] CurrencyTypes { get; } = Enum.GetValues<CurrencyType>();

    [BindProperty]
    public CreateUpdateTreePoolDto CreateInput { get; set; } = new();

    [BindProperty]
    public List<int> CreateTreeIds { get; set; } = [];

    [BindProperty]
    public CreateUpdateTreePoolDto UpdateInput { get; set; } = new();

    [BindProperty]
    public List<int> UpdateTreeIds { get; set; } = [];

    public string? ErrorMessage { get; set; }

    public string? OpenModalId { get; set; }

    public IndexModel(
        IAdminTreePoolAppService treePoolAppService,
        IAdminTreeAppService treeAppService)
    {
        _treePoolAppService = treePoolAppService;
        _treeAppService = treeAppService;
    }

    public virtual async Task OnGetAsync()
    {
        await LoadAsync();
    }

    public virtual async Task<IActionResult> OnPostCreateAsync()
    {
        KeepModelStatePrefixes(nameof(CreateInput), nameof(CreateTreeIds));
        await LoadAsync();
        ValidateTreePoolForm(CreateInput, CreateTreeIds, nameof(CreateInput));

        if (!ModelState.IsValid)
        {
            return PageWithError("createTreePoolModal");
        }

        try
        {
            var shouldActivate = CreateInput.IsActive;
            CreateInput.IsActive = false;

            var pool = await _treePoolAppService.CreateAsync(CreateInput);
            await _treePoolAppService.ReplaceItemsAsync(pool.Id, new ReplaceTreePoolItemsDto { TreeIds = CreateTreeIds });

            if (shouldActivate)
            {
                CreateInput.IsActive = true;
                await _treePoolAppService.UpdateAsync(pool.Id, CreateInput);
            }

            return RedirectToPage();
        }
        catch (Exception ex)
        {
            AddExceptionToModelState(ex);
            return await PageWithErrorAsync("createTreePoolModal");
        }
    }

    public virtual async Task<IActionResult> OnPostUpdateAsync(int id)
    {
        KeepModelStatePrefixes(nameof(UpdateInput), nameof(UpdateTreeIds));
        await LoadAsync();
        ValidateTreePoolForm(UpdateInput, UpdateTreeIds, nameof(UpdateInput));

        if (!ModelState.IsValid)
        {
            return PageWithError($"editTreePoolModal-{id}");
        }

        try
        {
            var shouldActivate = UpdateInput.IsActive;
            UpdateInput.IsActive = false;

            await _treePoolAppService.UpdateAsync(id, UpdateInput);
            await _treePoolAppService.ReplaceItemsAsync(id, new ReplaceTreePoolItemsDto { TreeIds = UpdateTreeIds });

            if (shouldActivate)
            {
                UpdateInput.IsActive = true;
                await _treePoolAppService.UpdateAsync(id, UpdateInput);
            }

            return RedirectToPage();
        }
        catch (Exception ex)
        {
            AddExceptionToModelState(ex);
            return await PageWithErrorAsync($"editTreePoolModal-{id}");
        }
    }

    public virtual async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        try
        {
            await _treePoolAppService.DeleteAsync(id);
            return RedirectToPage();
        }
        catch (Exception ex)
        {
            AddExceptionToModelState(ex);
            return await PageWithErrorAsync(null);
        }
    }

    public bool PoolContainsTree(TreePoolDto pool, int treeId)
    {
        return pool.Trees.Any(x => x.Id == treeId);
    }

    private async Task LoadAsync()
    {
        TreePools = await _treePoolAppService.GetListAsync();
        Trees = await _treeAppService.GetListAsync();
    }

    private async Task<PageResult> PageWithErrorAsync(string? openModalId)
    {
        OpenModalId = openModalId;
        await LoadAsync();
        return Page();
    }

    private PageResult PageWithError(string? openModalId)
    {
        OpenModalId = openModalId;
        return Page();
    }

    private void ValidateTreePoolForm(CreateUpdateTreePoolDto input, List<int> treeIds, string prefix)
    {
        var totalRate = input.CommonRate + input.RareRate + input.GoldRate;
        if (totalRate != 100m)
        {
            ModelState.AddModelError(
                $"{prefix}.{nameof(input.CommonRate)}",
                "Common, Rare, and Gold rates must total exactly 100%.");
        }

        if (input.StartTime.HasValue && input.EndTime.HasValue && input.StartTime.Value > input.EndTime.Value)
        {
            ModelState.AddModelError(
                $"{prefix}.{nameof(input.EndTime)}",
                "End time must be after start time.");
        }

        var selectedTreeIds = treeIds.Distinct().ToHashSet();
        var selectedTrees = Trees.Where(x => selectedTreeIds.Contains(x.Id)).ToList();
        if (selectedTrees.Count != selectedTreeIds.Count)
        {
            ModelState.AddModelError(string.Empty, "One or more selected trees no longer exist.");
        }

        if (!input.IsActive)
        {
            return;
        }

        var selectedRarities = selectedTrees.Select(x => x.Rarity).ToHashSet();
        AddMissingRarityErrorIfNeeded(input.CommonRate, TreeRarity.Common, selectedRarities);
        AddMissingRarityErrorIfNeeded(input.RareRate, TreeRarity.Rare, selectedRarities);
        AddMissingRarityErrorIfNeeded(input.GoldRate, TreeRarity.Gold, selectedRarities);
    }

    private void AddMissingRarityErrorIfNeeded(
        decimal rate,
        TreeRarity rarity,
        HashSet<TreeRarity> selectedRarities)
    {
        if (rate <= 0 || selectedRarities.Contains(rarity))
        {
            return;
        }

        ModelState.AddModelError(
            string.Empty,
            $"Active treepools require at least one {rarity} tree when the {rarity} rate is greater than 0%.");
    }

    private void AddExceptionToModelState(Exception exception)
    {
        ModelState.AddModelError(string.Empty, GetDisplayErrorMessage(exception));
    }

    private static string GetDisplayErrorMessage(Exception exception)
    {
        if (exception is BusinessException businessException)
        {
            return businessException.Code switch
            {
                KnowledtreeDomainErrorCodes.InvalidTreePoolRates =>
                    "Common, Rare, and Gold rates must total exactly 100%.",
                KnowledtreeDomainErrorCodes.InvalidTreePoolDateRange =>
                    "End time must be after start time.",
                KnowledtreeDomainErrorCodes.TreePoolMissingRarityItems =>
                    "Active treepools must contain at least one tree for every rarity with a rate greater than 0%.",
                KnowledtreeDomainErrorCodes.ReferencedTreePoolCannotBeDeleted =>
                    "This treepool is already referenced and cannot be deleted.",
                _ => businessException.Message
            };
        }

        return exception.Message;
    }

    private void KeepModelStatePrefixes(params string[] prefixes)
    {
        foreach (var key in ModelState.Keys
                     .Where(x => !prefixes.Any(prefix =>
                         x.StartsWith(prefix + ".", StringComparison.Ordinal)
                         || string.Equals(x, prefix, StringComparison.Ordinal)))
                     .ToList())
        {
            ModelState.Remove(key);
        }
    }
}
