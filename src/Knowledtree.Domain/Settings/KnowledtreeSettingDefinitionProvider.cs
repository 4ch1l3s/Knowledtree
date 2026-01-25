using Volo.Abp.Settings;

namespace Knowledtree.Settings;

public class KnowledtreeSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        //Define your own settings here. Example:
        //context.Add(new SettingDefinition(KnowledtreeSettings.MySetting1));
    }
}
