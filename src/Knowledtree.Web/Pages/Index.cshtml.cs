using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp.Identity;

namespace Knowledtree.Web.Pages;

public class IndexModel : KnowledtreePageModel
{
    private readonly IIdentityUserRepository _userRepository;

    public int UserCount { get; set; }

    public IndexModel(IIdentityUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task OnGetAsync()
    {
        if (CurrentUser.IsAuthenticated)
        {
            UserCount = (int)await _userRepository.GetCountAsync();
        }
    }
}
