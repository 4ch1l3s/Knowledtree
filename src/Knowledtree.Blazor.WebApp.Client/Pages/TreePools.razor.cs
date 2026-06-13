using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Blazorise;
using Blazorise.DataGrid;
using Knowledtree.Permissions;
using Knowledtree.Trees;
using Microsoft.AspNetCore.Authorization;

namespace Knowledtree.Blazor.WebApp.Client.Pages;

public partial class TreePools
{
    private List<TreePoolDto> TreePoolList { get; set; } = [];
    private CreateUpdateTreePoolDto NewTreePool { get; set; } = new();
    private CreateUpdateTreePoolDto EditingTreePool { get; set; } = new();
    private int EditingTreePoolId { get; set; }

    // Quyen
    private bool CanCreate { get; set; }
    private bool CanUpdate { get; set; }
    private bool CanDelete { get; set; }

    // Modal refs
    private Modal CreateModal { get; set; } = null!;
    private Modal EditModal { get; set; } = null!;
    private Validations CreateValidationsRef { get; set; } = null!;
    private Validations EditValidationsRef { get; set; } = null!;

    protected override async Task OnInitializedAsync()
    {
        await SetPermissionsAsync();
        await LoadDataAsync();
    }

    private async Task SetPermissionsAsync()
    {
        CanCreate = await AuthorizationService.IsGrantedAsync(
            KnowledtreePermissions.TreeManagement.TreePools.Create);
        CanUpdate = await AuthorizationService.IsGrantedAsync(
            KnowledtreePermissions.TreeManagement.TreePools.Update);
        CanDelete = await AuthorizationService.IsGrantedAsync(
            KnowledtreePermissions.TreeManagement.TreePools.Delete);
    }

    private async Task LoadDataAsync()
    {
        TreePoolList = await TreePoolAppService.GetListAsync();
    }

    // DataGrid callback
    private async Task OnDataGridReadAsync(DataGridReadDataEventArgs<TreePoolDto> e)
    {
        await LoadDataAsync();
        await InvokeAsync(StateHasChanged);
    }

    // -- Tao moi --
    private async Task OpenCreateModal()
    {
        if (CreateValidationsRef != null)
        {
            await CreateValidationsRef.ClearAll();
        }

        NewTreePool = new CreateUpdateTreePoolDto();
        await CreateModal.Show();
    }

    private async Task CloseCreateModal()
    {
        await CreateModal.Hide();
    }

    private async Task CreateAsync()
    {
        if (CreateValidationsRef != null)
        {
            var isValid = await CreateValidationsRef.ValidateAll();
            if (!isValid) return;
        }

        await TreePoolAppService.CreateAsync(NewTreePool);
        await LoadDataAsync();
        await CreateModal.Hide();
    }

    // -- Chinh sua --
    private async Task OpenEditModal(TreePoolDto dto)
    {
        if (EditValidationsRef != null)
        {
            await EditValidationsRef.ClearAll();
        }

        EditingTreePoolId = dto.Id;
        EditingTreePool = new CreateUpdateTreePoolDto
        {
            Name = dto.Name,
            PoolType = dto.PoolType,
            CurrencyType = dto.CurrencyType,
            Cost = dto.Cost,
            CommonRate = dto.CommonRate,
            RareRate = dto.RareRate,
            GoldRate = dto.GoldRate,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            IsActive = dto.IsActive,
            PackageImageKey = dto.PackageImageKey
        };
        await EditModal.Show();
    }

    private async Task CloseEditModal()
    {
        await EditModal.Hide();
    }

    private async Task UpdateAsync()
    {
        if (EditValidationsRef != null)
        {
            var isValid = await EditValidationsRef.ValidateAll();
            if (!isValid) return;
        }

        await TreePoolAppService.UpdateAsync(EditingTreePoolId, EditingTreePool);
        await LoadDataAsync();
        await EditModal.Hide();
    }

    // -- Xoa --
    private async Task DeleteAsync(TreePoolDto dto)
    {
        var confirmed = await Message.Confirm(L["DeleteConfirmationMessage"]);
        if (!confirmed) return;

        await TreePoolAppService.DeleteAsync(dto.Id);
        await LoadDataAsync();
    }
}
