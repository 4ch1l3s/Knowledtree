using Knowledtree.Friendships;
using Knowledtree.Tags;
using Knowledtree.Trees;
using Knowledtree.UserAvatars;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Volo.Abp.EntityFrameworkCore.Modeling;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.BackgroundJobs.EntityFrameworkCore;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EntityFrameworkCore;
using Volo.Abp.FeatureManagement.EntityFrameworkCore;
using Volo.Abp.Identity;
using Volo.Abp.Identity.EntityFrameworkCore;
using Volo.Abp.OpenIddict.EntityFrameworkCore;
using Volo.Abp.PermissionManagement.EntityFrameworkCore;
using Volo.Abp.SettingManagement.EntityFrameworkCore;
using Volo.Abp.TenantManagement;
using Volo.Abp.TenantManagement.EntityFrameworkCore;

namespace Knowledtree.EntityFrameworkCore;

[ReplaceDbContext(typeof(IIdentityDbContext))]
[ReplaceDbContext(typeof(ITenantManagementDbContext))]
[ConnectionStringName("Default")]
public class KnowledtreeDbContext :
    AbpDbContext<KnowledtreeDbContext>,
    IIdentityDbContext,
    ITenantManagementDbContext
{
    /* Add DbSet properties for your Aggregate Roots / Entities here. */

    // Ảnh đại diện người dùng
    public DbSet<UserAvatar> UserAvatars { get; set; }
    
    // Bang Tags
    public DbSet<Tag> Tags { get; set; }

    // Bang quan he ban be
    public DbSet<Friendship> Friendships { get; set; }

    // Bang cay va planting sessions
    public DbSet<Tree> Trees { get; set; }
    public DbSet<TreePool> TreePools { get; set; }
    public DbSet<TreePoolItem> TreePoolItems { get; set; }
    public DbSet<UserTree> UserTrees { get; set; }
    public DbSet<PlantingSession> PlantingSessions { get; set; }

    #region Entities from the modules

    /* Notice: We only implemented IIdentityDbContext and ITenantManagementDbContext
     * and replaced them for this DbContext. This allows you to perform JOIN
     * queries for the entities of these modules over the repositories easily. You
     * typically don't need that for other modules. But, if you need, you can
     * implement the DbContext interface of the needed module and use ReplaceDbContext
     * attribute just like IIdentityDbContext and ITenantManagementDbContext.
     *
     * More info: Replacing a DbContext of a module ensures that the related module
     * uses this DbContext on runtime. Otherwise, it will use its own DbContext class.
     */

    //Identity
    public DbSet<IdentityUser> Users { get; set; }
    public DbSet<IdentityRole> Roles { get; set; }
    public DbSet<IdentityClaimType> ClaimTypes { get; set; }
    public DbSet<OrganizationUnit> OrganizationUnits { get; set; }
    public DbSet<IdentitySecurityLog> SecurityLogs { get; set; }
    public DbSet<IdentityLinkUser> LinkUsers { get; set; }
    public DbSet<IdentityUserDelegation> UserDelegations { get; set; }
    public DbSet<IdentitySession> Sessions { get; set; }
    // Tenant Management
    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<TenantConnectionString> TenantConnectionStrings { get; set; }

    #endregion

    public KnowledtreeDbContext(DbContextOptions<KnowledtreeDbContext> options)
        : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        /* Include modules to your migration db context */

        builder.ConfigurePermissionManagement();
        builder.ConfigureSettingManagement();
        builder.ConfigureBackgroundJobs();
        builder.ConfigureAuditLogging();
        builder.ConfigureIdentity();
        builder.ConfigureOpenIddict();
        builder.ConfigureFeatureManagement();
        builder.ConfigureTenantManagement();

        /* Configure your own tables/entities inside here */

        // Cấu hình bảng ảnh đại diện
        builder.Entity<UserAvatar>(b =>
        {
            b.ToTable(KnowledtreeConsts.DbTablePrefix + "UserAvatars", KnowledtreeConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.UserId).IsRequired();
            b.Property(x => x.Content).IsRequired();
            b.Property(x => x.ContentType).IsRequired().HasMaxLength(UserAvatarConsts.MaxContentTypeLength);

            // Mỗi user chỉ có 1 avatar — FK cascade delete khi xóa user
            b.HasOne<IdentityUser>().WithOne().HasForeignKey<UserAvatar>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            b.HasIndex(x => x.UserId).IsUnique();
        });

        // Cấu hình bảng Tags
        builder.Entity<Tag>(b =>
        {
            b.ToTable(KnowledtreeConsts.DbTablePrefix + "Tags", KnowledtreeConsts.DbSchema);
            b.ConfigureByConvention(); // Tự động mapping PK, CreationTime, IsDeleted,...

            b.Property(x => x.Name).IsRequired().HasMaxLength(TagConsts.MaxNameLength);
            b.Property(x => x.ColorCode).IsRequired().HasMaxLength(TagConsts.MaxColorCodeLength);
            b.Property(x => x.UserId).IsRequired();

            // Moi quan he N-1 voi IdentityUser, cascade delete
            b.HasOne<IdentityUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // Cau hinh bang Friendships
        builder.Entity<Friendship>(b =>
        {
            b.ToTable(KnowledtreeConsts.DbTablePrefix + "Friendships", KnowledtreeConsts.DbSchema, t =>
            {
                // Khong cho phep tu ket ban voi chinh minh
                t.HasCheckConstraint("CK_Friendship_NotSelf", "\"UserId\" != \"FriendId\"");
            });
            b.ConfigureByConvention();

            b.Property(x => x.UserId).IsRequired();
            b.Property(x => x.FriendId).IsRequired();
            b.Property(x => x.Status).IsRequired();

            // FK cascade delete khi xoa user
            b.HasOne<IdentityUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<IdentityUser>().WithMany().HasForeignKey(x => x.FriendId).OnDelete(DeleteBehavior.Cascade);

            // Unique index: moi cap user chi co 1 record
            b.HasIndex(x => new { x.UserId, x.FriendId }).IsUnique();

            // Index cho truy van nguoc (tim loi moi gui cho minh)
            b.HasIndex(x => x.FriendId);
        });

        // Cau hinh bang Trees
        builder.Entity<Tree>(b =>
        {
            b.ToTable(KnowledtreeConsts.DbTablePrefix + "Trees", KnowledtreeConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Name).IsRequired().HasMaxLength(TreeConsts.MaxNameLength);
            b.Property(x => x.Description).HasMaxLength(TreeConsts.MaxDescriptionLength);
            b.Property(x => x.Rarity).IsRequired();
            b.Property(x => x.ImageKey).IsRequired().HasMaxLength(TreeConsts.MaxImageKeyLength);
            b.Property(x => x.BaseGoldYield).IsRequired();
        });

        // Cau hinh bang TreePools
        builder.Entity<TreePool>(b =>
        {
            b.ToTable(KnowledtreeConsts.DbTablePrefix + "TreePools", KnowledtreeConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.Name).IsRequired().HasMaxLength(TreePoolConsts.MaxNameLength);
            b.Property(x => x.PoolType).IsRequired();
            b.Property(x => x.CurrencyType).IsRequired();
            b.Property(x => x.Cost).IsRequired();
            b.Property(x => x.CommonRate).IsRequired().HasPrecision(5, 2);
            b.Property(x => x.RareRate).IsRequired().HasPrecision(5, 2);
            b.Property(x => x.GoldRate).IsRequired().HasPrecision(5, 2);
            b.Property(x => x.IsActive).IsRequired();

            b.HasIndex(x => x.IsActive);
        });

        // Cau hinh bang TreePoolItems
        builder.Entity<TreePoolItem>(b =>
        {
            b.ToTable(KnowledtreeConsts.DbTablePrefix + "TreePoolItems", KnowledtreeConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.TreePoolId).IsRequired();
            b.Property(x => x.TreeId).IsRequired();

            b.HasOne<TreePool>().WithMany().HasForeignKey(x => x.TreePoolId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<Tree>().WithMany().HasForeignKey(x => x.TreeId).OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(x => new { x.TreePoolId, x.TreeId }).IsUnique();
            b.HasIndex(x => x.TreeId);
        });

        // Cau hinh bang UserTrees
        builder.Entity<UserTree>(b =>
        {
            b.ToTable(KnowledtreeConsts.DbTablePrefix + "UserTrees", KnowledtreeConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.UserId).IsRequired();
            b.Property(x => x.TreeId).IsRequired();
            b.Property(x => x.FirstObtainedAt).IsRequired();
            b.Property(x => x.TotalObtainedCount).IsRequired().HasDefaultValue(1);
            b.Property(x => x.IsPlanted).IsRequired().HasDefaultValue(false);

            b.HasOne<IdentityUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<Tree>().WithMany().HasForeignKey(x => x.TreeId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne<TreePool>().WithMany().HasForeignKey(x => x.FirstObtainedFromPoolId).OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(x => new { x.UserId, x.TreeId }).IsUnique();
            b.HasIndex(x => x.TreeId);
            b.HasIndex(x => x.FirstObtainedFromPoolId);
        });

        // Cau hinh bang PlantingSessions
        builder.Entity<PlantingSession>(b =>
        {
            b.ToTable(KnowledtreeConsts.DbTablePrefix + "PlantingSessions", KnowledtreeConsts.DbSchema);
            b.ConfigureByConvention();

            b.Property(x => x.UserId).IsRequired();
            b.Property(x => x.TreePoolId).IsRequired();
            b.Property(x => x.PlannedDurationMinutes).IsRequired();
            b.Property(x => x.ClientStartTime).IsRequired();
            b.Property(x => x.ServerStartTime).IsRequired();
            b.Property(x => x.Status).IsRequired().HasDefaultValue(PlantingSessionStatus.Growing);
            b.Property(x => x.DuplicateGemReward).IsRequired().HasDefaultValue(0);

            b.HasOne<IdentityUser>().WithOne().HasForeignKey<PlantingSession>(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            b.HasOne<TreePool>().WithMany().HasForeignKey(x => x.TreePoolId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne<Tree>().WithMany().HasForeignKey(x => x.ResultTreeId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne<Tag>().WithMany().HasForeignKey(x => x.TagId).OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(x => x.UserId).IsUnique();
            b.HasIndex(x => x.TreePoolId);
            b.HasIndex(x => x.ResultTreeId);
            b.HasIndex(x => x.TagId);
            b.HasIndex(x => x.Status);
        });
    }
}
