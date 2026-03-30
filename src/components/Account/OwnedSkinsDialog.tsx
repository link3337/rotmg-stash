import { useConstants } from '@providers/ConstantsProvider';
import { ClassID } from '@realm/renders/classes';
import { isPortraitReady, portrait, waitForPortraitReady } from '@utils/portrait';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Skeleton } from 'primereact/skeleton';
import { Tooltip } from 'primereact/tooltip';
import React from 'react';

interface OwnedSkinsDialogProps {
  visible: boolean;
  onHide: () => void;
  ownedSkinIds: string[];
  classFilter?: string;
}

const OwnedSkinsDialog: React.FC<OwnedSkinsDialogProps> = ({
  visible,
  onHide,
  ownedSkinIds,
  classFilter
}) => {
  const { constants } = useConstants();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [portraitReady, setPortraitReady] = React.useState(isPortraitReady());
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

  React.useEffect(() => {
    if (portraitReady || !visible || ownedSkinIds.length === 0) return;

    let cancelled = false;
    waitForPortraitReady().then(() => {
      if (!cancelled) {
        setPortraitReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [portraitReady, visible, ownedSkinIds.length]);

  const getSkinName = React.useCallback(
    (skinId: string) => constants?.skins?.[Number(skinId)]?.name || `Unknown Skin (${skinId})`,
    [constants?.skins]
  );

  const getClassName = React.useCallback(
    (classTypeId: number) =>
      constants?.classes?.[String(classTypeId) as ClassID]?.name ||
      `Unknown Class (${classTypeId})`,
    [constants?.classes]
  );

  const groupedSkins = React.useMemo(
    () =>
      ownedSkinIds.reduce(
        (acc, skinId) => {
          const skinData = constants?.skins?.[Number(skinId)];
          if (skinData) {
            const className = getClassName(skinData.classType);
            if (!acc[className]) {
              acc[className] = [];
            }
            acc[className].push(skinId);
          }
          return acc;
        },
        {} as Record<string, string[]>
      ),
    [ownedSkinIds, constants?.skins, getClassName]
  );

  const baseEntries = React.useMemo(
    () =>
      Object.entries(groupedSkins)
        .filter(([className]) => (classFilter ? className === classFilter : true))
        .sort(([classA], [classB]) => classA.localeCompare(classB)),
    [groupedSkins, classFilter]
  );

  const skinNameById = React.useMemo(() => {
    const result: Record<string, string> = {};

    baseEntries.forEach(([, skinIds]) => {
      skinIds.forEach((skinId) => {
        result[skinId] = getSkinName(skinId);
      });
    });

    return result;
  }, [baseEntries, getSkinName]);

  const spriteById = React.useMemo(() => {
    if (!portraitReady) return {} as Record<string, string>;

    const result: Record<string, string> = {};

    baseEntries.forEach(([, skinIds]) => {
      skinIds.forEach((skinId) => {
        result[skinId] = portrait(Number(skinId), Number(skinId), -1, -1);
      });
    });

    return result;
  }, [baseEntries, portraitReady]);

  const entries = React.useMemo(() => {
    return baseEntries
      .map(([className, skinIds]) => {
        const filteredSkinIds = normalizedQuery
          ? skinIds.filter((skinId) =>
              (skinNameById[skinId] || '').toLowerCase().includes(normalizedQuery)
            )
          : skinIds;

        return [className, filteredSkinIds] as const;
      })
      .filter(([, skinIds]) => skinIds.length > 0);
  }, [baseEntries, normalizedQuery, skinNameById]);

  const displayedCount = entries.reduce((sum, [, ids]) => sum + ids.length, 0);

  return (
    <Dialog
      header={
        classFilter
          ? `${classFilter} Skins (${displayedCount})`
          : `Total Skins Unlocked (${ownedSkinIds.length})`
      }
      visible={visible}
      onHide={() => {
        setSearchQuery('');
        onHide();
      }}
      style={{ width: '70vw' }}
      breakpoints={{ '960px': '90vw', '641px': '95vw' }}
      dismissableMask
      closeOnEscape
      modal
    >
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <InputText
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search skins"
          aria-label="Search skins"
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {ownedSkinIds.length === 0 ? (
          <p>No skins owned</p>
        ) : displayedCount === 0 ? (
          <p>No skins match "{searchQuery}"</p>
        ) : (
          <div>
            {entries.map(([className, skinIds]) => (
              <div key={className} style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>
                  {className} ({skinIds.length})
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: '1rem'
                  }}
                >
                  {skinIds.map((skinId) => {
                    const skinName = skinNameById[skinId] || getSkinName(skinId);
                    const spriteDataUrl = spriteById[skinId] || '';

                    return (
                      <div key={skinId} style={{ textAlign: 'center' }}>
                        <div className="skin-icon" data-pr-tooltip={skinName} tabIndex={0}>
                          {spriteDataUrl ? (
                            <img
                              src={spriteDataUrl}
                              alt={skinName}
                              style={{
                                width: '64px',
                                height: '64px',
                                imageRendering: 'pixelated',
                                cursor: 'pointer'
                              }}
                            />
                          ) : (
                            <Skeleton width="64px" height="64px" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Tooltip target=".skin-icon" position="bottom" showDelay={0} hideDelay={100} />
    </Dialog>
  );
};

export default OwnedSkinsDialog;
