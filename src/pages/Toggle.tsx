import { settingsUi } from './settingsStyles';

/** A settings row that is a switch, for the grouped-row pages (Listen Together). */
export function Toggle({ label, detail, checked, onChange }: { label: string; detail?: string; checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className={settingsUi.controlRow}>
      <span className={settingsUi.rowText}>
        <span>{label}</span>
        {detail && <span className={settingsUi.rowDetail}>{detail}</span>}
      </span>
      <input type="checkbox" className={settingsUi.switch} checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} />
    </label>
  );
}
