using System;

namespace Knowledtree.Tags;

/// <summary>
/// DTO tra ve thong tin Tag
/// </summary>
[Serializable]
public class TagDto
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string ColorCode { get; set; } = null!;

    public DateTime CreationTime { get; set; }
}
