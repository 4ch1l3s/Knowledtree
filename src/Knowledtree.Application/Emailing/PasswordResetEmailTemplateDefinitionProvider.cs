using Volo.Abp.Account.Emailing.Templates;
using Volo.Abp.TextTemplating;

namespace Knowledtree.Emailing;

public class PasswordResetEmailTemplateDefinitionProvider : TemplateDefinitionProvider
{
    public override void Define(ITemplateDefinitionContext context)
    {
    }

    public override void PostDefine(ITemplateDefinitionContext context)
    {
        var template = context.GetOrNull(AccountEmailTemplates.PasswordResetLink);
        if (template == null)
        {
            return;
        }

        template.Layout = null;
        template.WithVirtualFilePath("/Emailing/Templates/PasswordResetLink.tpl", isInlineLocalized: true);
    }
}
