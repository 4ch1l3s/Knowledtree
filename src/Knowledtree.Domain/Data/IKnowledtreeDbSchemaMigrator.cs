using System.Threading.Tasks;

namespace Knowledtree.Data;

public interface IKnowledtreeDbSchemaMigrator
{
    Task MigrateAsync();
}
