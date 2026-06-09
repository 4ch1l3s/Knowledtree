using Volo.Abp.Domain.Entities;

namespace Knowledtree.Trees;

public class TreePoolItem : Entity<int>
{
    public virtual int TreePoolId { get; protected set; }

    public virtual int TreeId { get; protected set; }

    protected TreePoolItem()
    {
    }

    public TreePoolItem(int treePoolId, int treeId)
    {
        TreePoolId = treePoolId;
        TreeId = treeId;
    }
}
