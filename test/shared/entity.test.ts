import { describe, expect, it } from 'vitest';

import { Entity } from '../../src/shared/entity.js';
import { Identifier } from '../../src/shared/identifier.js';

type WidgetId = Identifier<'Widget'>;

class Widget extends Entity<WidgetId> {
  constructor(
    id: WidgetId,
    public name: string,
  ) {
    super(id);
  }
}

class Gadget extends Entity<Identifier<'Gadget'>> {
  public constructor(id: Identifier<'Gadget'>) {
    super(id);
  }
}

describe('Entity', () => {
  it('exposes its identifier via the id getter', () => {
    const id = Identifier.create<'Widget'>('widget-1');
    const widget = new Widget(id, 'Sprocket');
    expect(widget.id).toBe(id);
  });

  describe('equals', () => {
    it('returns true for two entities of the same subclass with equal identifiers, regardless of other state', () => {
      const id = Identifier.create<'Widget'>('widget-1');
      const a = new Widget(id, 'Sprocket');
      const b = new Widget(Identifier.create<'Widget'>('widget-1'), 'Renamed');
      expect(a.equals(b)).toBe(true);
    });

    it('returns false for entities with different identifiers', () => {
      const a = new Widget(Identifier.create<'Widget'>('widget-1'), 'Sprocket');
      const b = new Widget(Identifier.create<'Widget'>('widget-2'), 'Sprocket');
      expect(a.equals(b)).toBe(false);
    });

    it('returns true for reference equality', () => {
      const widget = new Widget(Identifier.create<'Widget'>('widget-1'), 'Sprocket');
      expect(widget.equals(widget)).toBe(true);
    });

    it('returns false when compared to null or undefined', () => {
      const widget = new Widget(Identifier.create<'Widget'>('widget-1'), 'Sprocket');
      expect(widget.equals(null)).toBe(false);
      // eslint-disable-next-line unicorn/no-useless-undefined -- argument is required
      expect(widget.equals(undefined)).toBe(false);
    });

    it('returns false when compared to a different Entity subclass, even with an equal-valued id', () => {
      const widget = new Widget(Identifier.create<'Widget'>('same'), 'Sprocket');
      const gadget = new Gadget(Identifier.create<'Gadget'>('same'));
      expect(widget.equals(gadget as unknown as Widget)).toBe(false);
    });
  });
});
