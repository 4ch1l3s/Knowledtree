using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Knowledtree.Permissions;
using Knowledtree.Trees;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Knowledtree.Web.Pages.TreeManagement.Trees;

[Authorize(KnowledtreePermissions.TreeManagement.Trees.Default)]
public class IndexModel : KnowledtreePageModel
{
    private readonly IAdminTreeAppService _treeAppService;

    public List<TreeDto> Trees { get; set; } = [];

    public TreeRarity[] Rarities { get; } = Enum.GetValues<TreeRarity>();

    [BindProperty]
    public CreateUpdateTreeDto CreateInput { get; set; } = new();

    [BindProperty]
    public CreateUpdateTreeDto UpdateInput { get; set; } = new();

    public string? ErrorMessage { get; set; }

    public IndexModel(IAdminTreeAppService treeAppService)
    {
        _treeAppService = treeAppService;
    }

    public virtual async Task OnGetAsync()
    {
        await LoadAsync();
    }

    public virtual async Task<IActionResult> OnPostCreateAsync()
    {
        KeepModelStatePrefixes(nameof(CreateInput));

        if (!ModelState.IsValid)
        {
            return await PageWithErrorAsync(null);
        }

        try
        {
            await _treeAppService.CreateAsync(CreateInput);
            return RedirectToPage();
        }
        catch (Exception ex)
        {
            return await PageWithErrorAsync(ex);
        }
    }

    public virtual async Task<IActionResult> OnPostUpdateAsync(int id)
    {
        KeepModelStatePrefixes(nameof(UpdateInput));

        if (!ModelState.IsValid)
        {
            return await PageWithErrorAsync(null);
        }

        try
        {
            await _treeAppService.UpdateAsync(id, UpdateInput);
            return RedirectToPage();
        }
        catch (Exception ex)
        {
            return await PageWithErrorAsync(ex);
        }
    }

    public virtual async Task<IActionResult> OnPostDeleteAsync(int id)
    {
        try
        {
            await _treeAppService.DeleteAsync(id);
            return RedirectToPage();
        }
        catch (Exception ex)
        {
            return await PageWithErrorAsync(ex);
        }
    }

    private async Task LoadAsync()
    {
        Trees = await _treeAppService.GetListAsync();
    }

    private async Task<PageResult> PageWithErrorAsync(Exception? exception)
    {
        ErrorMessage = exception?.Message;
        await LoadAsync();
        return Page();
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
