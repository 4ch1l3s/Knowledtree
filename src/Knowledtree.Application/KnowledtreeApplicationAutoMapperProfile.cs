using AutoMapper;
using Knowledtree.Friendships;
using Knowledtree.Tags;

namespace Knowledtree;

public class KnowledtreeApplicationAutoMapperProfile : Profile
{
    public KnowledtreeApplicationAutoMapperProfile()
    {
        /* You can configure your AutoMapper mapping configuration here.
         * Alternatively, you can split your mapping configurations
         * into multiple profile classes for a better organization. */

        // Tag -> TagDto
        CreateMap<Tag, TagDto>();

        // Friendship -> FriendshipDto
        CreateMap<Friendship, FriendshipDto>();
    }
}
