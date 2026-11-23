import { TestBed } from '@angular/core/testing';
import { parseZzzMaterials } from '../../data/api-catalog';
import { GAMES, GameId } from '../../models/planner.model';
import { materialTierBorderColor, PlannerMaterialsComponent } from './planner-materials.component';

describe('planner material display', () => {
  it('animates recognized boss sheets and retains a still frame or placeholder as needed', () => {
    const materials = parseZzzMaterials({
      '110003': { name: 'Finale Dance Shoes', rank: 4, icon: 'ExBigBoss003' },
    });
    const fixture = TestBed.createComponent(PlannerMaterialsComponent);
    fixture.componentRef.setInput('groups', [{
      game: GAMES.find((game) => game.id === 'zzz')!,
      sections: [{ id: 'core', label: 'Core Skill', rows: [
        { materialId: 'zzz:110003', required: 1, owned: 0, missing: 1, characters: [] },
      ] }],
    }]);
    fixture.componentRef.setInput('materials', materials);
    fixture.componentRef.setInput('inventory', {});
    fixture.componentRef.setInput('unresolvedInventory', []);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const icon = root.querySelector<HTMLImageElement>('.sprite-icon img')!;
    const container = icon.parentElement!;
    const load = (width: number, height: number) => {
      Object.defineProperty(icon, 'naturalWidth', { configurable: true, value: width });
      Object.defineProperty(icon, 'naturalHeight', { configurable: true, value: height });
      icon.dispatchEvent(new Event('load'));
      fixture.detectChanges();
    };

    load(2048, 2048);
    expect(container.classList.contains('sprite-sheet')).toBeTrue();
    expect(icon.classList.contains('sprite-120')).toBeTrue();
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      const animation = icon.getAnimations()[0];
      expect(animation).toBeDefined();
      expect(container.clientHeight).toBeGreaterThan(0);
      animation.pause();
      animation.currentTime = 435;
      expect(parseFloat(getComputedStyle(icon).left)).toBeCloseTo(0, 1);
      expect(parseFloat(getComputedStyle(icon).top)).toBeCloseTo(-container.clientHeight, 1);
      animation.currentTime = 3990;
      expect(parseFloat(getComputedStyle(icon).left)).toBeCloseTo(-2 * container.clientWidth, 1);
      expect(parseFloat(getComputedStyle(icon).top)).toBeCloseTo(-9 * container.clientHeight, 1);
    } else {
      expect(icon.getAnimations().length).toBe(0);
    }
    load(2048, 1024);
    expect(icon.classList.contains('sprite-60')).toBeTrue();
    expect(icon.classList.contains('sprite-120')).toBeFalse();
    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      const animation = icon.getAnimations()[0];
      animation.pause();
      animation.currentTime = 1990;
      expect(parseFloat(getComputedStyle(icon).left)).toBeCloseTo(-7 * container.clientWidth, 1);
      expect(parseFloat(getComputedStyle(icon).top)).toBeCloseTo(-4 * container.clientHeight, 1);
    }
    load(2048, 512);
    expect(container.classList.contains('sprite-sheet')).toBeTrue();
    expect(icon.classList.contains('sprite-60')).toBeFalse();
    load(156, 156);
    expect(container.classList.contains('sprite-sheet')).toBeFalse();
    icon.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(root.querySelector('.material-icon-placeholder')).not.toBeNull();
    fixture.destroy();
  });

  it('uses the game-specific rarity scale and leaves unknown tiers unbordered', () => {
    const cases: { game: GameId; colors: string[] }[] = [
      { game: 'zzz', colors: ['#70c98a', '#68aef0', '#ae83e7', '#e8b85b'] },
      { game: 'wuwa', colors: ['#aeb6c2', '#70c98a', '#68aef0', '#ae83e7', '#e8b85b'] },
      { game: 'endfield', colors: ['#aeb6c2', '#70c98a', '#68aef0', '#ae83e7', '#e8b85b', '#e8894f'] },
    ];
    for (const { game, colors } of cases) {
      colors.forEach((color, index) => {
        expect(materialTierBorderColor({ id: 'item', game, name: 'Item', tier: index + 1 })).toBe(color);
      });
      expect(materialTierBorderColor({ id: 'item', game, name: 'Item' })).toBeUndefined();
      expect(materialTierBorderColor({ id: 'item', game, name: 'Item', tier: 99 })).toBeUndefined();
    }
    expect(materialTierBorderColor(undefined)).toBeUndefined();
  });

  it('sorts promotion families by descending tier and retains borders when an icon fails', () => {
    const materials = parseZzzMaterials({
      '100211': { name: 'Basic Attack Certification Seal', rank: 1 },
      '100221': { name: 'Advanced Attack Certification Seal', rank: 2 },
      '100231': { name: "Pioneer's Certification Seal", rank: 3, icon: 'Assets/AvatarRankDamage03.png' },
      '100212': { name: 'Basic Stun Certification Seal', rank: 1 },
      '100232': { name: 'Buster Certification Seal', rank: 3 },
      '471': { name: 'Seal of Contract', rank: 4 },
    });
    const fixture = TestBed.createComponent(PlannerMaterialsComponent);
    const rows = [...materials.keys()].map((materialId) => ({
      materialId, required: 1, owned: 0, missing: 1, characters: [],
    }));
    fixture.componentRef.setInput('groups', [{
      game: GAMES.find((game) => game.id === 'zzz')!,
      sections: [{ id: 'promotion', label: 'Promotion', rows }],
    }]);
    fixture.componentRef.setInput('materials', materials);
    fixture.componentRef.setInput('inventory', {});
    fixture.componentRef.setInput('unresolvedInventory', []);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const cards = Array.from(root.querySelectorAll<HTMLElement>('.material-card'));
    expect(cards.map((card) => card.querySelector('h4')?.textContent?.trim())).toEqual([
      "Pioneer's Certification Seal", 'Advanced Attack Certification Seal', 'Basic Attack Certification Seal',
      'Seal of Contract', 'Buster Certification Seal', 'Basic Stun Certification Seal',
    ]);
    const icon = cards[0].querySelector<HTMLImageElement>('img')!;
    expect(icon.style.borderColor).toBe('rgb(174, 131, 231)');
    icon.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    const placeholder = cards[0].querySelector<HTMLElement>('.material-icon-placeholder')!;
    expect(placeholder.classList.contains('tier-border')).toBeTrue();
    expect(placeholder.style.borderColor).toBe('rgb(174, 131, 231)');
    expect(cards[2].querySelector<HTMLElement>('.material-icon-placeholder')?.style.borderColor).toBe('rgb(112, 201, 138)');
    fixture.destroy();
  });
});
