import { ImageSourcePropType } from 'react-native';

const seedDefault = require('../assets/seed-package/seed_default.png');
const seedGoldenTree = require('../assets/seed-package/seed_golden_tree.png');

const PACKAGE_IMAGES: Record<string, ImageSourcePropType> = {
    seed_default: seedDefault,
    default: seedDefault,
    seed_golden_tree: seedGoldenTree,
    golden_tree: seedGoldenTree,
};

const normalizeImageKey = (value?: string | null) =>
    value?.trim().toLowerCase().replace(/[\s-]+/g, '_') ?? '';

export const resolveSeedPackageImage = (
    packageImageKey?: string | null,
    packageName?: string,
): ImageSourcePropType => {
    const normalizedKey = normalizeImageKey(packageImageKey);
    const normalizedName = normalizeImageKey(packageName);

    if (PACKAGE_IMAGES[normalizedKey]) {
        return PACKAGE_IMAGES[normalizedKey];
    }

    if (normalizedKey.includes('gold') || normalizedName.includes('gold')) {
        return seedGoldenTree;
    }

    return seedDefault;
};
