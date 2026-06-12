namespace Knowledtree.Permissions;

public static class KnowledtreePermissions
{
    public const string GroupName = "Knowledtree";

    public static class UserAvatars
    {
        public const string Default = GroupName + ".UserAvatars";
        public const string Delete = Default + ".Delete";
    }

    public static class TreeManagement
    {
        public const string Default = GroupName + ".TreeManagement";

        public static class Trees
        {
            public const string Default = TreeManagement.Default + ".Trees";
            public const string Create = Default + ".Create";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
        }

        public static class TreePools
        {
            public const string Default = TreeManagement.Default + ".TreePools";
            public const string Create = Default + ".Create";
            public const string Update = Default + ".Update";
            public const string Delete = Default + ".Delete";
            public const string ManageItems = Default + ".ManageItems";
        }
    }
}
