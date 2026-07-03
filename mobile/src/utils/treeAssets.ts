import { ImageSourcePropType } from 'react-native';
import { TreeDto, TreeRarity } from '../api/store';

const defaultTree = require('../assets/trees/asset-default-tree.png');
const goldenTree = require('../assets/trees/asset_golden_tree.png');
const mapleTree = require('../assets/trees/asset_maple_tree.png');
const pineTree = require('../assets/trees/asset-pine-tree.png');
const redMapleTree = require('../assets/trees/asset_redmaple_tree.png');
const tropicalAlmondTree = require('../assets/trees/asset-tropical-amond-tree.png');

const normalizeImageKey = (value?: string | null) =>
    value?.trim().toLowerCase().replace(/[\s-]+/g, '_') ?? '';

const TREE_IMAGES: Record<string, ImageSourcePropType> = {
    asset_default_tree: defaultTree,
    default_tree: defaultTree,
    asset_golden_tree: goldenTree,
    golden_tree: goldenTree,
    gold_tree: goldenTree,
    tree_gold: goldenTree,
    asset_maple_tree: mapleTree,
    maple_tree: mapleTree,
    asset_pine_tree: pineTree,
    pine_tree: pineTree,
    asset_redmaple_tree: redMapleTree,
    asset_red_maple_tree: redMapleTree,
    redmaple_tree: redMapleTree,
    red_maple_tree: redMapleTree,
    asset_tropical_amond_tree: tropicalAlmondTree,
    asset_tropical_almond_tree: tropicalAlmondTree,
    tropical_amond_tree: tropicalAlmondTree,
    tropical_almond_tree: tropicalAlmondTree,
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

    if (TREE_IMAGES[normalizedKey]) {
        return TREE_IMAGES[normalizedKey];
    }

    return defaultTree;
};
