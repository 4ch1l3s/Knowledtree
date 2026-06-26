import { ImageSourcePropType } from 'react-native';
import { TreeDto, TreeRarity } from '../api/store';

const goldenTree = require('../assets/trees/asset_golden_tree.png');

const normalizeImageKey = (value?: string | null) =>
    value?.trim().toLowerCase().replace(/[\s-]+/g, '_') ?? '';

const TREE_IMAGES: Record<string, ImageSourcePropType> = {
    asset_golden_tree: goldenTree,
    golden_tree: goldenTree,
    gold_tree: goldenTree,
    tree_gold: goldenTree,
};

export const getRarityLabel = (rarity: TreeRarity) => {
    switch (rarity) {
        case 1:
            return 'Rare';
        case 2:
            return 'Gold';
        default:
            return 'Common';
    }
};

export const getRarityColor = (rarity: TreeRarity) => {
    switch (rarity) {
        case 1:
            return '#3478A8';
        case 2:
            return '#B98216';
        default:
            return '#3B653F';
    }
};

export const resolveTreeImage = (tree?: Pick<TreeDto, 'imageKey' | 'name' | 'rarity'> | null): ImageSourcePropType => {
    const normalizedKey = normalizeImageKey(tree?.imageKey);
    const normalizedName = normalizeImageKey(tree?.name);

    if (TREE_IMAGES[normalizedKey]) {
        return TREE_IMAGES[normalizedKey];
    }

    if (normalizedKey.includes('gold') || normalizedName.includes('gold') || tree?.rarity === 2) {
        return goldenTree;
    }

    return goldenTree;
};
