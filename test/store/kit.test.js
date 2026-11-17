import { beforeEach, describe, expect, it, vi } from 'vitest';
import { 
    kit, 
    getFamily, 
    resetKit, 
    resetKitVisibility, 
    setFamiliesVisibility, 
    toggleAllFamiliesVisibility, 
    toggleFamilyVisibility 
} from '../../src/store/kit';

describe('kit store', () => {
    const mockKit = {
        name: 'test-kit',
        families: [
            { name: 'family1', isVisible: true },
            { name: 'family2', isVisible: true }
        ]
    };

    beforeEach(() => {
        kit.set(JSON.parse(JSON.stringify(mockKit)));
    });

    it('getFamily returns family by name', () => {
        const family = getFamily('family1');
        expect(family.name).toBe('family1');
        
        expect(getFamily('nonexistent')).toBeUndefined();
    });

    it('resetKit clears the kit', () => {
        resetKit();
        expect(kit.get()).toBeNull();
    });

    it('resetKitVisibility makes all families visible', () => {
        const current = kit.get();
        current.families[0].isVisible = false;
        kit.set(current);

        resetKitVisibility();
        expect(kit.get().families[0].isVisible).toBe(true);
    });

    it('setFamiliesVisibility updates visibility from array', () => {
        setFamiliesVisibility([
            { name: 'family1', isVisible: false },
            { name: 'family2', isVisible: true }
        ]);
        
        expect(getFamily('family1').isVisible).toBe(false);
        expect(getFamily('family2').isVisible).toBe(true);
    });

    it('toggleAllFamiliesVisibility updates all', () => {
        toggleAllFamiliesVisibility(false);
        expect(getFamily('family1').isVisible).toBe(false);
        expect(getFamily('family2').isVisible).toBe(false);
        
        toggleAllFamiliesVisibility(true);
        expect(getFamily('family1').isVisible).toBe(true);
        expect(getFamily('family2').isVisible).toBe(true);
    });

    it('toggleFamilyVisibility toggles one family', () => {
        toggleFamilyVisibility('family1');
        expect(getFamily('family1').isVisible).toBe(false);
        
        toggleFamilyVisibility('family1');
        expect(getFamily('family1').isVisible).toBe(true);
    });
});
