using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Volo.Abp.Emailing;
using Volo.Abp.Emailing.Smtp;

namespace Knowledtree.Emailing;

public class ConfigurationSmtpEmailSenderConfiguration : ISmtpEmailSenderConfiguration
{
    private readonly IConfiguration _configuration;

    public ConfigurationSmtpEmailSenderConfiguration(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task<string> GetDefaultFromAddressAsync()
    {
        return Task.FromResult(GetRequired("Abp.Mailing.DefaultFromAddress"));
    }

    public Task<string> GetDefaultFromDisplayNameAsync()
    {
        return Task.FromResult(GetRequired("Abp.Mailing.DefaultFromDisplayName"));
    }

    public Task<string> GetHostAsync()
    {
        return Task.FromResult(GetRequired("Abp.Mailing.Smtp.Host"));
    }

    public Task<int> GetPortAsync()
    {
        var value = GetRequired("Abp.Mailing.Smtp.Port");
        return Task.FromResult(int.Parse(value));
    }

    public Task<string> GetUserNameAsync()
    {
        return Task.FromResult(GetRequired("Abp.Mailing.Smtp.UserName"));
    }

    public Task<string> GetPasswordAsync()
    {
        return Task.FromResult(GetRequired("Abp.Mailing.Smtp.Password"));
    }

    public Task<string?> GetDomainAsync()
    {
        return Task.FromResult(GetOptional("Abp.Mailing.Smtp.Domain"));
    }

    public Task<bool> GetEnableSslAsync()
    {
        return Task.FromResult(GetBool("Abp.Mailing.Smtp.EnableSsl"));
    }

    public Task<bool> GetUseDefaultCredentialsAsync()
    {
        return Task.FromResult(GetBool("Abp.Mailing.Smtp.UseDefaultCredentials"));
    }

    private string GetRequired(string name)
    {
        var value = GetOptional(name);

        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"Missing SMTP configuration value: {name}");
        }

        return value;
    }

    private string? GetOptional(string name)
    {
        return _configuration[name] ?? _configuration[$"Settings:{name}"];
    }

    private bool GetBool(string name)
    {
        var value = GetOptional(name);
        return !string.IsNullOrWhiteSpace(value) && bool.Parse(value);
    }
}
