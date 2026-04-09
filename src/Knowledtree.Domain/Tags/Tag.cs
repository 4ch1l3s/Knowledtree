using System;
using Volo.Abp;
using Volo.Abp.Auditing;
using Volo.Abp.Domain.Entities;

namespace Knowledtree.Tags;

public class Tag : AggregateRoot<int>, ISoftDelete, IHasCreationTime
{
    public virtual string Name { get; set; }
    
    public virtual string ColorCode { get; set; }
    
    public virtual Guid UserId { get; set; }
    
    public virtual bool IsDeleted { get; set; }
    
    public virtual DateTime CreationTime { get; set; }

    protected Tag()
    {
    }

    public Tag(string name, string colorCode, Guid userId)
    {
        Name = name;
        ColorCode = colorCode;
        UserId = userId;
    }
}
